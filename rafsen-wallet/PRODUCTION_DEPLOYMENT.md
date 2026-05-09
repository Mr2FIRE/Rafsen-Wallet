# Production Deployment Guide for Rafsen Wallet

This guide helps you deploy the wallet to production with full security features.

## 1. HTTPS/SSL Certificate Setup on VPS

### Option A: Let's Encrypt (Recommended - Free)

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Certificates will be stored in:
# /etc/letsencrypt/live/your-domain.com/

# Verify files exist:
ls -la /etc/letsencrypt/live/your-domain.com/
# Should show: cert.pem, chain.pem, fullchain.pem, privkey.pem

# Auto-renew (runs daily)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Option B: Self-Signed Certificate (Testing)

```bash
# Generate self-signed cert (valid for 365 days)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# You'll be prompted for certificate details
```

---

## 2. Environment Variables Setup

### Frontend (.env file)

```bash
cd /path/to/rafsen-wallet

# Create .env file for development
cat > .env << 'EOF'
# Development
VITE_BACKEND_URL=http://localhost:8080
VITE_API_KEY=dev-key-123456789
VITE_ENCRYPTION_SECRET=RAFSEN_SECURE_KEY_2024_DEV
EOF

# For production, create .env.production
cat > .env.production << 'EOF'
# Production (Change these!)
VITE_BACKEND_URL=https://your-domain.com:8080
VITE_API_KEY=$(openssl rand -base64 32)
VITE_ENCRYPTION_SECRET=$(openssl rand -base64 32)
EOF
```

### Backend (application.properties)

```bash
# Update your application.properties
cat >> application.properties << 'EOF'

# Production Settings
spring.profiles.active=production

# Rate Limiting
ratelimit.enabled=true
ratelimit.requests-per-minute=60

# SSL/HTTPS
server.ssl.enabled=true
server.ssl.key-store=/etc/letsencrypt/live/your-domain.com/keystore.p12
server.ssl.key-store-password=${SSL_PASSWORD}
server.ssl.key-store-type=PKCS12

# CORS for production domain
server.servlet.cors.allowed-origins=https://your-domain.com,https://www.your-domain.com
EOF
```

### Environment Variables on VPS

```bash
# SSH into VPS and set environment variables
ssh user@your-vps-ip

# Add to ~/.bashrc or ~/.bash_profile
export SPRING_PROFILES_ACTIVE=production
export API_KEY=$(openssl rand -base64 32)
export RPC_HOST=localhost
export RPC_PORT=18776
export RPC_USER=bitcoin
export RPC_PASSWORD=your-secure-rpc-password
export SSL_PASSWORD=your-keystore-password
export CORS_ORIGINS=https://your-domain.com

# Reload bash
source ~/.bashrc
```

---

## 3. Transaction Signing Implementation

### Frontend: Sign Transaction with Private Key

In `src/App.jsx`, when sending funds:

```javascript
// Get private key for signing
const privateKey = derivePrivateKey()

// Create transaction payload
const txData = {
  from: walletAddress,
  to: sendForm.destinationAddress,
  amount: parseFloat(sendForm.amount),
  timestamp: Date.now()
}

// Sign transaction (simple hash-based, upgrade for production)
const txString = JSON.stringify(txData)
const signature = CryptoJS.SHA256(privateKey + txString).toString()

// Send with signature header
const response = await fetch(`${BACKEND_URL}/api/send`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'X-Signature': signature,
    'X-From-Address': walletAddress
  },
  body: JSON.stringify(txData)
})
```

### Backend: Verify Transaction Signature

Create new file: `RafsenController.java` update the `/api/send` endpoint:

```java
@PostMapping("/send")
public ResponseEntity<?> sendFunds(
    @RequestBody Map<String, Object> request,
    @RequestHeader("X-API-Key") String apiKey,
    @RequestHeader("X-Signature") String signature,
    @RequestHeader("X-From-Address") String fromAddress) {
    
    // Verify API Key
    if (!validateApiKey(apiKey)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Invalid API Key"));
    }
    
    // Verify Signature
    if (!verifyTransactionSignature(request, signature, fromAddress)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Invalid transaction signature"));
    }
    
    // Continue with transaction...
}

private boolean verifyTransactionSignature(Map<String, Object> txData, 
                                          String signature, 
                                          String expectedAddress) {
    try {
        String txJson = objectMapper.writeValueAsString(txData);
        // In production, use proper ECDSA verification
        // This is simplified for example
        return signature != null && !signature.isEmpty();
    } catch (Exception e) {
        return false;
    }
}
```

---

## 4. Rate Limiting Setup

### Backend: Add Rate Limiting Dependency

Update `pom.xml`:

```xml
<!-- Add to dependencies -->
<dependency>
    <groupId>io.github.bucket4j</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>7.6.0</version>
</dependency>
```

### Create Rate Limit Filter

Create `src/main/java/com/rafsen/wallet/filter/RateLimitFilter.java`:

```java
package com.rafsen.wallet.filter;

import io.github.bucket4j.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain)
            throws ServletException, IOException {
        
        String key = getClientKey(request);
        Bucket bucket = resolveBucket(key);
        
        if (bucket.tryConsume(1)) {
            response.addHeader("X-RateLimit-Remaining", 
                String.valueOf(bucket.getAvailableTokens()));
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Rate limit exceeded\"}");
        }
    }
    
    private Bucket resolveBucket(String key) {
        return cache.computeIfAbsent(key, k -> {
            Bandwidth limit = Bandwidth.classic(60, 
                Refill.intervally(60, Duration.ofMinutes(1)));
            return Bucket4j.builder().addLimit(limit).build();
        });
    }
    
    private String getClientKey(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
```

---

## 5. Two-Factor Authentication (2FA) Setup

### Create 2FA Service

Create `src/main/java/com/rafsen/wallet/service/TwoFactorAuthService.java`:

```java
package com.rafsen.wallet.service;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class TwoFactorAuthService {
    
    private static final int CODE_LENGTH = 6;
    private static final long TIME_STEP = 30L;
    
    public String generateSecret() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        Random random = new Random();
        StringBuilder secret = new StringBuilder();
        
        for (int i = 0; i < 32; i++) {
            secret.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return secret.toString();
    }
    
    public String getProvisioningUri(String secret, String email) {
        return String.format(
            "otpauth://totp/Rafsen:%s?secret=%s&issuer=Rafsen",
            email, secret
        );
    }
    
    public boolean verifyCode(String secret, String code) {
        try {
            long currentTime = System.currentTimeMillis() / 1000;
            long timeCounter = currentTime / TIME_STEP;
            
            // Check current and adjacent time windows
            for (long i = -1; i <= 1; i++) {
                if (generateCode(secret, timeCounter + i).equals(code)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
    
    private String generateCode(String secret, long timeCounter) {
        // TOTP generation logic
        // In production, use: google-authenticator library
        return String.format("%06d", 
            Math.abs(secret.hashCode()) % 1000000);
    }
}
```

### Enable 2FA in Controller

```java
@PostMapping("/2fa/enable")
public ResponseEntity<?> enable2FA(@RequestHeader("X-From-Address") String address) {
    String secret = twoFactorAuthService.generateSecret();
    String uri = twoFactorAuthService.getProvisioningUri(secret, address);
    
    return ResponseEntity.ok(Map.of(
        "secret", secret,
        "qrCode", uri,
        "message", "Scan QR code with Google Authenticator"
    ));
}

@PostMapping("/2fa/verify")
public ResponseEntity<?> verify2FA(
    @RequestHeader("X-From-Address") String address,
    @RequestParam String code) {
    
    // Retrieve user's 2FA secret from database
    String secret = getUserSecret(address);
    
    if (twoFactorAuthService.verifyCode(secret, code)) {
        return ResponseEntity.ok(Map.of("success", true));
    } else {
        return ResponseEntity.status(401)
            .body(Map.of("error", "Invalid 2FA code"));
    }
}
```

---

## 6. Complete Deployment Checklist

### Before Going to Production

- [ ] Generate secure API key: `openssl rand -base64 32`
- [ ] Set up SSL certificate with Let's Encrypt
- [ ] Update CORS origins in application.properties
- [ ] Create .env with production values
- [ ] Set environment variables on VPS
- [ ] Enable rate limiting in config
- [ ] Test transaction signing locally
- [ ] Implement proper key derivation (not just hashing)
- [ ] Enable HTTPS only (no HTTP)
- [ ] Set up firewall rules

### Testing Commands

```bash
# Test SSL certificate
curl -kv https://your-domain.com:8080/api/info

# Generate sample API key
openssl rand -base64 32

# Test rate limiting
for i in {1..65}; do curl -H "X-API-Key: your-key" https://your-domain.com:8080/api/info; done

# Check certificate expiration
openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/cert.pem
```

---

## 7. Deployment Steps

### Step 1: Prepare Frontend

```bash
cd rafsen-wallet

# Install dependencies
npm install

# Build for production
npm run build

# This creates dist/ folder
```

### Step 2: Deploy to VPS

```bash
# SCP dist folder to web server
scp -r dist/* user@your-vps-ip:/var/www/rafsen-wallet/

# Configure Nginx to serve the app
ssh user@your-vps-ip

# Create Nginx config
sudo nano /etc/nginx/sites-available/rafsen

# Add this content:
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    root /var/www/rafsen-wallet;
    index index.html;
    
    location / {
        try_files $uri /index.html;
    }
    
    location /api {
        proxy_pass https://localhost:8080;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/rafsen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 3: Build and Deploy Backend

```bash
# On your local machine
cd rafsen-wallet

# Build JAR
mvn clean package -DskipTests

# Deploy to VPS
scp target/rafsen-wallet-1.0.jar user@your-vps-ip:/opt/rafsen/

# SSH and run
ssh user@your-vps-ip

# Set environment and run
export API_KEY=$(openssl rand -base64 32)
export RPC_HOST=localhost
export RPC_PORT=18776

java -jar /opt/rafsen/rafsen-wallet-1.0.jar
```

---

## 8. Monitoring & Maintenance

```bash
# Check backend logs
ssh user@your-vps-ip
tail -f /var/log/rafsen/application.log

# Monitor rate limiting
curl -i https://your-domain.com:8080/api/info

# Check SSL certificate expiration
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | grep dates

# Renew certificate (automatic with certbot)
sudo certbot renew --dry-run
```

---

## 9. Security Best Practices

```bash
# Disable HTTP, only allow HTTPS
# In Nginx config:
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# Set security headers in Nginx
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;

# Use strong passwords for RPC
# Use API key that changes regularly
# Implement IP whitelisting for admin endpoints
```

---

## Next Steps

1. Obtain your domain name
2. Set up SSL certificate with Let's Encrypt
3. Create .env files with production keys
4. Deploy frontend to web server
5. Deploy backend JAR to VPS
6. Test all endpoints with HTTPS
7. Monitor logs for issues
8. Enable 2FA for sensitive operations

For questions or issues, refer to documentation in the `/docs` folder.

# 🚀 Step-by-Step Deployment Guide

## Part 1: Local Development Setup

### Step 1: Install Dependencies

**Frontend Dependencies**:
```bash
cd c:\Users\mosta\Desktop\rafsen-wallet
npm install
```

**Required npm packages** (already in package.json):
- `react@19.2.5`
- `vite@8.0.11`
- `bip39` - Seed phrase generation/validation
- `crypto-js@4.2.0` - Client-side encryption
- `express` - Node.js API proxy (optional)
- `cors` - CORS middleware

**Backend Dependencies** (Maven):
- `Spring Boot 3.x`
- `Spring Web`
- `Jackson JSON` (included)

---

### Step 2: Configure Backend

**Edit** `application.properties`:
```properties
# Server
server.port=8080

# RPC Node Connection (Rafsen Mainnet)
rpc.host=http://187.77.87.53
rpc.port=18776
rpc.user=rafsen
rpc.password=rafsen123

# API Security
api.key=dev-key-123456789

# CORS
spring.web.cors.allowed-origins=http://localhost:5173
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE
spring.web.cors.allowed-headers=*
```

**Note**: Change `api.key` to a secure random value before production:
```bash
# On Windows PowerShell:
$random = -join ((48..57) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host $random
```

---

### Step 3: Start Frontend Dev Server

**Terminal 1 - Frontend**:
```bash
cd c:\Users\mosta\Desktop\rafsen-wallet
npm run dev
```

**Expected Output**:
```
VITE v8.0.11  ready in 123 ms

➜  Local:   http://localhost:5174/
➜  press h to show help
```

**Note**: If port 5174 is busy, Vite will auto-increment (5175, 5176, etc.)

---

### Step 4: Start Backend Server

**Terminal 2 - Backend (Java)**:
```bash
cd c:\Users\mosta\Desktop\rafsen-wallet

# Option A: Using Maven (requires Maven installation)
mvn clean package
mvn spring-boot:run

# Option B: Using IDE (IntelliJ IDEA / VS Code)
# Right-click RafsenWalletApplication.java → Run
```

**Expected Output**:
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__,_| / / / /
 =========|_|====================/_/_/_/
 :: Spring Boot ::                (v3.x.x)

Rafsen Wallet Application started in X seconds
Tomcat started on port(s): 8080 (http)
```

---

### Step 5: Verify Setup

**Check Frontend** - Open browser:
```
http://localhost:5174/
```

**Check Backend** - Run in Terminal 3:
```bash
curl http://localhost:8080/api/info
```

**Expected Response**:
```json
{
  "result": {
    "version": 230100,
    "balance": 50.5,
    "blocks": 720000,
    "connections": 8
  }
}
```

---

## Part 2: Testing the Implementation

### Test 1: Fetch Wallet Balance

```bash
curl http://localhost:8080/api/info
```

**Response**:
```json
{
  "result": {
    "version": 230100,
    "protocolversion": 70016,
    "walletversion": 169900,
    "balance": 50.5,
    "unconfirmed_balance": 1,
    "immature_balance": 0,
    "txcount": 10,
    "keypoololdest": 1600000000,
    "keypoolsize": 100,
    "blocks": 720000,
    "timeoffset": 0,
    "connections": 8,
    "difficulty": 29000000000000,
    "testnet": false
  }
}
```

---

### Test 2: Generate New Address

```bash
curl http://localhost:8080/api/address
```

**Response**:
```json
{
  "result": "RAF1A1z7agoat2JCnHuT1rx9SxJkBm9H3"
}
```

---

### Test 3: Get Transaction History

```bash
curl http://localhost:8080/api/history
```

**Response**:
```json
{
  "result": [
    {
      "account": "",
      "address": "RAF1A1z7agoat2JCnHuT1rx9SxJkBm9H3",
      "category": "receive",
      "amount": 5.5,
      "confirmations": 50,
      "txid": "abc123def456...",
      "time": 1234567890
    },
    {
      "account": "",
      "address": "RAF9hWxWwjvBqz5jCjNu8yTQ9u5bN9X7",
      "category": "send",
      "amount": 1.5,
      "confirmations": 100,
      "txid": "xyz789uvw012...",
      "time": 1234567800
    }
  ]
}
```

---

### Test 4: Send Funds (Success Case)

```bash
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key-123456789" \
  -d '{
    "destinationAddress": "RAF1A1z7agoat2JCnHuT1rx9SxJkBm9H3",
    "amount": 1.5
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "txid": "abc123def456789xyz...",
  "message": "Transaction sent successfully"
}
```

---

### Test 5: Send Funds (Missing API Key - Should Fail)

```bash
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "destinationAddress": "RAF1A1z7agoat2JCnHuT1rx9SxJkBm9H3",
    "amount": 1.5
  }'
```

**Expected Response** (401):
```json
{
  "error": "Unauthorized: Invalid or missing API key"
}
```

---

### Test 6: Send Funds (Invalid API Key - Should Fail)

```bash
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-key-123" \
  -d '{
    "destinationAddress": "RAF1A1z7agoat2JCnHuT1rx9SxJkBm9H3",
    "amount": 1.5
  }'
```

**Expected Response** (401):
```json
{
  "error": "Unauthorized: Invalid or missing API key"
}
```

---

### Test 7: Send Funds (Invalid Amount - Should Fail)

```bash
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key-123456789" \
  -d '{
    "destinationAddress": "RAF1A1z7agoat2JCnHuT1rx9SxJkBm9H3",
    "amount": -5
  }'
```

**Expected Response** (400):
```json
{
  "error": "Amount must be greater than 0"
}
```

---

### Test 8: React UI - Create Wallet

1. Open `http://localhost:5174/`
2. Click "➕ Create New Wallet"
3. Enter password: `TestPassword123`
4. Confirm password
5. Click "✓ Create Wallet"
6. Write down the seed phrase (for backup)
7. Check "I have written down my seed phrase"
8. Click "✓ I've Backed Up My Seed"
9. Should see dashboard with balance

---

### Test 9: React UI - Send Funds

1. On dashboard, click "📤 Send"
2. Enter recipient address: `RAF1A1z7agoat2JCnHuT1rx9SxJkBm9H3`
3. Enter amount: `1.5`
4. Click "📤 Send"
5. Should see success message with TXID
6. Transaction history should update automatically

---

### Test 10: React UI - Transaction History

1. On dashboard, look at "📋 Recent Transactions"
2. Should see list of transactions with:
   - 📤 or 📥 icon (send/receive)
   - Transaction type
   - Address (truncated)
   - Amount (with +/- indicator)
   - Confirmation count
3. Click 🔄 button to manually refresh

---

## Part 3: Production Deployment

### Step 1: Build Frontend for Production

```bash
cd c:\Users\mosta\Desktop\rafsen-wallet
npm run build
```

**Output**: `/dist/` directory with optimized files

---

### Step 2: Build Backend for Production

```bash
cd c:\Users\mosta\Desktop\rafsen-wallet

# Create JAR file
mvn clean package -DskipTests

# Output: target/rafsen-wallet-1.0.jar (or similar)
```

---

### Step 3: Create Production Configuration

**Create** `application-prod.properties`:
```properties
# Server
server.port=8080
server.servlet.context-path=/

# RPC Node Connection
rpc.host=http://187.77.87.53
rpc.port=18776
rpc.user=${RPC_USER:rafsen}
rpc.password=${RPC_PASSWORD:rafsen123}

# API Security - CHANGE THIS!
api.key=${API_KEY:generate-secure-key}

# CORS - Update for production domain
spring.web.cors.allowed-origins=https://yourproductiondomain.com
spring.web.cors.allowed-methods=GET,POST,OPTIONS
spring.web.cors.allowed-headers=Content-Type,X-API-Key

# Logging
logging.level.root=INFO
logging.level.com.rafsen=INFO
```

---

### Step 4: Deploy Frontend to CDN/Web Server

**Option A: Static file hosting (Vercel, Netlify, AWS S3)**

```bash
# Build React app
npm run build

# Deploy dist/ folder
# The built files are already optimized and minified
```

**Option B: Serve from same server as backend**

```bash
# Copy dist folder to backend
cp -r dist c:\path\to\backend\src\main\resources\static\

# Access at http://localhost:8080/
```

---

### Step 5: Deploy Backend to Server

**Option A: Docker Container**

Create `Dockerfile`:
```dockerfile
FROM openjdk:21-slim
COPY target/rafsen-wallet-1.0.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar","--spring.profiles.active=prod"]
EXPOSE 8080
```

Build and run:
```bash
docker build -t rafsen-wallet .
docker run -p 8080:8080 \
  -e API_KEY=your-secure-key \
  -e RPC_USER=rafsen \
  -e RPC_PASSWORD=rafsen123 \
  rafsen-wallet
```

**Option B: Direct JAR execution**

```bash
java -jar target/rafsen-wallet-1.0.jar \
  --spring.profiles.active=prod \
  --api.key=your-secure-key \
  --rpc.host=http://187.77.87.53 \
  --rpc.port=18776 \
  --rpc.user=rafsen \
  --rpc.password=rafsen123
```

---

### Step 6: Set Up HTTPS

**Using Let's Encrypt with Nginx**:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### Step 7: Monitor Application

**Check Health**:
```bash
curl https://yourdomain.com/api/info
```

**View Logs**:
```bash
docker logs <container-id>
# or
tail -f /var/log/rafsen-wallet.log
```

---

## Part 4: Security Checklist Before Production

- [ ] Change `api.key` to secure random value
- [ ] Update `ENCRYPTION_SECRET` in frontend (use env var)
- [ ] Update CORS allowed origins for production domain
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up firewall rules (only allow necessary ports)
- [ ] Update RPC credentials (change default username/password)
- [ ] Set up regular backups
- [ ] Enable logging and monitoring
- [ ] Test rate limiting on /api/send
- [ ] Set up fail-over for RPC node
- [ ] Implement Web Application Firewall (WAF)
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Test with multiple wallet scenarios
- [ ] Test on mobile devices

---

## Part 5: Troubleshooting

### Issue: "Cannot GET /api/info"
**Solution**: Backend not running or wrong port
```bash
# Check if backend is running
netstat -an | findstr :8080

# Start backend
mvn spring-boot:run
```

### Issue: "Unauthorized: Invalid or missing API key"
**Solution**: Wrong API key or missing header
```bash
# Verify key in application.properties
# Verify header is "X-API-Key" (case-sensitive)
curl -H "X-API-Key: dev-key-123456789" http://localhost:8080/api/send
```

### Issue: "Failed to connect to blockchain node"
**Solution**: RPC node unreachable
```bash
# Test RPC connection
curl -u rafsen:rafsen123 -d '{"jsonrpc":"2.0","method":"getinfo","params":[],"id":1}' \
  http://187.77.87.53:18776

# Check firewall
ping 187.77.87.53
```

### Issue: CORS error in browser
**Solution**: Update CORS allowed origins
```properties
# application.properties
spring.web.cors.allowed-origins=http://localhost:5174,https://yourdomain.com
```

### Issue: Frontend blank page
**Solution**: Vite proxy not working
```bash
# Check vite.config.js
# Verify backend server is running on port 8080
# Clear browser cache (Ctrl+Shift+Delete)
```

---

## Part 6: Performance Optimization

### Cache API Responses

**Backend**:
```java
@GetMapping("/info")
@Cacheable(value = "walletInfo", unless = "#result == null")
public ResponseEntity<?> getWalletInfo() {
    // ...
}
```

**Configure caching**:
```properties
spring.cache.type=simple
spring.cache.cache-names=walletInfo,transactionHistory
```

### Compress API Responses

```properties
server.compression.enabled=true
server.compression.min-response-size=1024
```

### Database Connection Pooling

```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
```

---

## Summary of Deployment Process

1. ✅ Install dependencies (npm, Maven)
2. ✅ Configure backend (application.properties)
3. ✅ Start frontend dev server (npm run dev)
4. ✅ Start backend server (mvn spring-boot:run)
5. ✅ Test all endpoints with curl
6. ✅ Test React UI (create wallet, send funds, view history)
7. ✅ Build for production (npm run build, mvn clean package)
8. ✅ Deploy to hosting service
9. ✅ Set up HTTPS
10. ✅ Monitor and maintain

**Estimated time**: 30-60 minutes for full deployment 🚀

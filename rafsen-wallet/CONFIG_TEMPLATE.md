# Rafsen Wallet - Environment Configuration Template

## Backend Configuration (.env.example or application.properties.example)

```properties
# ============================================
# SERVER CONFIGURATION
# ============================================
server.port=8080
server.servlet.context-path=/

# ============================================
# BLOCKCHAIN NODE RPC CONFIGURATION
# ============================================
# Update these with your actual blockchain node details
rpc.host=http://your-vps-ip-or-domain.com
rpc.port=18776
rpc.user=bitcoin
rpc.password=your-secure-rpc-password

# ============================================
# API SECURITY - CHANGE FOR PRODUCTION!
# ============================================
# Generate with: openssl rand -base64 32
api.key=dev-key-123456789

# ============================================
# CORS CONFIGURATION
# ============================================
# Update with your actual frontend URLs
server.servlet.cors.allowed-origins=http://localhost:5173,http://localhost:3000,https://your-frontend-domain.com
server.servlet.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
server.servlet.cors.allow-credentials=true

# ============================================
# LOGGING CONFIGURATION
# ============================================
logging.level.root=INFO
logging.level.com.rafsen=DEBUG
logging.file.name=logs/rafsen-wallet.log
```

## Frontend Configuration (.env.example)

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:8080

# Frontend environment
VITE_ENV=development

# API Configuration
VITE_API_KEY=dev-key-123456789
```

## Quick Start Script

### Linux/Mac: `setup.sh`

```bash
#!/bin/bash

echo "🚀 Rafsen Wallet Setup Script"

# Backend Setup
echo "📦 Setting up Java Backend..."
mvn clean install
cp application.properties.example application.properties

# Frontend Setup
echo "📦 Setting up React Frontend..."
cd src
npm install
cp .env.example .env.local
cd ..

echo "✅ Setup complete!"
echo "📝 Update application.properties with your RPC node details"
echo "📝 Update .env.local with your API key"
echo ""
echo "🎯 Next steps:"
echo "1. Backend: mvn spring-boot:run"
echo "2. Frontend: npm run dev"
echo "3. Open: http://localhost:5173"
```

### Windows: `setup.bat`

```batch
@echo off
echo 🚀 Rafsen Wallet Setup Script

echo 📦 Setting up Java Backend...
mvn clean install
copy application.properties.example application.properties

echo 📦 Setting up React Frontend...
cd src
call npm install
copy .env.example .env.local
cd ..

echo ✅ Setup complete!
echo 📝 Update application.properties with your RPC node details
echo 📝 Update .env.local with your API key
echo.
echo 🎯 Next steps:
echo 1. Backend: mvn spring-boot:run
echo 2. Frontend: npm run dev
echo 3. Open: http://localhost:5173
```

## Generate Secure API Key

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
$bytes = New-Object byte[] 32; 
$rng = [Security.Cryptography.RNGCryptoServiceProvider]::new(); 
$rng.GetBytes($bytes); 
[Convert]::ToBase64String($bytes)
```

## Docker Support (Optional)

### Dockerfile (Backend)

```dockerfile
FROM openjdk:21-slim

WORKDIR /app

COPY target/rafsen-wallet-backend-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      RPC_HOST: http://blockchain-node
      RPC_PORT: 18776
      RPC_USER: bitcoin
      RPC_PASSWORD: password
      API_KEY: ${API_KEY}
    networks:
      - rafsen-network

  frontend:
    image: node:18
    working_dir: /app
    volumes:
      - ./src:/app
    ports:
      - "5173:5173"
    command: npm run dev
    environment:
      VITE_BACKEND_URL: http://backend:8080
    networks:
      - rafsen-network

networks:
  rafsen-network:
```

## Production Deployment Checklist

- [ ] Generate secure API key with `openssl rand -base64 32`
- [ ] Update `api.key` in application.properties
- [ ] Configure correct blockchain node RPC credentials
- [ ] Set `rpc.host` to production node IP/domain
- [ ] Update CORS allowed-origins with production frontend URL
- [ ] Set `server.port` appropriately (use 8080 or behind reverse proxy)
- [ ] Enable HTTPS/SSL on backend
- [ ] Enable HTTPS on frontend (Vercel auto-enables)
- [ ] Test API key protection: `curl -X POST http://localhost:8080/api/send` should return 401
- [ ] Test with valid API key and confirm transaction works
- [ ] Set up monitoring and logging
- [ ] Configure backups for blockchain data
- [ ] Add rate limiting to /api/send endpoint
- [ ] Test all three endpoints in production environment
- [ ] Verify transaction history displays correctly
- [ ] Monitor for any errors in backend logs

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for sensitive data
3. **Rotate API keys** periodically
4. **Use HTTPS** in production
5. **Enable firewall rules** on VPS
6. **Rate limit** public endpoints
7. **Monitor logs** for suspicious activity
8. **Keep dependencies updated** regularly
9. **Use strong passwords** for RPC user
10. **Backup private keys** securely

## Support & Troubleshooting

If you encounter issues:
1. Check backend logs: `tail -f logs/rafsen-wallet.log`
2. Verify blockchain node is running: `curl http://node-ip:18776`
3. Test RPC connection: `curl -u bitcoin:password http://localhost:18776`
4. Check browser console for frontend errors
5. Verify API key in request headers matches backend config
6. Ensure CORS is configured for your frontend URL

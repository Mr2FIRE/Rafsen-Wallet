# 📋 Rafsen Wallet - Quick Reference Card

## 🔗 API Endpoints Quick Reference

### Get Wallet Info (Balance, Blocks, Peers)
```bash
GET http://localhost:8080/api/info

# Example response:
{
  "result": {
    "balance": 50.5,
    "blocks": 12345,
    "connections": 8
  }
}
```

### Generate New Address
```bash
GET http://localhost:8080/api/address

# Example response:
{
  "result": "rfsenN3qN3XxJ8pN3qN3XxJ8pN3qN3Xx"
}
```

### Send Funds (API Key Required ✅)
```bash
POST http://localhost:8080/api/send
Headers: 
  - Content-Type: application/json
  - X-API-Key: dev-key-123456789

Body:
{
  "destinationAddress": "rfsenReceiverAddress",
  "amount": 1.5
}

# Success response (200):
{
  "success": true,
  "txid": "abc123def456...",
  "message": "Transaction sent successfully"
}

# Unauthorized response (401):
{
  "error": "Unauthorized: Invalid or missing API key"
}
```

### Get Transaction History
```bash
GET http://localhost:8080/api/history

# Example response:
{
  "result": [
    {
      "account": "",
      "address": "rfsenReceiverAddress",
      "category": "send",
      "amount": -1.5,
      "confirmations": 5,
      "txid": "abc123..."
    },
    {
      "account": "",
      "address": "rfsenSenderAddress", 
      "category": "receive",
      "amount": 10.0,
      "confirmations": 10,
      "txid": "def456..."
    }
  ]
}
```

---

## 🚀 Quick Start Commands

### Backend
```bash
# Install dependencies
mvn clean install

# Run development server
mvn spring-boot:run

# Build production JAR
mvn clean package

# Run JAR
java -jar target/rafsen-wallet-backend-1.0.0.jar
```

### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

---

## ⚙️ Configuration Quick Reference

### Backend - application.properties
```properties
# Server
server.port=8080

# Node Connection
rpc.host=http://localhost
rpc.port=18776
rpc.user=bitcoin
rpc.password=password

# API Key (Change this!)
api.key=dev-key-123456789

# CORS
server.servlet.cors.allowed-origins=http://localhost:5173
```

### Frontend - localStorage
```javascript
// Set API key for requests
localStorage.setItem('rafsenapikey', 'dev-key-123456789')

// Get API key
localStorage.getItem('rafsenapikey')

// Clear API key
localStorage.removeItem('rafsenapikey')
```

---

## 🔐 API Key Management

### Generate Secure Key (for production)
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
$bytes = New-Object byte[] 32; $rng = [Security.Cryptography.RNGCryptoServiceProvider]::new(); $rng.GetBytes($bytes); [Convert]::ToBase64String($bytes)

# Example output: sJ2kL9mP1vX4qW3eR5tY6uI8oP0aS1dF2gH3jK4lM5nN=
```

### Update API Key on Backend
```properties
# application.properties
api.key=sJ2kL9mP1vX4qW3eR5tY6uI8oP0aS1dF2gH3jK4lM5nN=
```

### Update API Key on Frontend
```javascript
localStorage.setItem('rafsenapikey', 'sJ2kL9mP1vX4qW3eR5tY6uI8oP0aS1dF2gH3jK4lM5nN=')
```

---

## 🧪 Testing with curl

### Test Info Endpoint
```bash
curl http://localhost:8080/api/info
```

### Test Address Generation
```bash
curl http://localhost:8080/api/address
```

### Test Send Without API Key (Should Fail)
```bash
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "destinationAddress": "rfsenAddress",
    "amount": 1.0
  }'
```

### Test Send With API Key (Should Work)
```bash
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key-123456789" \
  -d '{
    "destinationAddress": "rfsenAddress",
    "amount": 1.0
  }'
```

### Test History
```bash
curl http://localhost:8080/api/history
```

---

## 🐛 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| "Failed to connect to blockchain node" | Check `rpc.host`, `rpc.port`, `rpc.user`, `rpc.password` in application.properties |
| "Unauthorized: Invalid or missing API key" | Add `-H "X-API-Key: dev-key-123456789"` header to POST request |
| CORS error in browser | Add frontend URL to `server.servlet.cors.allowed-origins` |
| Frontend won't load | Ensure backend is running and `http://localhost:8080` is accessible |
| Transactions not showing | Run `GET /api/history` to verify data exists at backend |
| "No transactions yet" message | Normal if wallet is new; send/receive a transaction first |

---

## 📦 File Structure Summary

```
Backend (Java Spring Boot):
├── RafsenController.java         ← Main API controller (4 endpoints)
├── WebConfig.java                ← CORS configuration
├── application.properties         ← Configuration values
├── pom.xml                       ← Maven dependencies
└── RafsenWalletApplication.java  ← Main app class

Frontend (React + Vite):
├── src/
│   ├── App.jsx                   ← Complete app with all features
│   ├── App.css                   ← Styling
│   ├── main.jsx                  ← Entry point
│   └── index.css                 ← Global styles
├── package.json                  ← Dependencies
├── vite.config.js                ← Vite configuration
└── index.html                    ← HTML template

Documentation:
├── SETUP_GUIDE.md                ← Complete setup instructions
├── CONFIG_TEMPLATE.md            ← Configuration templates
├── IMPLEMENTATION_SUMMARY.md     ← Feature summary
└── QUICK_REFERENCE.md            ← This file
```

---

## 🎯 Feature Checklist

- [x] **Send Funds Feature**
  - [x] Backend POST /api/send endpoint
  - [x] React form with address & amount inputs
  - [x] API key authentication
  - [x] Success/error messages
  - [x] Loading states
  
- [x] **Transaction Ledger Feature**
  - [x] Backend GET /api/history endpoint
  - [x] React data table with type, amount, address, confirmations, txid
  - [x] Auto-refresh every 10 seconds
  - [x] Manual refresh button
  - [x] Color-coded transaction types

- [x] **API Security**
  - [x] API key validation on /api/send
  - [x] Header-based X-API-Key check
  - [x] 401 Unauthorized response
  - [x] CORS configuration
  - [x] Environment-based configuration

---

## 🌐 Deployment Checklist

- [ ] Generate production API key with `openssl rand -base64 32`
- [ ] Update `application.properties` with production node IP
- [ ] Update CORS allowed-origins for production frontend URL
- [ ] Enable HTTPS/SSL on backend
- [ ] Set secure password for RPC user
- [ ] Test all endpoints with production credentials
- [ ] Monitor backend logs for errors
- [ ] Set up automated backups
- [ ] Configure rate limiting on /api/send
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to VPS
- [ ] Verify all three features work in production
- [ ] Monitor transaction confirmations

---

## 📞 Support Commands

**Check Backend Status**
```bash
curl -v http://localhost:8080/api/info
```

**Check Node Connection**
```bash
curl -u bitcoin:password http://localhost:18776
```

**View Backend Logs**
```bash
tail -f logs/rafsen-wallet.log
```

**Restart Backend (if needed)**
```bash
# Kill the process
kill $(lsof -t -i :8080)

# Start again
mvn spring-boot:run
```

---

**Documentation Last Updated:** May 8, 2026
**Version:** 1.0.0 - Full Release

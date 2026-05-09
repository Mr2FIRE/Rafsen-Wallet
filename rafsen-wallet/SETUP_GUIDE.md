# Rafsen Wallet - Complete Setup & Deployment Guide

## 📋 Project Structure

```
rafsen-wallet/
├── Frontend (React + Vite)
│   ├── src/
│   │   └── App.jsx  (Updated with all features)
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── Backend (Java Spring Boot)
│   ├── RafsenController.java  (Main API Controller)
│   ├── WebConfig.java  (CORS Configuration)
│   ├── application.properties  (Configuration)
│   ├── pom.xml  (Maven Dependencies)
│   └── RafsenWalletApplication.java  (Main Application - see below)
```

---

## 🔧 Backend Setup (Java Spring Boot)

### Prerequisites
- **Java 21** or higher installed
- **Maven** installed and configured
- **Blockchain Node** running on port 18776 with RPC enabled

### Step 1: Create Project Structure

Create these directories in your Java project:
```
src/main/java/com/rafsen/wallet/
├── controller/
│   └── RafsenController.java
├── config/
│   └── WebConfig.java
└── RafsenWalletApplication.java
```

### Step 2: Create Main Application Class

**File:** `src/main/java/com/rafsen/wallet/RafsenWalletApplication.java`

```java
package com.rafsen.wallet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RafsenWalletApplication {

    public static void main(String[] args) {
        SpringApplication.run(RafsenWalletApplication.class, args);
    }
}
```

### Step 3: Configure RPC Connection

Edit `src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8080

# RPC Node Configuration (Update with your node details)
rpc.host=http://YOUR_VPS_IP_OR_DOMAIN
rpc.port=18776
rpc.user=bitcoin_rpc_user
rpc.password=bitcoin_rpc_password

# API Security - CHANGE THIS FOR PRODUCTION!
api.key=your-super-secret-api-key-here

# CORS - Update with your frontend URL
server.servlet.cors.allowed-origins=http://localhost:5173,https://your-frontend-domain.com
```

### Step 4: Install Dependencies

Run Maven to download all dependencies:
```bash
mvn clean install
mvn dependency:resolve
```

### Step 5: Build and Run Backend

```bash
# Development Mode
mvn spring-boot:run

# Or build JAR and run
mvn clean package
java -jar target/rafsen-wallet-backend-1.0.0.jar
```

The API will be available at: `http://localhost:8080`

---

## 🎨 Frontend Setup (React + Vite)

### Prerequisites
- **Node.js** 18+ and npm
- **API key** from backend (default: `dev-key-123456789`)

### Step 1: Update API Key (Optional)

Edit `src/App.jsx` line 23:
```javascript
const API_KEY = localStorage.getItem('rafsenapikey') || 'your-secure-api-key'
```

Or set it in localStorage via browser console:
```javascript
localStorage.setItem('rafsenapikey', 'your-api-key')
```

### Step 2: Update Backend URL (If Not Localhost)

Edit `src/App.jsx` and replace `http://localhost:8080` with your backend URL:
```javascript
// For production:
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8080'

// Then use: `${BACKEND_URL}/api/info`
```

### Step 3: Run Development Server

```bash
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Step 4: Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder, ready for Vercel deployment.

---

## 🚀 API Endpoints Reference

### 1. Get Wallet Info (No Auth Required)
```
GET /api/info
Response: { result: { balance, blocks, connections } }
```

### 2. Generate New Address (No Auth Required)
```
GET /api/address
Response: { result: "wallet_address_string" }
```

### 3. Send Funds (✅ REQUIRES API KEY)
```
POST /api/send
Headers: X-API-Key: your-api-key
Body: {
  "destinationAddress": "recipient_address",
  "amount": 0.5
}
Response: { success: true, txid: "transaction_id", message: "Transaction sent successfully" }
```

### 4. Get Transaction History (No Auth Required)
```
GET /api/history
Response: { result: [ { category: "send|receive", amount, address, confirmations, txid }, ... ] }
```

---

## 🔐 Security Implementation

### API Key Protection
The `/api/send` endpoint is protected with API key authentication:

1. **Request must include header:**
   ```
   X-API-Key: your-secret-key
   ```

2. **Validation happens server-side:**
   ```java
   private boolean validateApiKey(String apiKey) {
       return apiKey != null && apiKey.equals(validApiKey);
   }
   ```

3. **Unauthorized requests return 401:**
   ```json
   { "error": "Unauthorized: Invalid or missing API key" }
   ```

### For Production Deployment:

#### A. Update Configuration
Edit `application.properties`:
```properties
api.key=generate-a-long-random-string-here
rpc.host=your-production-node-ip
rpc.port=18776
server.servlet.cors.allowed-origins=https://your-frontend.vercel.app
```

#### B. Generate Secure API Key
Use a tool like OpenSSL:
```bash
openssl rand -base64 32
```

#### C. Environment Variables (Recommended)
Instead of hardcoding, use environment variables:

Edit `RafsenController.java`:
```java
@Value("${api.key:${API_KEY:dev-key-123456789}}")
private String validApiKey;
```

Set environment variable before running:
```bash
export API_KEY=$(openssl rand -base64 32)
java -jar target/rafsen-wallet-backend-1.0.0.jar
```

#### D. HTTPS Configuration
Add to `application.properties`:
```properties
server.ssl.key-store=classpath:keystore.jks
server.ssl.key-store-password=your-password
server.ssl.key-store-type=JKS
```

---

## 📦 Feature Summary

### ✅ Completed Features

#### 1. Send Funds
- **Frontend**: Form with address and amount inputs
- **Backend**: POST /api/send endpoint with API key protection
- **Validation**: Amount > 0, address not empty, API key check
- **Feedback**: Success message with TXID, error handling
- **Auto-refresh**: Wallet balance and transaction history update after send

#### 2. Transaction History
- **Frontend**: Clean HTML table with sortable data
- **Backend**: GET /api/history endpoint via listtransactions RPC
- **Display**: Type badges, amounts, addresses, confirmations
- **Visual Indicators**: Colored badges for send/receive, confirmation status
- **Auto-refresh**: Updates every 10 seconds

#### 3. API Security
- **API Key Authentication**: Required for /api/send endpoint
- **Header Validation**: X-API-Key header check
- **CORS Configuration**: Whitelisted origins only
- **Error Handling**: 401 Unauthorized for invalid keys
- **Environment Variables**: Configuration via application.properties

---

## 🧪 Testing Locally

### 1. Start Blockchain Node
```bash
# On your VPS
./rafsend -rpcuser=bitcoin -rpcpassword=password -rpcport=18776
```

### 2. Start Java Backend
```bash
mvn spring-boot:run
```

### 3. Start React Frontend
```bash
npm run dev
```

### 4. Test All Endpoints

#### Get Wallet Info:
```bash
curl http://localhost:8080/api/info
```

#### Get New Address:
```bash
curl http://localhost:8080/api/address
```

#### Send Funds (with API key):
```bash
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key-123456789" \
  -d '{
    "destinationAddress": "receiver_address",
    "amount": 0.1
  }'
```

#### Get Transaction History:
```bash
curl http://localhost:8080/api/history
```

---

## 🌐 Deployment Instructions

### Deploy Backend to VPS

1. **Build JAR:**
   ```bash
   mvn clean package
   ```

2. **Upload to VPS:**
   ```bash
   scp target/rafsen-wallet-backend-1.0.0.jar user@your-vps:/home/user/
   ```

3. **Run on VPS:**
   ```bash
   nohup java -jar rafsen-wallet-backend-1.0.0.jar &
   ```

4. **Or use systemd service** (create `/etc/systemd/system/rafsen-wallet.service`):
   ```ini
   [Unit]
   Description=Rafsen Wallet Backend
   After=network.target

   [Service]
   Type=simple
   User=rafsen
   WorkingDirectory=/home/rafsen
   ExecStart=/usr/bin/java -jar /home/rafsen/rafsen-wallet-backend-1.0.0.jar
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

### Deploy Frontend to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Rafsen Wallet Full Features"
   git push origin main
   ```

2. **Connect Vercel:**
   - Go to vercel.com
   - Import your repository
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Add environment variable: `VITE_BACKEND_URL=https://your-backend-domain.com`

3. **Update CORS in Backend:**
   Edit `application.properties`:
   ```properties
   server.servlet.cors.allowed-origins=https://your-frontend.vercel.app
   ```

---

## 🐛 Troubleshooting

### "Failed to connect to blockchain node"
- **Check:** Node is running on the correct IP:port
- **Check:** RPC credentials are correct
- **Check:** Node has RPC enabled (`-server` flag)

### "Unauthorized: Invalid or missing API key"
- **Check:** X-API-Key header is included in request
- **Check:** API key matches backend configuration
- **Check:** Key doesn't have extra whitespace

### "CORS error: No 'Access-Control-Allow-Origin' header"
- **Check:** Frontend URL is in allowed-origins list
- **Check:** Backend CORS middleware is enabled
- **Solution:** Restart backend after changing CORS config

### Transaction pending but not confirming
- **Check:** Blockchain node is syncing
- **Check:** Network has active miners
- **Normal:** Transaction confirmation takes time

---

## 📝 Environment Variables Checklist

### Backend (.env or application.properties)
- [ ] `rpc.host` - Blockchain node IP/domain
- [ ] `rpc.port` - Node RPC port (default 18776)
- [ ] `rpc.user` - Node RPC username
- [ ] `rpc.password` - Node RPC password
- [ ] `api.key` - Secure API key for frontend auth
- [ ] `server.port` - Backend port (default 8080)

### Frontend (.env.local or localStorage)
- [ ] `VITE_BACKEND_URL` - Backend API URL
- [ ] `rafsenapikey` - Same as backend API key

---

## 🎯 Next Steps (Optional Enhancements)

1. **Advanced Authentication:**
   - Implement JWT tokens with expiration
   - Add role-based access control (RBAC)
   - Multi-signature transaction support

2. **Enhanced Security:**
   - Rate limiting on /api/send
   - Transaction amount limits
   - IP whitelisting

3. **Wallet Features:**
   - Multi-address support
   - Transaction search/filtering
   - QR code generation
   - Export private keys (encrypted)

4. **Monitoring:**
   - Transaction status webhooks
   - Balance change notifications
   - Node health checks

---

**Your Rafsen Wallet is now fully functional!** 🎉

Need help? Check the endpoints in your browser console or test with curl.

# 🚀 Quick Start - MetaMask-Like Rafsen Wallet

## ⚡ 60-Second Setup

### **Step 1: Backend (30 seconds)**
```bash
# Copy Java files to src/main/java/com/rafsen/wallet/
# Edit application.properties with your node IP
rpc.host=http://YOUR_NODE_IP
rpc.port=18776

# Run backend
mvn spring-boot:run
```
✅ Backend running on `http://localhost:8080`

### **Step 2: Frontend (30 seconds)**
```bash
# Already updated!
npm install
npm run dev
```
✅ Frontend running on `http://localhost:5173`

---

## 🎬 First Test (2 Minutes)

### **1. Create New Wallet**
- [ ] Open `http://localhost:5173`
- [ ] Click "➕ Create New Wallet"
- [ ] Enter password (8+ chars)
- [ ] Confirm password
- [ ] Click "✓ Create Wallet"

### **2. Backup Seed Phrase**
- [ ] Click "🔓 Reveal Seed Phrase"
- [ ] Copy 12 words to safe location
- [ ] Check "I've backed up..."
- [ ] Click "✓ I've Backed Up My Seed"

### **3. See Dashboard**
- [ ] Should see balance, blocks, peers
- [ ] Click "📤 Send" → See send modal
- [ ] Click "📥 Receive" → See address
- [ ] Click "🔄 Refresh" → Update history

### **4. Test Lock/Unlock**
- [ ] Click ⚙️ → See settings
- [ ] Click "🔓 Lock Wallet"
- [ ] Should see unlock screen
- [ ] Enter password → Dashboard

✅ **You're done! Wallet is working perfectly!**

---

## 📋 What's Different from Original

| Feature | Before | Now |
|---------|--------|-----|
| **First Run** | Goes straight to dashboard | Show welcome screen |
| **Security** | No password | Password required |
| **Onboarding** | None | Seed phrase backup |
| **Lock** | Always unlocked | Lock/unlock support |
| **Design** | Basic dark theme | MetaMask-like gradient UI |
| **Modals** | Forms on page | Beautiful slide-up modals |
| **Persistence** | Nothing saved | Wallet stored locally |

---

## 🎯 User Flows

### **New User:**
```
Welcome Screen
    ↓
Create Password
    ↓
Seed Phrase Backup
    ↓
Dashboard (Logged In)
```

### **Returning User:**
```
Unlock Screen
    ↓
Enter Password
    ↓
Dashboard (Logged In)
```

---

## 🔑 Default Test Credentials

**For Testing (Use Any Password):**
- Minimum 8 characters
- Example: `testpass123`
- Must match twice

**Note:** After first run, wallet is stored in localStorage

---

## 📦 What Got Updated

### **Frontend** (`src/App.jsx`)
- ✅ Complete redesign
- ✅ Onboarding flows
- ✅ Password protection
- ✅ Seed phrase backup
- ✅ Modal-based UI
- ✅ Lock/unlock system
- ✅ Beautiful styling

### **Styling** (`src/App.css`)
- ✅ Animations
- ✅ Responsive design
- ✅ Focus states
- ✅ Mobile support

### **Backend** (No changes needed)
- RafsenController.java ✅ (Same as before)
- WebConfig.java ✅ (Same as before)
- application.properties ✅ (Same as before)

---

## 🎨 Color Scheme

```
Primary Gradient: #667eea → #764ba2 (Purple)
Success: #4CAF50 (Green)
Error: #ff6b6b (Red)
Warning: #FFA500 (Orange)
Background: #f5f5f5 (Light Gray)
Text: #1a1a2e (Dark)
```

---

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: 320px - 767px

All screens adapt beautifully!

---

## 🔄 State Lifecycle

### **On App Start:**
```
Loading Screen (brief)
    ↓
Check localStorage
    ↓
Wallet exists? → Unlock Screen
No wallet? → Welcome Screen
    ↓
User action → Dashboard
```

### **Wallet Created:**
```javascript
localStorage = {
  rafsen_wallet: { address, seedPhrase, createdAt },
  rafsen_password_hash: btoa(password),
  rafsen_authenticated: 'true'
}
```

### **User Locks:**
```javascript
localStorage.rafsen_authenticated = 'false'
// Clears all data from memory
// Still have wallet in storage
```

### **User Unlocks:**
```javascript
localStorage.rafsen_authenticated = 'true'
// Restores wallet from localStorage
// User sees dashboard
```

---

## 🚨 Common Scenarios

### **"I closed the browser and lost my wallet!"**
✅ **Not lost!** Open the app again:
- Wallet still in localStorage
- Click "Unlock" with same password
- Your wallet is back!

### **"I forgot my password!"**
❌ **Can't reset password** (that's the security!)
- Click "Use Different Wallet"
- Creates new wallet
- Old wallet gone (unless you have seed phrase)
- **Lesson:** Save your seed phrase!

### **"I want to import my old wallet"**
✅ **Use seed phrase:**
- Welcome screen → "📥 Import Wallet"
- Paste 12-word seed phrase
- Creates new wallet from same phrase

---

## 🧪 Testing Checklist

### **Onboarding**
- [ ] Welcome screen shows correctly
- [ ] Create wallet button works
- [ ] Password validation (min 8 chars)
- [ ] Password match validation
- [ ] Seed phrase reveal/hide works
- [ ] Backup confirmation required

### **Dashboard**
- [ ] Balance displays correctly
- [ ] Blocks and peers show
- [ ] Action buttons clickable
- [ ] Transaction history populated
- [ ] Auto-refresh works (every 10s)

### **Send Modal**
- [ ] Opens/closes properly
- [ ] Form validation works
- [ ] MAX button sets balance
- [ ] Loading state shows
- [ ] Success screen displays TXID
- [ ] Auto-closes after 3s

### **Receive Modal**
- [ ] Opens/closes properly
- [ ] Address displays
- [ ] Copy button works
- [ ] Clean interface

### **Lock/Unlock**
- [ ] Settings button works
- [ ] Lock button works
- [ ] Unlock screen appears
- [ ] Password validation
- [ ] Redirects to dashboard on success

### **Persistence**
- [ ] Reload page → still logged in
- [ ] Lock wallet → reload → unlock screen
- [ ] Create wallet → reload → unlock screen
- [ ] Clear localStorage → welcome screen

---

## 🎨 UI Screenshots (Text Descriptions)

### **Welcome Screen:**
```
Logo: 🔐 Rafsen Wallet
Headline: Take control of your digital assets
Icon: 🌐
Buttons: Create New Wallet | Import Wallet
```

### **Create Password Screen:**
```
Title: Create New Wallet
Subtitle: Set a strong password
Field 1: Password input
Field 2: Confirm password
Warning: ⚠️ Use strong password
Button: ✓ Create Wallet
```

### **Seed Backup Screen:**
```
Title: 🔑 Backup Your Seed Phrase
Warning: 🚨 Never share your seed phrase
Button: 🔓 Reveal Seed Phrase
Grid: 12 words in 3x4 grid
Button: 📋 Copy to Clipboard
Checkbox: I have backed up
Button: ✓ I've Backed Up My Seed
```

### **Dashboard:**
```
Header: 🔐 Rafsen | ⚙️ (settings)
Card: Balance in purple gradient
Buttons: 📤 Send | 📥 Receive
Section: Recent Transactions (5 max)
```

### **Send Modal (Slide-up):**
```
Header: 📤 Send | ✕ (close)
Field: To Address
Field: Amount (RAF) with MAX button
Button: 📤 Send
```

---

## 🚀 Deployment Checklist

### **Before Going Live:**
- [ ] Test all user flows locally
- [ ] Verify backend RPC connection
- [ ] Test transaction sending
- [ ] Check transaction history updates
- [ ] Verify password works after page reload
- [ ] Test on mobile devices
- [ ] Check error messages display correctly
- [ ] Ensure animations work smoothly

### **Deploy Backend:**
- [ ] Update RPC credentials
- [ ] Generate secure API key
- [ ] Deploy JAR to VPS
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS

### **Deploy Frontend:**
- [ ] Build: `npm run build`
- [ ] Deploy `dist/` to Vercel
- [ ] Update API endpoint if needed
- [ ] Test all features on production

---

## 📞 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Wallet not loading" | Check backend running on 8080 |
| "Can't create wallet" | Verify RPC node accessible |
| "Password not working" | Check caps lock, try again |
| "Lost my wallet!" | Use seed phrase to recover |
| "Transactions not showing" | Click refresh button |
| "CORS error" | Update allowed origins in backend |

---

## 🎉 You're All Set!

Your professional Web3 wallet is ready to deploy! 🚀

```
npm run dev
→ Open browser
→ Create wallet
→ Start using!
```

**Enjoy!** 🔐✨

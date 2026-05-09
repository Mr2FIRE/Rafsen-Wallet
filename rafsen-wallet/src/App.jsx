import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import CryptoJS from 'crypto-js'
import { walletEngine } from './walletEngine'
import './App.css'

// Professional SVG Icons
const Icons = {
  Home: () => <svg className="svg-icon" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  Keys: () => <svg className="svg-icon" viewBox="0 0 24 24"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>,
  Lock: () => <svg className="svg-icon" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
};

function App() {
  const [screen, setScreen] = useState('loading')
  const [walletAddress, setWalletAddress] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // App State
  const [userBalance, setUserBalance] = useState(0)
  const [nodeData, setNodeData] = useState({ blocks: 0 })
  const [transactions, setTransactions] = useState([])
  
  // Modals & Forms
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showKeysModal, setShowKeysModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [importSeed, setImportSeed] = useState('')
  const [sendForm, setSendForm] = useState({ to: '', amount: '' })
  const [keyPasswordInput, setKeyPasswordInput] = useState('') 
  const [privateKeyDisplay, setPrivateKeyDisplay] = useState('')
  const [loading, setLoading] = useState(false)

  // Vercel Ready Backend Connection
  const BACKEND_URL = 'https://rafsen.duckdns.org'
  const ENCRYPTION_SECRET = 'RAFSEN_SECURE_KEY_2026'

  const encryptData = (data, password) => CryptoJS.AES.encrypt(data, password + ENCRYPTION_SECRET).toString()
  const decryptData = (encrypted, password) => CryptoJS.AES.decrypt(encrypted, password + ENCRYPTION_SECRET).toString(CryptoJS.enc.Utf8)
  const hashPassword = (password) => CryptoJS.SHA256(password + ENCRYPTION_SECRET).toString()

  // 1. App Initialization
  useEffect(() => {
    const storedWallet = localStorage.getItem('rafsen_wallet')
    const isAuth = localStorage.getItem('rafsen_authenticated') === 'true'
    if (storedWallet) {
      setWalletAddress(JSON.parse(storedWallet).address)
      if (isAuth) { setIsAuthenticated(true); setScreen('dashboard') } 
      else { setScreen('unlock') }
    } else { setScreen('welcome') }
  }, [])

  // 2. The Sync Engine
  useEffect(() => {
    if (screen === 'dashboard' && isAuthenticated) {
      fetchWalletData()
      const interval = setInterval(fetchWalletData, 10000)
      return () => clearInterval(interval)
    }
  }, [screen, isAuthenticated])

  const fetchWalletData = async () => {
    try {
      // 1. Get Network Info (Blocks) from your Java Backend
      const infoRes = await fetch(`${BACKEND_URL}/api/info`);
      const info = await infoRes.json();
      if (info.result) setNodeData(info.result);

      const storedWallet = JSON.parse(localStorage.getItem('rafsen_wallet'));
      if (storedWallet && storedWallet.address) {
          
          // 2. Calculate Accurate User Balance from UTXOs
          const utxoRes = await fetch(`${BACKEND_URL}/api/utxos`, {
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: storedWallet.address })
          });
          const utxos = (await utxoRes.json()).result || [];
          setUserBalance(utxos.reduce((total, utxo) => total + utxo.amount, 0));

          // 3. Get Real History from the Public Explorer
          const localSends = JSON.parse(localStorage.getItem('rafsen_local_sends') || '[]');
          let combinedHistory = [...localSends];

          try {
              // Try the standard Insight API path
              const explorerRes = await fetch(`https://www.rafsencoin.com/api/txs?address=${storedWallet.address}`);
              
              if (explorerRes.ok) {
                  const explorerData = await explorerRes.json();
                  
                  if (explorerData && explorerData.txs) {
                      const realHistory = explorerData.txs.map(tx => {
                          // Figure out if we are the sender or receiver
                          const isSender = tx.vin.some(input => input.addr === storedWallet.address);
                          
                          return {
                              category: isSender ? 'send' : 'receive',
                              address: tx.txid, // Display the TXID for better UI tracking
                              amount: tx.vout.reduce((total, output) => {
                                  // If we sent it, sum the outputs NOT going to us (the actual send amount)
                                  if (isSender && output.scriptPubKey.addresses && !output.scriptPubKey.addresses.includes(storedWallet.address)) {
                                      return total + parseFloat(output.value);
                                  }
                                  // If we received it, sum the outputs GOING to us
                                  if (!isSender && output.scriptPubKey.addresses && output.scriptPubKey.addresses.includes(storedWallet.address)) {
                                      return total + parseFloat(output.value);
                                  }
                                  return total;
                              }, 0),
                              time: tx.time || Date.now() / 1000
                          };
                      });
                      
                      const cleanHistory = realHistory.filter(tx => tx.amount > 0);
                      combinedHistory = [...localSends, ...cleanHistory];
                  }
              } else {
                  console.log("Insight API failed, might be a different explorer type.");
              }
          } catch (explorerErr) {
              console.warn("Could not fetch from explorer:", explorerErr);
          }
          
          // Sort history to show newest first
          combinedHistory.sort((a, b) => b.time - a.time);
          
          // Deduplicate: If a local send is now confirmed on the explorer, only show the confirmed one
          const uniqueHistory = combinedHistory.filter((tx, index, self) => 
              index === self.findIndex((t) => (t.address === tx.address && t.amount === tx.amount))
          );

          setTransactions(uniqueHistory);
      }
    } catch (err) { 
      console.error('Cloud Sync Failed:', err); 
    }
  };

  // 3. User Actions
  const createWallet = () => {
    if (passwordInput.length < 6) return alert("Password too short.")
    const data = walletEngine.createNewWallet()
    const encryptedWIF = encryptData(data.privateKeyWIF, passwordInput)
    localStorage.setItem('rafsen_wallet', JSON.stringify({ address: data.address, encryptedWIF }))
    localStorage.setItem('rafsen_password_hash', hashPassword(passwordInput))
    localStorage.setItem('rafsen_authenticated', 'true')
    window.location.reload()
  }

  const importWallet = () => {
    if (passwordInput.length < 6) return alert("Password too short.")
    if (!importSeed) return alert("Please enter your seed phrase.")
    try {
      const data = walletEngine.restoreWallet(importSeed)
      const encryptedWIF = encryptData(data.privateKeyWIF, passwordInput)
      localStorage.setItem('rafsen_wallet', JSON.stringify({ address: data.address, encryptedWIF }))
      localStorage.setItem('rafsen_password_hash', hashPassword(passwordInput))
      localStorage.setItem('rafsen_authenticated', 'true')
      window.location.reload()
    } catch (e) { alert("Invalid Seed Phrase. Please check for typos.") }
  }

  const unlockWallet = () => {
    if (hashPassword(passwordInput) === localStorage.getItem('rafsen_password_hash')) {
      localStorage.setItem('rafsen_authenticated', 'true')
      setIsAuthenticated(true); setScreen('dashboard')
    } else { alert("Incorrect Password") }
  }

  // 4. The God-Mode Send Engine
  const handleSendFunds = async () => {
    if (!sendForm.to || !sendForm.amount) return alert("Fill all fields.")
    setLoading(true)
    try {
      const inputPass = prompt("Verify Vault Password to Sign:")
      if (!inputPass || hashPassword(inputPass) !== localStorage.getItem('rafsen_password_hash')) throw new Error("Unauthorized")

      const storedWallet = JSON.parse(localStorage.getItem('rafsen_wallet'))
      const privKey = decryptData(storedWallet.encryptedWIF, inputPass)

      const utxoRes = await fetch(`${BACKEND_URL}/api/utxos`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: walletAddress })
      })
      const utxos = (await utxoRes.json()).result || []
      if (utxos.length === 0) throw new Error("No available balance.")
      
      for (let i = 0; i < utxos.length; i++) {
          const raw = await fetch(`${BACKEND_URL}/api/getrawtx`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ txid: utxos[i].txid })
          })
          utxos[i].rawHex = (await raw.json()).result
      }

      const signedHex = walletEngine.buildAndSignTx(walletAddress, sendForm.to, sendForm.amount, utxos, privKey)

      const broadcast = await fetch(`${BACKEND_URL}/api/broadcast`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawtx: signedHex })
      })
      const result = await broadcast.json()
      if (result.error) throw new Error(result.error)

      // Save Outgoing Transaction to Local Memory immediately
      const newSendTx = { 
        category: 'send', 
        address: sendForm.to, 
        amount: Number(sendForm.amount),
        time: Date.now() / 1000
      };
      const savedSends = JSON.parse(localStorage.getItem('rafsen_local_sends') || '[]');
      localStorage.setItem('rafsen_local_sends', JSON.stringify([newSendTx, ...savedSends]));

      alert("Success! TXID: " + result.result)
      setShowSendModal(false); fetchWalletData()
    } catch (err) { alert(err.message) }
    setLoading(false)
  }

  // --- VIEWS ---
  if (screen === 'loading') return <div className="app-container" style={{justifyContent:'center', alignItems:'center'}}>Syncing...</div>

  if (screen === 'welcome') return (
    <div className="app-container" style={{justifyContent: 'center', padding: '0 30px', textAlign: 'center'}}>
      <h1>Rafsen Wallet</h1>
      <p style={{color: '#8b949e', marginBottom: '30px'}}>Create a secure master password.</p>
      <input type="password" placeholder="Master Password" onChange={e => setPasswordInput(e.target.value)} />
      <button onClick={createWallet} className="btn-primary">Create New Vault</button>
      <button onClick={() => setScreen('import')} className="btn-secondary">Import Existing Wallet</button>
    </div>
  )

  if (screen === 'import') return (
    <div className="app-container" style={{justifyContent: 'center', padding: '0 30px', textAlign: 'center'}}>
      <h2>Import Wallet</h2>
      <p style={{color: '#8b949e', fontSize: '13px', marginBottom: '20px'}}>Enter your 12-word seed phrase to restore your funds.</p>
      <textarea placeholder="Paste Seed Phrase here..." rows="3" onChange={e => setImportSeed(e.target.value)} style={{width: '100%', padding: '14px', borderRadius: '10px', background: '#080a0c', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '15px'}}></textarea>
      <input type="password" placeholder="Create New Master Password" onChange={e => setPasswordInput(e.target.value)} />
      <button onClick={importWallet} className="btn-primary">Restore Wallet</button>
      <button onClick={() => setScreen('welcome')} className="btn-secondary">Cancel</button>
    </div>
  )

  if (screen === 'unlock') return (
    <div className="app-container" style={{justifyContent: 'center', padding: '0 30px', textAlign: 'center'}}>
      <h2>Vault Locked</h2>
      <input type="password" placeholder="Enter Password" onChange={e => setPasswordInput(e.target.value)} />
      <button onClick={unlockWallet} className="btn-primary">Unlock</button>
      <button onClick={() => {
        if(window.confirm("WARNING: This will wipe your current vault. Ensure you have your seed phrase saved!")) {
          localStorage.clear(); window.location.reload();
        }
      }} className="btn-secondary" style={{border: 'none', marginTop: '20px', color: '#ff7b72'}}>Wipe & Reset App</button>
    </div>
  )

  if (screen === 'dashboard') return (
    <div className="app-container">
      <div className="wallet-content">
        <header className="dash-header">
          <h2 className="portfolio-title">Rafsen Wallet</h2>
          <span className="status-pill">Mainnet Live</span>
        </header>

        <section className="balance-card">
          <h4>My Balance</h4>
          <h1>{userBalance} <span>RAF</span></h1>
          <p style={{color: '#8b949e', fontSize: '12px', margin: 0}}>Network Blocks: {nodeData.blocks}</p>
          <div className="balance-actions">
            <button onClick={() => setShowSendModal(true)} className="btn-balance btn-send">↗ Send</button>
            <button onClick={() => setShowReceiveModal(true)} className="btn-balance btn-receive">↙ Receive</button>
          </div>
        </section>

        <section className="content-section">
          <h3>Assets</h3>
          <div className="item-card">
            <div className="item-left">
              <div className="item-icon" style={{color: '#34EAB4'}}>R</div>
              <div className="item-details"><h4>Rafsen</h4><p>RAF</p></div>
            </div>
            <div className="text-green">{userBalance}</div>
          </div>
        </section>

        <section className="content-section">
          <h3>Recent Transactions</h3>
          <div className="tx-list">
            {transactions.length > 0 ? transactions.map((tx, i) => (
              <div key={i} className="item-card" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                  <span>{tx.category === 'receive' ? 'Incoming' : 'Outgoing'}</span>
                  <span className={tx.category === 'receive' ? 'text-green' : 'text-red'}>
                    {tx.category === 'receive' ? '+' : '-'}{tx.amount} RAF
                  </span>
                </div>
                <span style={{fontSize: '11px', color: '#8b949e', marginTop: '6px'}}>{tx.address.slice(0, 20)}...</span>
              </div>
            )) : <p style={{fontSize: '13px', color: '#8b949e'}}>No transactions found.</p>}
          </div>
        </section>
      </div>

      <nav className="bottom-nav">
        <div className="nav-item active"><Icons.Home />Home</div>
        <div className="nav-item" onClick={() => setShowKeysModal(true)}><Icons.Keys />Keys</div>
        <div className="nav-item" onClick={() => {localStorage.setItem('rafsen_authenticated', 'false'); window.location.reload()}}><Icons.Lock />Lock</div>
      </nav>

      {/* --- MODALS --- */}
      {showSendModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Send RAF</h3>
            <input type="text" placeholder="Recipient Address" onChange={e => setSendForm({...sendForm, to: e.target.value})} />
            <input type="number" placeholder="Amount" onChange={e => setSendForm({...sendForm, amount: e.target.value})} />
            <button onClick={handleSendFunds} className="btn-primary" disabled={loading}>{loading ? "Signing..." : "Verify & Broadcast"}</button>
            <button onClick={() => setShowSendModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {showReceiveModal && (
        <div className="modal-overlay">
          <div className="modal" style={{textAlign: 'center'}}>
            <h3>Receive</h3>
            <div style={{background: 'white', padding: '15px', borderRadius: '15px', display: 'inline-block'}}><QRCodeSVG value={walletAddress} size={180} /></div>
            <p style={{fontSize: '11px', color: '#2AC1E9', wordBreak: 'break-all', marginTop: '20px'}}>{walletAddress}</p>
            <button onClick={() => setShowReceiveModal(false)} className="btn-primary" style={{marginTop: '10px'}}>Done</button>
          </div>
        </div>
      )}

      {showKeysModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Secret Keys</h3>
            {!privateKeyDisplay ? (
              <>
                <p style={{fontSize: '12px', color: '#8b949e'}}>Enter your password to reveal your 12-word seed phrase. Do not share this with anyone.</p>
                <input type="password" placeholder="Vault Password" onChange={e => setKeyPasswordInput(e.target.value)} />
                <button onClick={() => {
                  if (hashPassword(keyPasswordInput) === localStorage.getItem('rafsen_password_hash')) {
                    // Fetch mnemonic from local storage if available, otherwise just show WIF
                    const wif = decryptData(JSON.parse(localStorage.getItem('rafsen_wallet')).encryptedWIF, keyPasswordInput)
                    setPrivateKeyDisplay(`WIF Key:\n${wif}`)
                  } else alert("Wrong Password")
                }} className="btn-primary" style={{background: '#ff7b72'}}>Reveal Keys</button>
              </>
            ) : <div style={{wordBreak: 'break-all', color: '#ff7b72', background: '#000', padding: '15px', borderRadius: '10px', fontSize: '12px', whiteSpace: 'pre-wrap'}}>{privateKeyDisplay}</div>}
            <button onClick={() => {setShowKeysModal(false); setPrivateKeyDisplay('')}} className="btn-secondary">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
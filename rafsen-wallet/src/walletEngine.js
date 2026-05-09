<<<<<<< HEAD
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import topLevelAwait from "vite-plugin-top-level-await"

export default defineConfig({
  plugins: [
    react(),
    topLevelAwait(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@bitcoinerlab/secp256k1']
  }
})
=======
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as eccOriginal from '@bitcoinerlab/secp256k1';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';

// 1. Browser Buffer Polyfill
window.Buffer = window.Buffer || Buffer;

// 2. Create a mutable COPY of the library to bypass strict import rules
const ecc = { ...eccOriginal };

// 3. Add the missing privateNegate function (The Hacker Shim)
if (!ecc.privateNegate) {
  ecc.privateNegate = (key) => ecc.privateSub(Buffer.alloc(32).fill(0), key);
}

// 4. Initialize ECPair with our patched library
const ECPair = ECPairFactory(ecc);

// ==========================================
// WALLET CORE FUNCTIONS
// ==========================================

export const generateWallet = () => {
  const mnemonic = bip39.generateMnemonic();
  return restoreWallet(mnemonic);
};

export const restoreWallet = (mnemonic) => {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase");
  }

  const seed = bip39.mnemonicToSeedSync(mnemonic);
  
  // Create a master node (Standard BIP32/BIP44 derivation can be added here if needed)
  // For simplicity, we are creating a keypair directly from the seed hash
  const hash = bitcoin.crypto.sha256(seed);
  const keyPair = ECPair.fromPrivateKey(hash);

  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

  return {
    address,
    privateKey: keyPair.toWIF(),
    mnemonic
  };
};

// ==========================================
// TRANSACTION ENGINE
// ==========================================

// Safe Add Output - prevents the "Error adding output" crash
const safeAddOutput = (txBuilder, address, amount) => {
  try {
    txBuilder.addOutput(address, amount);
  } catch (error) {
    console.error("Failed to add standard output, attempting fallback...", error);
    // Fallback logic if needed, or simply throw a cleaner error
    throw new Error(`Invalid address or amount: ${address} / ${amount}`);
  }
};

export const buildAndSignTx = (privateKeyWIF, unspentOutputs, toAddress, amountToEnv, fee) => {
  const keyPair = ECPair.fromWIF(privateKeyWIF);
  const txBuilder = new bitcoin.TransactionBuilder(); // Note: adjust network if using Testnet

  let totalInput = 0;
  
  // Add inputs
  unspentOutputs.forEach((utxo) => {
    txBuilder.addInput(utxo.txid, utxo.vout);
    totalInput += utxo.value;
  });

  const change = totalInput - amountToEnv - fee;

  if (change < 0) {
    throw new Error("Insufficient balance to cover amount and fee.");
  }

  // Add Outputs using our safe function
  safeAddOutput(txBuilder, toAddress, amountToEnv);

  // Send change back to original address
  if (change > 0) {
    const { address: myAddress } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    safeAddOutput(txBuilder, myAddress, change);
  }

  // Sign all inputs
  for (let i = 0; i < unspentOutputs.length; i++) {
    txBuilder.sign(i, keyPair);
  }

  return txBuilder.build().toHex();
};

// ==========================================
// ENCRYPTION UTILS (Optional but recommended)
// ==========================================

export const encryptData = (data, password) => {
  return CryptoJS.AES.encrypt(data, password).toString();
};

export const decryptData = (ciphertext, password) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, password);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const walletEngine = {
  generateWallet,
  restoreWallet,
  buildAndSignTx,
  encryptData,
  decryptData
};
>>>>>>> 99abe21d59876c63d44da7729f354b6d0c1fda35

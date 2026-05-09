import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
<<<<<<< HEAD
import topLevelAwait from "vite-plugin-top-level-await"
import wasm from "vite-plugin-wasm" // Added this
=======
>>>>>>> 99abe21d59876c63d44da7729f354b6d0c1fda35

export default defineConfig({
  plugins: [
    react(),
<<<<<<< HEAD
    wasm(), // Added this
    topLevelAwait(),
    nodePolyfills({
=======
    // Ripped out the crashing top-level-await plugin!
    nodePolyfills({
      include: ['buffer', 'process', 'crypto', 'stream', 'util', 'events'],
>>>>>>> 99abe21d59876c63d44da7729f354b6d0c1fda35
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  build: {
    target: 'esnext',
<<<<<<< HEAD
    // This tells Vite to treat WASM as a constant asset
    assetsInlineLimit: 0, 
  },
  optimizeDeps: {
    // This prevents Vite from trying to "pre-bundle" the problematic library
    exclude: ['tiny-secp256k1']
  }
})
=======
  },
  optimizeDeps: {
    exclude: ['@bitcoinerlab/secp256k1']
  }
})
>>>>>>> 99abe21d59876c63d44da7729f354b6d0c1fda35

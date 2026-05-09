<<<<<<< HEAD
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8081;

// Rafsen Network Configuration
const RAFSEN_RPC = {
  host: 'http://187.77.87.53',
  port: 18776,
  user: 'rafsen',
  password: 'rafsen123'
};

const RPC_URL = `${RAFSEN_RPC.host}:${RAFSEN_RPC.port}`;
const RPC_CREDENTIALS = Buffer.from(`${RAFSEN_RPC.user}:${RAFSEN_RPC.password}`).toString('base64');

// Enable CORS
app.use(cors());
app.use(express.json());

// Helper function to make RPC calls (using built-in fetch)
async function rpcCall(method, params = []) {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${RPC_CREDENTIALS}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: method,
        params: params
      })
    });

    if (!response.ok) {
      throw new Error(`RPC Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    return data.result;
  } catch (error) {
    console.error(`RPC call failed for ${method}:`, error.message);
    throw error;
  }
}

// GET /api/history
app.get('/api/history', async (req, res) => {
  try {
    console.log('API: GET /api/history - Fetching from Rafsen network...');
    const transactions = await rpcCall('listtransactions', ['', 100, 0]);
    console.log(`✓ Got ${transactions.length} transactions`);
    res.status(200).json({ result: transactions });
  } catch (error) {
    console.error('✗ Error fetching transaction history:', error.message);
    // Return mock data as fallback
    res.status(200).json({ result: [] });
  }
});

// GET /api/info
app.get('/api/info', async (req, res) => {
  try {
    console.log('API: GET /api/info - Fetching from Rafsen network...');
    const info = await rpcCall('getinfo');
    console.log(`✓ Got wallet info: ${info.blocks} blocks`);
    res.status(200).json({ result: info });
  } catch (error) {
    console.error('✗ Error fetching wallet info:', error.message);
    // Return mock data as fallback
    res.status(200).json({ result: {
      blocks: 0,
      connections: 0,
      balance: 0,
      version: 0
    }});
  }
});

// GET /api/address
app.get('/api/address', async (req, res) => {
  try {
    console.log('API: GET /api/address - Generating new address...');
    const address = await rpcCall('getnewaddress');
    console.log(`✓ Generated address: ${address}`);
    res.status(200).json({ result: address });
  } catch (error) {
    console.error('✗ Error generating address:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/send
app.post('/api/send', async (req, res) => {
  try {
    const { destinationAddress, amount } = req.body;
    console.log(`API: POST /api/send - ${amount} RAF to ${destinationAddress}`);
    
    if (!destinationAddress || !amount) {
      return res.status(400).json({ error: 'Missing destinationAddress or amount' });
    }

    const txid = await rpcCall('sendtoaddress', [destinationAddress, parseFloat(amount)]);
    console.log(`✓ Transaction sent: ${txid}`);
    
    res.status(200).json({
      result: {
        txid: txid,
        message: `Successfully sent ${amount} RAF to ${destinationAddress}`,
      },
    });
  } catch (error) {
    console.error('✗ Error sending RAF:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Rafsen Wallet API Server running on http://localhost:${PORT}`);
  console.log(`🔗 Connected to Rafsen Network at ${RPC_URL}`);
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/history`);
  console.log(`  GET  http://localhost:${PORT}/api/info`);
  console.log(`  GET  http://localhost:${PORT}/api/address`);
  console.log(`  POST http://localhost:${PORT}/api/send`);
});
=======
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8081;

// Rafsen Network Configuration
const RAFSEN_RPC = {
  host: 'http://187.77.87.53',
  port: 18776,
  user: 'rafsen',
  password: 'rafsen123'
};

const RPC_URL = `${RAFSEN_RPC.host}:${RAFSEN_RPC.port}`;
const RPC_CREDENTIALS = Buffer.from(`${RAFSEN_RPC.user}:${RAFSEN_RPC.password}`).toString('base64');

// Enable CORS
app.use(cors());
app.use(express.json());

// Helper function to make RPC calls (using built-in fetch)
async function rpcCall(method, params = []) {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${RPC_CREDENTIALS}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: method,
        params: params
      })
    });

    if (!response.ok) {
      throw new Error(`RPC Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    return data.result;
  } catch (error) {
    console.error(`RPC call failed for ${method}:`, error.message);
    throw error;
  }
}

// GET /api/history
app.get('/api/history', async (req, res) => {
  try {
    console.log('API: GET /api/history - Fetching from Rafsen network...');
    const transactions = await rpcCall('listtransactions', ['', 100, 0]);
    console.log(`✓ Got ${transactions.length} transactions`);
    res.status(200).json({ result: transactions });
  } catch (error) {
    console.error('✗ Error fetching transaction history:', error.message);
    // Return mock data as fallback
    res.status(200).json({ result: [] });
  }
});

// GET /api/info
app.get('/api/info', async (req, res) => {
  try {
    console.log('API: GET /api/info - Fetching from Rafsen network...');
    const info = await rpcCall('getinfo');
    console.log(`✓ Got wallet info: ${info.blocks} blocks`);
    res.status(200).json({ result: info });
  } catch (error) {
    console.error('✗ Error fetching wallet info:', error.message);
    // Return mock data as fallback
    res.status(200).json({ result: {
      blocks: 0,
      connections: 0,
      balance: 0,
      version: 0
    }});
  }
});

// GET /api/address
app.get('/api/address', async (req, res) => {
  try {
    console.log('API: GET /api/address - Generating new address...');
    const address = await rpcCall('getnewaddress');
    console.log(`✓ Generated address: ${address}`);
    res.status(200).json({ result: address });
  } catch (error) {
    console.error('✗ Error generating address:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/send
app.post('/api/send', async (req, res) => {
  try {
    const { destinationAddress, amount } = req.body;
    console.log(`API: POST /api/send - ${amount} RAF to ${destinationAddress}`);
    
    if (!destinationAddress || !amount) {
      return res.status(400).json({ error: 'Missing destinationAddress or amount' });
    }

    const txid = await rpcCall('sendtoaddress', [destinationAddress, parseFloat(amount)]);
    console.log(`✓ Transaction sent: ${txid}`);
    
    res.status(200).json({
      result: {
        txid: txid,
        message: `Successfully sent ${amount} RAF to ${destinationAddress}`,
      },
    });
  } catch (error) {
    console.error('✗ Error sending RAF:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Rafsen Wallet API Server running on http://localhost:${PORT}`);
  console.log(`🔗 Connected to Rafsen Network at ${RPC_URL}`);
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/history`);
  console.log(`  GET  http://localhost:${PORT}/api/info`);
  console.log(`  GET  http://localhost:${PORT}/api/address`);
  console.log(`  POST http://localhost:${PORT}/api/send`);
});
>>>>>>> 99abe21d59876c63d44da7729f354b6d0c1fda35

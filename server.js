console.log('Starting server...');

require('dotenv').config();

const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Security and performance middlewares
app.use(express.static(path.join(__dirname, 'public')));



async function authenticateThingsBoard() { 
   try {
     const thingsboardUrl = process.env.THINGSBOARD_URL;
     const username = process.env.THINGSBOARD_USERNAME;
     const password = process.env.THINGSBOARD_PASSWORD;

     const url = `${thingsboardUrl}/api/auth/login`;
     const response = await fetch(url, {
       method: 'POST',
      headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ username, password })
     });

     if (!response.ok) throw new Error(`ThingsBoard authentication error: ${response.status}`);
     const data = await response.json();
     console.log('ThingsBoard access token:', data.token);
     return data.token; 
   } catch (error) {
     console.error('ThingsBoard Authentication Error:', error);
     throw new Error('Failed to authenticate with ThingsBoard');
   }
 }

 


async function fetchWithAuth(url, options = {}, retryCount = 0) {
  try {
    const accessToken = await authenticateThingsBoard();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      if (retryCount < 3 && (response.status === 401 || response.status === 403)) { //retry se tiver erros de autenticação
        console.log('Token expired or invalid, retrying with new authentication...');
        return fetchWithAuth(url, options, retryCount + 1);
      }
      throw new Error(`ThingsBoard API error: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Fetch with auth error:', error);
    throw error;
  }
}

//endpoint do titulo
app.get('/api/title', (req, res) => {
  const title = req.query.title;
  if (!title) {
    console.error('[SERVER] Title parameter is required');
    return res.status(400).json({ error: 'title parameter is required' });
  }
  res.json({ title });
  
});


app.get('/api/getdata', async (req, res) => {
  try {
    const thingsboardUrl = process.env.THINGSBOARD_URL;
    const deviceId = req.query.assetid;
    
    console.log(`[SERVER] GetData request - Query assetid: ${req.query.assetid} | Using assetid: ${deviceId}`);

    if (!deviceId) {
      return res.status(400).json({ error: 'assetid parameter is required' });
    }
    
    const url = `${thingsboardUrl}/api/plugins/telemetry/ASSET/${deviceId}/values/timeseries`;
    const response = await fetchWithAuth(url);
    const data = await response.json();
    console.log('ThingsBoard Telemetry Data:', data);
    res.json(data);
  } catch (error) {
    console.error('ThingsBoard Telemetry Error:', error);
    res.status(500).json({ error: `${error.message}` });
  }
});


app.get('/api/gethistory', async (req, res) => {
  try {
    const thingsboardUrl = process.env.THINGSBOARD_URL;
    const deviceId = req.query.assetid;
    const { key, startTs, endTs } = req.query;
    
    console.log(`[SERVER] GetHistory request - Query assetid: ${req.query.assetid} | Using assetid: ${deviceId}`);
    
    if (!deviceId) {
      console.error('[SERVER] AssetID parameter is required');
      return res.status(400).json({ error: 'assetid parameter is required' });
    }
    
    const url = `${thingsboardUrl}/api/plugins/telemetry/ASSET/${deviceId}/values/timeseries?keys=${key}&startTs=${startTs}&endTs=${endTs}&limit=5000`;
    console.log(`[SERVER] Fetching ThingsBoard history from: ${url}`);
    const response = await fetchWithAuth(url);
    const data = await response.json();
    console.log('ThingsBoard Telemetry History Data:', data);
    res.json(data[key] || []);
  } catch (error) {
    console.error('ThingsBoard Telemetry History Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack 
    });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Em caso de erro
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server error');
});

// Começa server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
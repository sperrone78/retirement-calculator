const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

// Enable CORS
app.use(cors());

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Add favicon route to prevent 404
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response
});

// Proxy requests to Ollama with better error handling
const ollamaProxy = createProxyMiddleware({
    target: 'http://localhost:11434',
    changeOrigin: true,
    pathRewrite: {
        '^/ollama': ''
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error');
    },
    logLevel: 'debug' // Add logging for debugging
});

app.use('/ollama', ollamaProxy);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).send('Server Error');
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Proxying /ollama requests to http://localhost:11434`);
}); 
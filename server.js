// server.js — Static file server for Hostinger Node.js hosting
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
};

const server = createServer((req, res) => {
    // Remove query strings
    const urlPath = req.url.split('?')[0];
    let filePath = join(DIST_DIR, urlPath);

    // Serve index.html for root or non-existent paths (SPA fallback)
    if (urlPath === '/' || !existsSync(filePath) || statSync(filePath).isDirectory()) {
        filePath = join(DIST_DIR, 'index.html');
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    try {
        const content = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    } catch (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`HabiTracker server running on port ${PORT}`);
});

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = http.createServer((req, res) => {
  const reqPath = req.url.split('?')[0];
  const filePath = path.join(__dirname, reqPath === '/' ? 'index.html' : reqPath);
  const ext = path.extname(filePath);
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found: ' + reqPath);
    return;
  }
  
  const data = fs.readFileSync(filePath);
  res.writeHead(200, { 
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': data.length,
    'Access-Control-Allow-Origin': '*'
  });
  res.end(data);
});

server.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
  
  // Test files
  const tests = ['/', '/src/main.js', '/src/Game.js', '/src/Player.js', '/assets/models/animal-cat.glb', '/style.css'];
  let i = 0;
  function testNext() {
    if (i >= tests.length) {
      console.log('\nAll tests OK. Server running at http://localhost:' + PORT);
      return;
    }
    const url = 'http://localhost:' + PORT + tests[i];
    http.get(url, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(data);
        console.log(`  ${tests[i]} -> ${res.statusCode} ${res.headers['content-type']} (${buf.length} bytes)`);
        i++;
        testNext();
      });
    });
  }
  testNext();
});

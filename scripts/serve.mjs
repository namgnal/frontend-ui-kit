import http from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT || 4174);
const allowed = new Map([['/', ['index.html', 'text/html']], ['/index.html', ['index.html', 'text/html']],
  ['/main.js', ['main.js', 'text/javascript']], ['/main.css', ['main.css', 'text/css']],
  ['/tweaks.html', ['tweaks.html', 'text/html']], ['/tweaks.js', ['tweaks.js', 'text/javascript']], ['/tweaks.css', ['tweaks.css', 'text/css']],
  ['/final.html', ['final.html', 'text/html']], ['/final.js', ['final.js', 'text/javascript']], ['/final.css', ['final.css', 'text/css']]]);
http.createServer(async (req, res) => {
  const file = allowed.get(new URL(req.url, 'http://localhost').pathname);
  if (!file) { res.writeHead(404); res.end(); return; }
  try { const content = await readFile(new URL(`../dist/${file[0]}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-store' }); res.end(content);
  } catch { res.writeHead(500); res.end('Build the demo first.'); }
}).listen(port, '127.0.0.1', () => console.log(`Preview http://127.0.0.1:${port}`));

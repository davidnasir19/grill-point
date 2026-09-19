/** Serves dist/ under /grill-point/ to reproduce GitHub Pages' project-site sub-path. */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const ROOT = 'dist', PREFIX = '/grill-point'
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.avif':'image/avif', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.webm':'video/webm' }
createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (!p.startsWith(PREFIX)) { res.writeHead(404).end('outside prefix'); return }
  p = p.slice(PREFIX.length) || '/'
  if (p.endsWith('/')) p += 'index.html'
  const file = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''))
  try {
    await stat(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' })
    res.end(await readFile(file))
  } catch { res.writeHead(404).end('404 ' + p) }
}).listen(4180, () => console.log('http://127.0.0.1:4180/grill-point/'))

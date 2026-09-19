/** Loads the sub-path build and reports any failed request — the GitHub Pages smoke test. */
import puppeteer from 'puppeteer-core'
const URL = process.argv[2] || 'http://127.0.0.1:4180/grill-point/'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--window-size=1440,900','--hide-scrollbars'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
const failed = [], errors = []
p.on('requestfailed', (r) => failed.push(`${r.failure()?.errorText} ${r.url()}`))
p.on('response', (r) => { if (r.status() >= 400) failed.push(`HTTP ${r.status()} ${r.url()}`) })
p.on('pageerror', (e) => errors.push(String(e)))
await p.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 3000))
// walk the whole document so every lazily-requested asset is fetched
const H = await p.evaluate(() => document.documentElement.scrollHeight)
const steps = Math.ceil(H / 700)
for (let i = 0; i <= steps; i++) {
  await p.evaluate((y) => { window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y) }, i * 700)
  await new Promise(r => setTimeout(r, 260))
}
const n = steps
await new Promise(r => setTimeout(r, 4000))
await p.screenshot({ path: 'scratch-deploy.jpg', type: 'jpeg', quality: 80 })
console.log(`hauteur du document : ${H}px, ${n} paliers parcourus`)
console.log(`requetes en echec : ${failed.length}`)
;[...new Set(failed)].slice(0, 15).forEach(f => console.log('   ', f))
console.log(`erreurs JS : ${errors.length}`); [...new Set(errors)].slice(0,5).forEach(e => console.log('   ', e.slice(0,160)))
await b.close()

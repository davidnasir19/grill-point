/** Scrolls continuously through the film and captures a filmstrip, to catch seams and tearing. */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900)
const FROM = process.argv[4] || 'The visit', STEPS = Number(process.argv[5] || 24), OUT = process.argv[6] || 'scratch-film'
mkdirSync(OUT, { recursive: true })
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: [`--window-size=${W},${H}`, '--hide-scrollbars'] })
const p = await b.newPage()
await p.setViewport({ width: W, height: H })
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))
const range = await p.evaluate((name) => {
  const i = window.__scenes.findIndex((s) => s.dataset.scene === name)
  const s = window.__scenes[i], next = window.__scenes[i + 1]
  return { top: s.offsetTop - innerHeight * 0.6, bottom: (next ? next.offsetTop : s.offsetTop + s.offsetHeight) + innerHeight * 0.3 }
}, FROM)
// let the sequences decode before we judge continuity
await p.evaluate((y) => window.__lenis.scrollTo(y, { immediate: true }), range.top)
await new Promise((r) => setTimeout(r, 9000))
for (let i = 0; i < STEPS; i++) {
  const y = Math.round(range.top + ((range.bottom - range.top) * i) / (STEPS - 1))
  await p.evaluate((yy) => window.__lenis.scrollTo(yy, { immediate: true }), y)
  await new Promise((r) => setTimeout(r, 420))
  await p.screenshot({ path: `${OUT}/${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 78 })
  process.stdout.write('.')
}
console.log(`\n${STEPS} images ${W}x${H} -> ${OUT}/`)
if (errs.length) console.log('ERREURS:', [...new Set(errs)].slice(0, 5))
else console.log('aucune erreur')
await b.close()

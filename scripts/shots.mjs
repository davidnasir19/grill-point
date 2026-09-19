/**
 * Real desktop screenshots of the experience at chosen scroll positions.
 * Usage: node scripts/shots.mjs [width] [height] [outDir]
 *   node scripts/shots.mjs 1440 900 scratch-shots
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync, existsSync } from 'node:fs'

const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900)
const OUT = process.argv[4] || 'scratch-shots'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
// scene name -> progress inside that scene
const STOPS = [
  ['Origins', 0.0], ['Origins', 0.55], ['Marlboro', 0.45], ['Marlboro', 0.88],
  ['The visit', 0.06], ['The visit', 0.18], ['The visit', 0.3], ['The visit', 0.42],
  ['The visit', 0.54], ['The visit', 0.66], ['The visit', 0.78], ['The visit', 0.92],
  ['Signatures', 0.15], ['Signatures', 0.5], ['Signatures', 0.95],
  ['The menu', 0.05], ['The menu', 0.35], ['The menu', 0.7],
  ['Full menu', 0.02], ['Full menu', 0.12],
  ['Twenty years', 0.6], ['Find us', 0.7], ['Book a table', 0.05],
]

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: [`--window-size=${W},${H}`, '--hide-scrollbars', '--force-device-scale-factor=1'] })
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

const seen = new Map()
let idx = 0
for (const [name, f] of STOPS) {
  idx++
  const ok = await page.evaluate((n, frac) => {
    const s = window.__scenes?.find((x) => x.dataset.scene === n)
    if (!s) return false
    const y = Math.round(s.offsetTop + frac * (s.offsetHeight - innerHeight))
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y)
    return true
  }, name, f)
  if (!ok) { console.log(`  !! scene absente: ${name}`); continue }
  await new Promise((r) => setTimeout(r, 1500))
  const n = (seen.get(name) || 0) + 1; seen.set(name, n)
  const file = `${OUT}/${String(idx).padStart(2, '0')}-${name.replace(/\s+/g, '-')}-${n}.jpg`
  await page.screenshot({ path: file, type: 'jpeg', quality: 80 })
  process.stdout.write('.')
}
console.log(`\n${seen.size} scenes capturees dans ${OUT}/ (${W}x${H})`)
if (errors.length) { console.log('\nERREURS CONSOLE:'); [...new Set(errors)].slice(0, 12).forEach((e) => console.log('  -', e.slice(0, 180))) }
else console.log('aucune erreur console')
await browser.close()

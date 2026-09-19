/** Samples the scroll finely across a scene boundary and reports any horizontal seam. */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
const OUT = 'scratch-seam'; mkdirSync(OUT, { recursive: true })
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--window-size=1440,900', '--hide-scrollbars'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 4000))
const bounds = await p.evaluate(() => window.__scenes.map(s => ({ name: s.dataset.scene, top: s.offsetTop })))
// warm the visit sequences
await p.evaluate((y) => window.__lenis.scrollTo(y, { immediate: true }), bounds.find(b => b.name === 'The visit').top + 200)
await new Promise(r => setTimeout(r, 9000))
let i = 0
for (const name of ['The visit', 'Signatures']) {
  const top = bounds.find(b => b.name === name).top
  for (let d = -450; d <= 450; d += 150) {
    await p.evaluate((y) => window.__lenis.scrollTo(y, { immediate: true }), top + d)
    await new Promise(r => setTimeout(r, 450))
    await p.screenshot({ path: `${OUT}/${String(i++).padStart(2,'0')}-${name.replace(/\s/g,'-')}${d >= 0 ? '+' : ''}${d}.jpg`, type: 'jpeg', quality: 80 })
  }
}
console.log(`${i} images`)
await b.close()

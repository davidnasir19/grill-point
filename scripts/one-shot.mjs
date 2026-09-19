import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
mkdirSync('scratch-one', { recursive: true })
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--window-size=1440,900', '--hide-scrollbars'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 4000))
for (const [name, f] of [['Signatures', 0.9], ['Signatures', 0.95], ['Signatures', 0.99], ['The menu', 0.02]]) {
  await p.evaluate((n, fr) => { const s = window.__scenes.find(x => x.dataset.scene === n); window.__lenis.scrollTo(Math.round(s.offsetTop + fr * (s.offsetHeight - innerHeight)), { immediate: true }) }, name, f)
  await new Promise(r => setTimeout(r, 2500))
  await p.screenshot({ path: `scratch-one/${name.replace(/\s/g,'-')}-${f}.jpg`, type: 'jpeg', quality: 86 })
}
await b.close(); console.log('ok')

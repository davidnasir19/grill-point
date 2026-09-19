import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
mkdirSync('scratch-live', { recursive: true })
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] })
const p = await b.newPage()
await p.setViewport({ width: 576, height: 1280, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const failed = []
p.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`) })
await p.goto('https://davidnasir19.github.io/grill-point/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 3000))
await p.evaluate(() => {
  const s = [...document.querySelectorAll('.scene')].find(x => x.dataset.scene === 'The menu')
  const y = Math.round(s.offsetTop + 0.45 * (s.offsetHeight - innerHeight))
  window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y)
})
await new Promise(r => setTimeout(r, 2000))
await p.screenshot({ path: 'scratch-live/menu-576.jpg', type: 'jpeg', quality: 88 })
console.log('capture du site EN LIGNE a 576px prise')
console.log('requetes en erreur :', failed.length, failed.slice(0, 5).join(' | '))
await b.close()

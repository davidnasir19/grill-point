import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
mkdirSync('scratch-book', { recursive: true })
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] })
for (const [w, h, tag, mobile] of [[390, 844, 'mobile-390', true], [576, 1280, 'mobile-576', true], [1440, 900, 'desktop', false]]) {
  const p = await b.newPage()
  await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 })
  await p.goto('http://127.0.0.1:4180/grill-point/', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise(r => setTimeout(r, 2500))
  for (const [f, name] of [[0.28, 'a'], [0.52, 'b']]) {
    await p.evaluate((frac) => {
      const s = [...document.querySelectorAll('.scene')].find(x => x.dataset.scene === 'The menu')
      const y = Math.round(s.offsetTop + frac * (s.offsetHeight - innerHeight))
      window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y)
    }, f)
    await new Promise(r => setTimeout(r, 1500))
    await p.screenshot({ path: `scratch-book/${tag}-${name}.jpg`, type: 'jpeg', quality: 85 })
  }
  await p.close()
}
await b.close(); console.log('captures OK')

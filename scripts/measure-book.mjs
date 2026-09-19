/** Measures the menu book against the viewport at several phone widths. */
import puppeteer from 'puppeteer-core'
const URL = process.argv[2] || 'http://127.0.0.1:5173/'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] })
for (const [w, h] of [[360, 800], [390, 844], [412, 915], [576, 1280]]) {
  const p = await b.newPage()
  await p.setViewport({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  await p.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise(r => setTimeout(r, 2500))
  const r = await p.evaluate(() => {
    const scenes = [...document.querySelectorAll('.scene')]
    const s = scenes.find(x => x.dataset.scene === 'The menu')
    if (!s) return { err: 'scene introuvable' }
    // park at the point where a page is fully open
    const y = Math.round(s.offsetTop + 0.35 * (s.offsetHeight - innerHeight))
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y)
    return new Promise(res => setTimeout(() => {
      const q = (sel) => document.querySelector(sel)
      const rect = (sel) => { const e = q(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width) } }
      const page = [...document.querySelectorAll('.leaf--page .page')].map(e => e.getBoundingClientRect()).find(b => b.width > 0 && b.right > 0 && b.left < innerWidth)
      res({
        vw: innerWidth,
        book: rect('.book'),
        base: rect('.book__base'),
        pageVisible: page ? { l: Math.round(page.left), r: Math.round(page.right), w: Math.round(page.width) } : null,
        bw: getComputedStyle(q('.book')).getPropertyValue('--bw').trim(),
        transform: q('.book').style.transform,
      })
    }, 1200))
  })
  const over = r.pageVisible ? (r.pageVisible.r > r.vw || r.pageVisible.l < 0) : false
  console.log(`${w}x${h}  --bw=${r.bw}  page visible: ${r.pageVisible ? `${r.pageVisible.l}..${r.pageVisible.r} (largeur ${r.pageVisible.w})` : 'aucune'}  ${over ? '<<< DEBORDE' : 'ok'}`)
  await p.close()
}
await b.close()

import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
await p.goto('https://davidnasir19.github.io/grill-point/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 2500))
const out = await p.evaluate(() => {
  const s = [...document.querySelectorAll('.scene')].find(x => x.dataset.scene === 'The menu')
  window.__lenis ? window.__lenis.scrollTo(Math.round(s.offsetTop + 0.35 * (s.offsetHeight - innerHeight)), { immediate: true }) : 0
  return new Promise(res => setTimeout(() => {
    const book = document.querySelector('.book')
    const stage = document.querySelector('.s08 .stage')
    const cs = getComputedStyle(book)
    const rb = book.getBoundingClientRect(), rs = stage.getBoundingClientRect()
    const leaves = [...document.querySelectorAll('.leaf--page')].map((l, i) => {
      const r = l.getBoundingClientRect()
      return { i, r: `${Math.round(r.left)}..${Math.round(r.right)}`, w: Math.round(r.width), rot: l.style.getPropertyValue('--r') }
    }).filter(x => x.w > 40)
    return res({
      innerWidth, matchesMobileJS: innerWidth < 720,
      bwToken: cs.getPropertyValue('--bw').trim(),
      bwUsed: Math.round(parseFloat(getComputedStyle(document.querySelector('.book__base')).width)),
      bookRect: `${Math.round(rb.left)}..${Math.round(rb.right)} (largeur ${Math.round(rb.width)})`,
      stageRect: `${Math.round(rs.left)}..${Math.round(rs.right)}`,
      inlineTransform: book.style.transform,
      computedTransform: cs.transform,
      baseRect: (() => { const r = document.querySelector('.book__base').getBoundingClientRect(); return `${Math.round(r.left)}..${Math.round(r.right)}` })(),
      leaves: leaves.slice(0, 4),
    })
  }, 1400))
})
console.log(JSON.stringify(out, null, 1))
await b.close()

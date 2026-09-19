import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--window-size=1440,900'] })
const p = await b.newPage()
await p.setViewport({ width: 1440, height: 900 })
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 3500))
for (const f of [0.7, 0.8, 0.9, 0.95, 1.0]) {
  const r = await p.evaluate((frac) => {
    const s = window.__scenes.find(x => x.dataset.scene === 'Signatures')
    window.__lenis.scrollTo(Math.round(s.offsetTop + frac * (s.offsetHeight - innerHeight)), { immediate: true })
    return new Promise(res => setTimeout(() => {
      const plate = document.querySelector('.s07__plate[data-i="2"]')
      const slot = document.querySelector('.s07__cover-slot')
      const cover = document.querySelector('.s07__cover')
      const pr = plate.getBoundingClientRect(), sr = slot.getBoundingClientRect(), cr = cover.getBoundingClientRect()
      res({ frac,
        plate: { w: Math.round(pr.width), cx: Math.round(pr.left + pr.width / 2), cy: Math.round(pr.top + pr.height / 2), offsetW: plate.offsetWidth, tf: plate.style.transform },
        slot: { w: Math.round(sr.width), cx: Math.round(sr.left + sr.width / 2), cy: Math.round(sr.top + sr.height / 2) },
        cover: { w: Math.round(cr.width), cy: Math.round(cr.top + cr.height / 2), tf: cover.style.transform },
        stageTop: Math.round(document.querySelector('.s07 .stage').getBoundingClientRect().top) })
    }, 900))
  }, f)
  console.log(JSON.stringify(r, null, 1))
}
await b.close()

import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--hide-scrollbars'] })
for (const [w, h] of [[390, 844], [576, 1280], [412, 915]]) {
  const p = await b.newPage()
  await p.setViewport({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  await p.goto('http://127.0.0.1:4180/grill-point/', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise(r => setTimeout(r, 2500))
  const r = await p.evaluate(() => {
    const s = [...document.querySelectorAll('.scene')].find(x => x.dataset.scene === 'The menu')
    const y = Math.round(s.offsetTop + 0.28 * (s.offsetHeight - innerHeight));
      window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)
    return new Promise(res => setTimeout(() => {
      const page = [...document.querySelectorAll('.leaf--page .page')].map(e => ({ e, b: e.getBoundingClientRect() }))
        .filter(x => x.b.width > 40 && x.b.left < innerWidth && x.b.right > 0).pop()
      const status = document.querySelector('.s08__status').getBoundingClientRect()
      const tabs = document.querySelector('.s08__tabs')
      const active = tabs.querySelector('[aria-current="true"]')
      const list = page?.e.querySelector('.page__list')
      const lb = list?.getBoundingClientRect()
      const blurb = page?.e.querySelector('.page__blurb')?.getBoundingClientRect()
      return res({
        vw: innerWidth, vh: innerHeight,
        page: page ? { t: Math.round(page.b.top), b: Math.round(page.b.bottom), h: Math.round(page.b.height) } : null,
        platsAffiches: list ? list.children.length : 0,
        videEntreBlurbEtListe: blurb && lb ? Math.round(lb.top - blurb.bottom) : null,
        status: { t: Math.round(status.top), b: Math.round(status.bottom) },
        chevauchement: page ? Math.max(0, Math.round(page.b.bottom - status.top)) : 0,
        tabsVisible: active ? { l: Math.round(active.getBoundingClientRect().left), r: Math.round(active.getBoundingClientRect().right) } : null,
        tabsScrollable: tabs.scrollWidth > tabs.clientWidth,
      })
    }, 1500))
  })
  console.log(`${w}x${h}: page ${r.page.t}..${r.page.b} (h=${r.page.h}) | plats ${r.platsAffiches} | vide ${r.videEntreBlurbEtListe}px | status ${r.status.t}..${r.status.b} | CHEVAUCHEMENT ${r.chevauchement}px`)
  await p.close()
}
await b.close()

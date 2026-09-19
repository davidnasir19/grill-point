import { bindScene, lenis } from '../animations/scroll'
import { el, qs, qsa, seg, easeOut, easeInOut, esc } from '../utils/dom'
import { picture } from '../utils/media'
import { logoSvg } from '../components/logo'
import { heroes } from '../data/menu'
import { restaurant } from '../data/restaurant'

// Callouts ring the plate (which sits at 56%/44%) and stay clear of the copy block in the bottom-left.
const POS = [{ left: '7%', top: '19%' }, { right: '5%', top: '37%' }, { right: '9%', top: '68%' }]

export function mountShowcase(film: HTMLElement) {
  const section = el(`<section class="scene scene--pin s07" style="--len:2.2" data-scene="Signatures" aria-label="Three signature dishes">
    <div class="stage">
      <div class="s07__cover" aria-hidden="true">${logoSvg('cover__emboss')}<div class="s07__cover-slot"></div><h3 class="cover__title" translate="no">Grill Point</h3><p class="cover__sub">The menu</p></div>
      ${heroes.map((h, i) => `<div class="s07__plate" data-i="${i}">${picture(h.image, { alt: h.dish.name, sizes: '(max-width: 720px) 66vw, 560px' })}</div>`).join('')}
      ${heroes.map((h, i) => h.callouts.map((c, j) => `<span class="s07__callout ${j > 0 ? 's07__callout--r' : ''}" data-i="${i}" style="${Object.entries(POS[j]).map(([k, v]) => `${k}:${v}`).join(';')}">${esc(c)}</span>`).join('')).join('')}
      <div class="s07__info">
        <span class="eyebrow"></span>
        <h2 class="s07__name display"></h2>
        <p class="s07__desc"></p>
        <div class="s07__actions"><span class="s07__price"></span><a class="btn btn--primary btn--sm" href="${restaurant.links.order}" target="_blank" rel="noopener">Order this dish</a><a class="btn btn--ghost btn--sm" href="#menu">See full menu</a></div>
      </div>
      <div class="s07__dots" role="tablist" aria-label="Signature dishes">${heroes.map((h, i) => `<button type="button" role="tab" aria-label="${esc(h.dish.name)}" data-i="${i}"></button>`).join('')}</div>
    </div></section>`)
  film.appendChild(section)
  const plates = qsa('.s07__plate', section), callouts = qsa('.s07__callout', section), cover = qs('.s07__cover', section)
  const eyebrow = qs('.s07__info .eyebrow', section), name = qs('.s07__name', section), desc = qs('.s07__desc', section), price = qs('.s07__price', section), info = qs('.s07__info', section)
  const dots = qsa<HTMLButtonElement>('.s07__dots button', section)
  const N = heroes.length
  let current = -1
  // The landing target is this scene's own cover slot, measured live — the next scene's
  // book is not laid out yet at this point, so measuring it there gave a wrong position.
  /**
   * Offset that moves the last plate onto the cover's medallion slot.
   * Everything is measured RELATIVE TO THE STAGE: the stage is sticky, so viewport-relative
   * values change as you scroll and cannot be cached. The plate also sits at 56%/44% of the
   * stage rather than at its centre, so the offset is taken from the plate's own centre.
   */
  let natural: { x: number; y: number } | null = null
  addEventListener('resize', () => { natural = null }, { passive: true })
  const medallion = (plate: HTMLElement) => {
    const st = qs('.stage', section).getBoundingClientRect()
    const sr = qs('.s07__cover-slot', section).getBoundingClientRect()
    if (!sr.width || !st.height) return { w: plate.offsetWidth * 0.15, dx: 0, dy: 0 }
    if (!natural) {
      const prev = plate.style.transform
      plate.style.transform = 'none'
      const r = plate.getBoundingClientRect()
      plate.style.transform = prev
      natural = { x: r.left + r.width / 2 - st.left, y: r.top + r.height / 2 - st.top }
    }
    return {
      w: sr.width,
      dx: sr.left + sr.width / 2 - st.left - natural.x,
      dy: sr.top + sr.height / 2 - st.top - natural.y,
    }
  }
  const setInfo = (i: number) => { if (i === current) return; current = i; const h = heroes[i]; eyebrow.textContent = h.eyebrow; name.textContent = h.dish.name; desc.textContent = h.dish.description; price.textContent = h.dish.prices.join(' / '); dots.forEach((d, j) => d.setAttribute('aria-current', `${j === i}`)) }
  dots.forEach((d) => d.addEventListener('click', () => { const i = +d.dataset.i!; const y = section.offsetTop + ((i + 0.3) / N) * (section.offsetHeight - innerHeight); lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' }) }))
  qs('a[href="#menu"]', section).addEventListener('click', (e) => { e.preventDefault(); const t = document.querySelector<HTMLElement>('#menu'); if (t) (lenis ? lenis.scrollTo(t, { offset: -60, duration: 1.4 }) : t.scrollIntoView({ behavior: 'smooth' })) })

  bindScene(section, (p) => {
    const segLen = 1 / N
    plates.forEach((plate, i) => {
      const s = seg(p, i * segLen, (i + 1) * segLen)
      const enter = i === 0 ? 1 : easeOut(seg(s, 0, 0.22))
      const last = i === N - 1
      const exit = last ? 0 : easeInOut(seg(s, 0.82, 1))
      const vis = i === 0 ? (s > 0 || p === 0 ? 1 : 0) : (s > 0 ? 1 : 0)
      let x = (1 - enter) * 60 - exit * 60, rot = (1 - enter) * 12 - exit * 12, scale = 1, px = 0, py = 0
      if (last) { // the plate settles exactly onto the cover's medallion slot
        const land = easeInOut(seg(s, 0.7, 1)); const m = medallion(plate)
        scale = 1 - land * (1 - m.w / (plate.offsetWidth || 1)); px = land * m.dx; py = land * m.dy
      }
      plate.style.opacity = `${vis * (1 - exit)}`
      plate.style.transform = `translate(${x}vw, 0) translate(${px}px, ${py}px) rotate(${rot}deg) scale(${scale})`
      plate.style.zIndex = `${3 + (s > 0 && s < 1 ? 1 : 0)}`
      callouts.filter((c) => +c.dataset.i! === i).forEach((c, j) => { const v = seg(s, 0.25 + j * 0.08, 0.4 + j * 0.08) * (1 - seg(s, 0.7, 0.8)); c.style.opacity = `${v}`; c.style.transform = `translateY(${8 * (1 - v)}px)` })
      if (s > 0 && s <= 1 && (i === N - 1 || p < (i + 1) * segLen)) setInfo(i)
    })
    const li = Math.min(N - 1, Math.floor(p * N)), ls = seg(p, li * segLen, (li + 1) * segLen)
    const infoV = seg(ls, 0.22, 0.36) * (li === N - 1 ? 1 - seg(ls, 0.68, 0.78) : 1 - seg(ls, 0.8, 0.9))
    info.style.opacity = `${infoV}`; info.style.transform = `translateY(${12 * (1 - infoV)}px)`
    const c = easeOut(seg(p, 1 - segLen * 0.34, 1 - segLen * 0.28))
    cover.style.transform = `translate(-50%, calc(-50% + ${(1 - c) * 125}vh))`
  })
  setInfo(0)
  return section
}

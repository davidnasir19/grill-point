import { bindScene } from '../animations/scroll'
import { asset } from '../utils/asset'
import { el, qs, qsa, seg, easeInOut, clamp } from '../utils/dom'
import { restaurant } from '../data/restaurant'

const ZOOMS = [7, 10, 12, 14, 16]
const map = (z: number, eager = false) => `<picture><source type="image/avif" srcset="${asset(`assets/map/map-z${z}.avif`)}"><source type="image/webp" srcset="${asset(`assets/map/map-z${z}.webp`)}"><img src="${asset(`assets/map/map-z${z}.jpg`)}" width="1536" height="1536" alt="" loading="${eager ? 'eager' : 'lazy'}" decoding="async"></picture>`

export function mountDescent(film: HTMLElement) {
  const section = el(`<section class="scene scene--pin s02" style="--len:1.6" data-scene="Marlboro" aria-label="Descending to 415 Route 9 South">
    <div class="stage">
      <div class="s02__layers">${ZOOMS.map((z, i) => `<div class="s02__layer" data-z="${z}">${map(z, i === 0)}</div>`).join('')}</div>
      <div class="s02__vignette"></div>
      <div class="s02__pin" aria-hidden="true"><span class="s02__pin-ring"></span><span class="s02__pin-dot"></span></div>
      <div class="s02__labels">
        <span class="s02__label" data-k="nj"><small>United States</small>New Jersey</span>
        <span class="s02__label" data-k="marl"><small>Monmouth County</small>Marlboro</span>
        <span class="s02__label" data-k="addr"><small>Grill Point</small>${restaurant.address.line1}</span>
      </div>
      <a class="s02__dir btn btn--ghost btn--sm" href="${restaurant.links.directions}" target="_blank" rel="noopener">Get directions</a>
      <p class="s02__attrib">Map: Esri, HERE, Garmin, © OpenStreetMap contributors</p>
      
    </div></section>`)
  film.appendChild(section)
  const layers = qsa('.s02__layer', section), pin = qs('.s02__pin', section), dir = qs('.s02__dir', section)
  const labels = { nj: qs('[data-k="nj"]', section), marl: qs('[data-k="marl"]', section), addr: qs('[data-k="addr"]', section) }
  const show = (l: HTMLElement, v: number) => { l.style.opacity = `${v}`; l.style.transform = `translateX(${-8 * (1 - v)}px)` }

  bindScene(section, (p) => {
    const Z = 7 + 9 * easeInOut(seg(p, 0.04, 0.9))
    layers.forEach((l, i) => {
      const z = ZOOMS[i], next = ZOOMS[i + 1] ?? 99
      let o: number, s = Math.pow(2, clamp(Z - z, -1.5, next - z + 0.6))
      if (Z < z) o = i === 0 ? 1 : 0
      else if (Z <= next) o = 1
      else o = 1 - seg(Z, next, next + 0.3)
      // the upper layer fades in over the lower one as we approach its native zoom
      if (i > 0 && Z >= ZOOMS[i - 1] && Z < z) { o = seg(Z, z - 1.2, z); s = Math.pow(2, Z - z) }
      const entry = i === 0 ? seg(p, 0, 0.08) : 1
      l.style.setProperty('--s', `${s}`); l.style.setProperty('--o', `${o}`)
      l.style.filter = i === 0 && entry < 1 ? `blur(${(1 - entry) * 10}px)` : ''
    })
    show(labels.nj, seg(Z, 7.4, 8.4) * (1 - seg(Z, 10.4, 11.4)))
    show(labels.marl, seg(Z, 11.2, 12.2) * (1 - seg(Z, 13.6, 14.4)))
    show(labels.addr, seg(Z, 14.2, 15) * (1 - seg(p, 0.9, 0.96)))
    const ps = seg(Z, 13.3, 15.2); pin.style.setProperty('--s', `${ps}`); pin.style.setProperty('--o', `${ps * (1 - seg(p, 0.92, 0.97))}`)
    dir.style.opacity = `${seg(p, 0.55, 0.65) * (1 - seg(p, 0.88, 0.93))}`; dir.style.pointerEvents = p > 0.55 && p < 0.9 ? 'auto' : 'none'
    // the descent now ends on darkness, which is where the first frame of the visit begins
  })
  return section
}

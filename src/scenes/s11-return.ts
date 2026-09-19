import { bindScene } from '../animations/scroll'
import { asset } from '../utils/asset'
import { el, qs, seg, easeOut, lerp } from '../utils/dom'
import { videoSlot } from '../utils/media'
import { restaurant } from '../data/restaurant'
import { openStatus } from '../utils/hours'

const I = {
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
}

export function mountReturn(film: HTMLElement) {
  const s = openStatus()
  const section = el(`<section class="scene scene--pin s11" style="--len:1.3" data-scene="Find us" aria-label="Where to find us">
    <div class="stage">
      <div class="s11__facade"></div>
      <div class="s11__dust s10__dust" aria-hidden="true"></div>
      <div class="s11__copy"><h2 class="display">We're right here<br>on Route 9.</h2></div>
      <aside class="s11__panel">
        <h3 class="display">Visit us</h3>
        <div class="s11__today">${I.clock}<span>${s.label}</span></div>
        <div class="s11__row">${I.pin}<span>${restaurant.address.full}<br><a href="${restaurant.links.directions}" target="_blank" rel="noopener">Get directions</a></span></div>
        <div class="s11__row">${I.phone}<span><a href="${restaurant.phoneHref}">${restaurant.phone}</a> · ${restaurant.email}</span></div>
        <a class="s11__map" href="${restaurant.links.directions}" target="_blank" rel="noopener" aria-label="Map — open directions"><picture><source type="image/webp" srcset="${asset('assets/map/map-z14.webp')}"><img src="${asset('assets/map/map-z14.jpg')}" alt="" loading="lazy" width="1536" height="1536"></picture></a>
        <div class="s11__actions"><a class="btn btn--primary btn--sm" href="${restaurant.links.order}" target="_blank" rel="noopener">Order online</a><a class="btn btn--ghost btn--sm" href="#book">Book a table</a></div>
      </aside>
    </div></section>`)
  film.appendChild(section)
  qs('.s11__facade', section).appendChild(videoSlot('VID_01_ARRIVAL', 'Grill Point at night'))
  const facade = qs('.s11__facade', section), dust = qs('.s11__dust', section), copy = qs('.s11__copy .display', section), panel = qs('.s11__panel', section)
  bindScene(section, (p) => {
    dust.style.opacity = `${0.9 * (1 - seg(p, 0, 0.18))}`
    facade.style.transform = `scale(${lerp(1.22, 1, easeOut(seg(p, 0, 0.75)))})`
    facade.style.filter = `brightness(${lerp(0.15, 0.9, seg(p, 0, 0.3))})`
    const c = seg(p, 0.14, 0.3); copy.style.opacity = `${c}`; copy.style.transform = `translateY(${20 * (1 - c)}px)`
    const v = easeOut(seg(p, 0.28, 0.48)); panel.style.opacity = `${v}`; panel.style.transform = innerWidth > 860 ? `translate(${40 * (1 - v)}px, -50%)` : `translateY(${40 * (1 - v)}px)`
  })
  return section
}

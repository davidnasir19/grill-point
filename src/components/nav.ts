import { logoSvg } from './logo'
import { restaurant } from '../data/restaurant'
import { openStatus } from '../utils/hours'
import { scrollToEl } from '../animations/scroll'

export function mountNav(root: HTMLElement) {
  const s = openStatus()
  root.className = 'nav'
  root.innerHTML = `
    <a class="nav__brand" href="#top" aria-label="Grill Point — back to top">${logoSvg()}<span translate="no">Grill Point</span></a>
    <div class="nav__links">
      <span class="nav__status ${s.open ? '' : 'is-closed'}"><i></i>${s.label}</span>
      <a href="#menu">Menu</a>
      <a href="#book">Reserve</a>
      <a class="btn btn--primary btn--sm" href="${restaurant.links.order}" target="_blank" rel="noopener">Order online</a>
    </div>`
  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')!
    if (id === '#top') { e.preventDefault(); scrollToEl(document.body, 0); return }
    const t = document.querySelector<HTMLElement>(id); if (!t) return
    e.preventDefault(); scrollToEl(t, -60)
  }))
  const onScroll = () => root.classList.toggle('is-solid', scrollY > innerHeight * 0.9)
  addEventListener('scroll', onScroll, { passive: true }); onScroll()
}

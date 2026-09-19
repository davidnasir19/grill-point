import { restaurant } from '../data/restaurant'
import { scrollToEl } from '../animations/scroll'

const ICON = {
  bag: '<svg viewBox="0 0 24 24"><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
}

export function mountDock(root: HTMLElement) {
  root.innerHTML = `
    <a class="is-primary" href="${restaurant.links.order}" target="_blank" rel="noopener">${ICON.bag}Order</a>
    <a href="#book">${ICON.cal}Book</a>
    <a href="${restaurant.phoneHref}">${ICON.phone}Call</a>
    <a href="${restaurant.links.directions}" target="_blank" rel="noopener">${ICON.pin}Directions</a>`
  root.querySelector<HTMLAnchorElement>('a[href="#book"]')!.addEventListener('click', (e) => { e.preventDefault(); scrollToEl('#book', -20) })
  let hiddenByForm = false
  const update = () => root.classList.toggle('is-visible', !hiddenByForm && scrollY > innerHeight * 2.4)
  addEventListener('scroll', update, { passive: true })
  const form = document.querySelector('#book')
  if (form) new IntersectionObserver((es) => { hiddenByForm = es[0].isIntersecting; update() }, { threshold: 0.2 }).observe(form)
  update()
}

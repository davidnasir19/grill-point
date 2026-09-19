import type { Dish } from '../data/menu'
import { restaurant } from '../data/restaurant'
import { picture } from '../utils/media'
import { esc } from '../utils/dom'

let root: HTMLElement, lastFocus: Element | null = null

export function mountSheet(el: HTMLElement) {
  root = el; root.className = 'sheet'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-hidden', 'true')
  root.innerHTML = `<div class="sheet__backdrop"></div><div class="sheet__panel"><div class="sheet__img"></div><div class="sheet__body"></div><button class="sheet__close" type="button" aria-label="Close">×</button></div>`
  root.querySelector('.sheet__backdrop')!.addEventListener('click', closeSheet)
  root.querySelector('.sheet__close')!.addEventListener('click', closeSheet)
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('is-open')) closeSheet() })
}

export function openSheet(d: Dish, image: string, categoryLabel: string) {
  lastFocus = document.activeElement
  root.querySelector('.sheet__img')!.innerHTML = picture(image, { alt: categoryLabel, sizes: '520px' })
  const prices = d.prices.length > 1 ? d.prices.map((p) => `<span>${esc(p)}</span>`).join(' <small>·</small> ') : esc(d.price)
  root.querySelector('.sheet__body')!.innerHTML = `
    <span class="eyebrow">${esc(categoryLabel)}</span>
    <h3>${esc(d.name)}</h3>
    <div class="sheet__price">${prices}</div>
    <p class="sheet__desc">${d.description ? esc(d.description) : 'Ask us — this one has no written description yet.'}</p>
    ${d.tags.length ? `<div class="card__tags">${d.tags.map((t) => `<span class="tag tag--${t}">${t}</span>`).join('')}</div>` : ''}
    <div class="sheet__actions">
      <a class="btn btn--primary" href="${restaurant.links.order}" target="_blank" rel="noopener">Order online</a>
      <a class="btn btn--ghost" href="${restaurant.phoneHref}">Call ${restaurant.phone}</a>
    </div>
    <p class="sheet__fine">Prices shown are the dining-room menu. Online ordering prices may differ slightly.</p>`
  root.classList.add('is-open'); root.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'
  ;(root.querySelector('.sheet__close') as HTMLElement).focus()
}

export function closeSheet() {
  root.classList.remove('is-open'); root.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''
  ;(lastFocus as HTMLElement | null)?.focus?.()
}

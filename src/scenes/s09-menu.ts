import { el, qs, qsa, esc } from '../utils/dom'
import { picture } from '../utils/media'
import { categories, allDishes, lunch, type Dish } from '../data/menu'
import { restaurant } from '../data/restaurant'
import { openSheet } from '../components/dish-sheet'
import { scrollToEl } from '../animations/scroll'

const TOGGLES = [['vegetarian', 'Vegetarian'], ['spicy', 'Spicy'], ['seafood', 'Seafood']] as const
const catOf = (d: Dish) => categories.find((c) => c.name === d.category)!

/**
 * The full menu, text-first — the way a real menu reads.
 * There is no photograph for any individual dish on the legacy site, so each category
 * gets one banner image and the dishes are set as type. Repeating one photo across
 * every card was the single cheapest-looking thing on the old build.
 */
export function mountMenu(film: HTMLElement) {
  const section = el(`<section class="scene s09" id="menu" data-scene="Full menu" aria-label="The full menu">
    <div class="s09__head">
      <span class="eyebrow">The full menu · ${allDishes.length} dishes · ${categories.length} sections</span>
      <h2 class="display">Everything we cook.</h2>
      <p class="s09__note">Dining-room prices. Two prices mean two sizes. Online ordering prices may differ slightly — the counter is always right.</p>
    </div>
    <div class="s09__toolbar">
      <div class="chips" role="group" aria-label="Sections"><button class="chip" type="button" data-cat="all" aria-pressed="true">All</button>${categories.map((c) => `<button class="chip" type="button" data-cat="${c.slug}" aria-pressed="false">${esc(c.label)}</button>`).join('')}</div>
      <div class="chips" role="group" aria-label="Dietary filters">${TOGGLES.map(([k, l]) => `<button class="chip chip--toggle" type="button" data-tag="${k}" aria-pressed="false">${l}</button>`).join('')}<span class="s09__count" aria-live="polite"></span></div>
    </div>
    <div class="s09__body"></div>
    ${lunchBlock()}
  </section>`)
  film.appendChild(section)
  const body = qs('.s09__body', section)
  const count = qs('.s09__count', section)
  const state = { cat: 'all', tags: new Set<string>() }

  function render() {
    const cats = state.cat === 'all' ? categories : categories.filter((c) => c.slug === state.cat)
    let html = '', n = 0
    for (const c of cats) {
      const dishes = c.dishes.filter((d) => [...state.tags].every((t) => d.tags.includes(t)))
      if (!dishes.length) continue
      n += dishes.length
      html += `<section class="cat" id="cat-${c.slug}">
        <header class="cat__band">
          <div class="cat__img">${picture(c.image, { alt: c.label, sizes: '(max-width: 900px) 100vw, 1100px' })}</div>
          <div class="cat__text"><span class="eyebrow">${dishes.length} ${dishes.length > 1 ? 'dishes' : 'dish'}</span><h3>${esc(c.label)}</h3><p>${esc(c.blurb)}</p></div>
        </header>
        <ul class="dishes">${dishes.map((d) => `<li><button class="dish" type="button" data-id="${d.id}">
          <span class="dish__name">${esc(d.name)}</span><i class="dish__dots" aria-hidden="true"></i><span class="dish__price">${esc(d.prices.join(' / '))}</span>
          ${d.description ? `<p class="dish__desc">${esc(d.description)}</p>` : ''}
          ${d.tags.filter((t) => t !== 'grill').length ? `<span class="dish__tags">${d.tags.filter((t) => t !== 'grill').map((t) => `<em class="tag tag--${t}">${t}</em>`).join('')}</span>` : ''}
        </button></li>`).join('')}</ul>
      </section>`
    }
    body.innerHTML = n ? html : `<p class="s09__empty">Nothing matches those filters — try fewer.</p>`
    count.textContent = `${n} shown`
    qsa<HTMLButtonElement>('.dish', body).forEach((b) => b.addEventListener('click', () => {
      const d = allDishes.find((x) => x.id === b.dataset.id)!
      const c = catOf(d); openSheet(d, c.image, c.label)
    }))
  }
  qsa<HTMLButtonElement>('.chip[data-cat]', section).forEach((b) => b.addEventListener('click', () => {
    state.cat = b.dataset.cat!
    qsa('.chip[data-cat]', section).forEach((x) => x.setAttribute('aria-pressed', `${x === b}`))
    render()
  }))
  qsa<HTMLButtonElement>('.chip[data-tag]', section).forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.tag!
    state.tags.has(t) ? state.tags.delete(t) : state.tags.add(t)
    b.setAttribute('aria-pressed', `${state.tags.has(t)}`); render()
  }))
  render()
  // "See all" links coming from the menu book pick a section
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-cat]'); if (!a) return
    e.preventDefault()
    qs<HTMLButtonElement>(`.chip[data-cat="${a.dataset.cat}"]`, section)?.click()
    scrollToEl(section, -8)
  })
  mountLunch(section)
  return section
}

function lunchBlock() {
  const L = restaurant.lunch
  const step = (n: number, title: string, opts: readonly string[], key: string, multi = false) =>
    `<div class="lunch__step" data-key="${key}" data-multi="${multi}"><h4><b>${n}</b>${title}</h4><div class="lunch__opts">${opts.map((o) => `<button type="button" aria-pressed="false">${esc(o)}</button>`).join('')}</div></div>`
  return `<div class="lunch" id="lunch">
    <div class="lunch__head"><div><span class="eyebrow">Lunch special · ${L.days} · ${L.window}</span><h3 class="display">Build your lunch.</h3></div><div class="lunch__price">$${L.price}<small>per person</small></div></div>
    <div class="lunch__steps">
      ${step(1, 'Soup, salad or appetizer', lunch.step1, 's1')}
      ${step(2, 'Your entrée', lunch.step2, 's2')}
      ${step(2, 'Sandwich or platter', lunch.styles, 'style')}
      ${step(2, 'Sandwich toppings', lunch.toppings, 'top', true)}
      ${step(2, 'Sandwich dressing', lunch.dressings, 'dress')}
      ${step(3, 'Drink', lunch.step3, 's3')}
    </div>
    <div class="lunch__summary"><p class="lunch__text"><span>Pick one from each step to see your lunch.</span></p><div class="lunch__actions"><a class="btn btn--sign btn--sm" href="${restaurant.phoneHref}">Call to reserve lunch</a><span class="lunch__note">Served in the dining room only · ${L.note}</span></div></div>
  </div>`
}

function mountLunch(section: HTMLElement) {
  const root = qs('#lunch', section), text = qs('.lunch__text', root)
  const sel: Record<string, string[]> = {}
  qsa('.lunch__step', root).forEach((s) => {
    const key = s.dataset.key!, multi = s.dataset.multi === 'true'
    qsa<HTMLButtonElement>('button', s).forEach((b) => b.addEventListener('click', () => {
      const v = b.textContent!.trim(); sel[key] ??= []
      if (multi) { sel[key] = sel[key].includes(v) ? sel[key].filter((x) => x !== v) : [...sel[key], v]; b.setAttribute('aria-pressed', `${sel[key].includes(v)}`) }
      else { sel[key] = [v]; qsa('button', s).forEach((x) => x.setAttribute('aria-pressed', `${x === b}`)) }
      const sandwich = sel.style?.[0]?.startsWith('Sandwich')
      qsa('.lunch__step', root).forEach((st) => { if (st.dataset.key === 'top' || st.dataset.key === 'dress') st.classList.toggle('is-dim', !sandwich) })
      const parts = [sel.s1?.[0], sel.s2?.[0] && `${sel.s2[0]}${sel.style?.[0] ? ` (${sel.style[0].toLowerCase()})` : ''}`,
        sandwich && sel.top?.length ? `with ${sel.top.join(', ').toLowerCase()}` : '', sandwich && sel.dress?.[0] ? sel.dress[0].toLowerCase() : '', sel.s3?.[0]].filter(Boolean)
      text.innerHTML = parts.length ? `${esc(parts.join(' · '))} — <strong>$${restaurant.lunch.price}</strong>` : '<span>Pick one from each step to see your lunch.</span>'
    }))
  })
}

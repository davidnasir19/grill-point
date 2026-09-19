import { bindScene, lenis } from '../animations/scroll'
import { logoSvg } from '../components/logo'
import { el, qs, qsa, seg, easeInOut, esc } from '../utils/dom'
import { picture } from '../utils/media'
import { bookPages, type Category } from '../data/menu'
import { reducedMotion } from '../utils/device'

const FLIP_START = (k: number) => 0.08 + k * 0.09, FLIP_LEN = 0.07

/** Dishes printed on a page. Eight fills the paper without crowding it, and covers seven of the
 *  ten sections in full — showing four left most of the page empty and read as an incomplete menu. */
const PER_PAGE = 8

function pageFront(c: Category, idx: number) {
  const picks = c.dishes.slice(0, PER_PAGE)
  const rest = c.dishes.length - picks.length
  return `<div class="leaf__face page">
    <div class="page__photo">${picture(c.image, { alt: c.label, sizes: '(max-width: 720px) 74vw, 40vw' })}</div>
    <span class="page__kicker">${String(idx + 1).padStart(2, '0')} / ${bookPages.length}</span>
    <h3 class="page__title">${esc(c.label)}</h3>
    <p class="page__blurb">${esc(c.blurb)}</p>
    <ul class="page__list">${picks.map((d) => `<li><span>${esc(d.name)}</span><i></i><b>${esc(d.prices[0])}</b></li>`).join('')}</ul>
    <a class="page__more" href="#menu" data-cat="${c.slug}">${rest > 0 ? `See all ${c.dishes.length} →` : 'Full menu →'}</a>
  </div>`
}
function pageBack(next: Category | undefined, c: Category) {
  return `<div class="leaf__face leaf__back page-back">${picture(c.image, { alt: c.label, sizes: '46vw' })}
    ${next ? `<div class="page-back__tease"><span class="eyebrow">Next</span><strong>${esc(next.label)}</strong></div>` : ''}</div>`
}

export function mountBook(film: HTMLElement) {
  const N = bookPages.length // flips: cover + pages 0..N-2 ; the last page stays as the final spread
  const section = el(`<section class="scene scene--pin s08" style="--len:2.6" data-scene="The menu" aria-label="The menu book">
    <div class="stage">
      <p class="s08__hint">Scroll to open the menu</p>
      <div class="s08__world"><div class="book">
        <div class="book__base"></div>
        ${bookPages.map((c, i) => `<div class="leaf leaf--page" data-i="${i}" style="--z:${(N - i) * 0.6}px">${pageFront(c, i)}${pageBack(bookPages[i + 1], c)}<div class="leaf__shade"></div></div>`).reverse().join('')}
        <div class="leaf leaf--cover" style="--z:${(N + 1) * 0.6}px">
          <div class="leaf__face cover">${logoSvg('cover__emboss')}<div class="cover__medallion">${picture('adana', { alt: '', sizes: '22vmin' })}</div><h3 class="cover__title" translate="no">Grill Point</h3><p class="cover__sub">The menu</p></div>
          <div class="leaf__face leaf__back inside-cover"><p>Twenty years of the same recipes, cooked over open flame, on Route 9 South.</p></div>
          <div class="leaf__shade"></div>
        </div>
      </div></div>
      <div class="s08__ui">
        <div class="s08__status" aria-live="polite"></div>
        <div class="s08__tabs" role="tablist">${bookPages.map((c, i) => `<button type="button" role="tab" data-i="${i}">${esc(c.label)}</button>`).join('')}</div>
        <a class="s08__skip" href="#menu">Skip to the full menu ↓</a>
      </div>
    </div></section>`)
  film.appendChild(section)
  const book = qs('.book', section), cover = qs('.leaf--cover', section), leaves = qsa('.leaf--page', section).sort((a, b) => +a.dataset.i! - +b.dataset.i!)
  const status = qs('.s08__status', section), tabs = qsa<HTMLButtonElement>('.s08__tabs button', section), hint = qs('.s08__hint', section), world = qs('.s08__world', section)

  const isNarrow = () => innerWidth < 720
  /** Pixels to shift the book so the right-hand (readable) page sits centred in the stage. */
  let offsetCache: number | null = null
  addEventListener('resize', () => { offsetCache = null }, { passive: true })
  function pageOffset() {
    if (offsetCache !== null) return offsetCache
    const prev = book.style.transform
    book.style.transform = 'none'
    const base = qs('.book__base', section).getBoundingClientRect()
    const st = qs('.stage', section).getBoundingClientRect()
    book.style.transform = prev
    if (!base.width || !st.width) return 0
    return (offsetCache = Math.round((st.width - base.width) / 2 - (base.left - st.left)))
  }

  const flipOf = (k: number, p: number) => easeInOut(seg(p, FLIP_START(k), FLIP_START(k) + FLIP_LEN))
  const setLeaf = (l: HTMLElement, f: number) => { l.style.setProperty('--r', `${-180 * f}deg`); (l.querySelector('.leaf__shade') as HTMLElement).style.setProperty('--sh', `${Math.sin(f * Math.PI)}`) }
  let currentPage = -1
  const tabStrip = qs('.s08__tabs', section)
  const setStatus = (i: number) => {
    if (i === currentPage) return
    currentPage = i
    status.textContent = i < 0 ? 'Closed' : `Page ${i + 1} / ${N} — ${bookPages[i].label}`
    tabs.forEach((t, j) => t.setAttribute('aria-current', `${j === i}`))
    // the strip scrolls horizontally: keep the current section's tab in view instead of
    // leaving it clipped at the edge
    const active = tabs[i]
    if (active) {
      const want = active.offsetLeft - (tabStrip.clientWidth - active.offsetWidth) / 2
      tabStrip.scrollTo({ left: Math.max(0, want), behavior: reducedMotion ? 'auto' : 'smooth' })
    }
  }

  function apply(p: number) {
    const open = flipOf(0, p)
    // Desktop: the book slides to centre as it opens.
    // Mobile: the book (two pages wide) is far wider than the screen and is NOT centred by the
    // layout, so a proportional shift left the readable page hanging off the right edge. The
    // offset is measured from the real geometry instead — see pageOffset().
    if (isNarrow()) {
      book.style.transform = `translateX(${pageOffset()}px) rotateX(3deg)`
    } else {
      book.style.transform = `translateX(calc(var(--bw) * ${-0.5 + open * 0.5})) rotateX(8deg)`
    }
    setLeaf(cover, open)
    let done = open >= 0.5 ? 0 : -1
    leaves.forEach((l, i) => { if (i === N - 1) { setLeaf(l, 0); return } const f = flipOf(i + 1, p); setLeaf(l, f); if (f >= 0.5) done = i + 1 })
    setStatus(open < 0.5 ? -1 : Math.min(done, N - 1))
    hint.style.opacity = `${seg(p, 0.01, 0.04) * (1 - seg(p, 0.06, 0.1))}`
    const x = seg(p, 0.9, 1); world.style.opacity = `${1 - x}`; world.style.transform = `scale(${1 + x * 0.12}) translateY(${-x * 8}vh)`
    ;(section.querySelector('.s08__ui') as HTMLElement).style.opacity = `${1 - seg(p, 0.86, 0.94)}`
  }
  const goTo = (i: number) => { // page i is the right-hand page once flip i (cover = 0) has completed
    const target = FLIP_START(i) + FLIP_LEN + 0.012
    if (reducedMotion) { apply(target); return }
    const y = section.offsetTop + target * (section.offsetHeight - innerHeight)
    lenis ? lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: 'smooth' })
  }
  tabs.forEach((t) => t.addEventListener('click', () => goTo(+t.dataset.i!)))
  addEventListener('keydown', (e) => {
    const r = section.getBoundingClientRect(); if (r.top > 0 || r.bottom < innerHeight) return
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(Math.min(N - 1, currentPage + 1)) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(Math.max(0, currentPage - 1)) }
  })
  if (reducedMotion) { apply(FLIP_START(0) + FLIP_LEN + 0.012); return section }
  bindScene(section, apply)
  return section
}

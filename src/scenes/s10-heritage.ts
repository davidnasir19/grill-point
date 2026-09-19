import { bindScene } from '../animations/scroll'
import { el, qs, qsa, seg, easeOut } from '../utils/dom'
import { picture } from '../utils/media'
import { restaurant } from '../data/restaurant'

export function mountHeritage(film: HTMLElement) {
  const quote = restaurant.reviews[0]
  const section = el(`<section class="scene scene--pin s10" style="--len:1.6" data-scene="Twenty years" aria-label="Our story">
    <div class="stage">
      <div class="s10__obj s10__obj--a">${picture('cat-sweets', { alt: 'Baklava', sizes: '320px' })}</div>
      <div class="s10__obj s10__obj--b">${picture('cat-drinks', { alt: 'Turkish tea', sizes: '320px' })}</div>
      <div class="s10__sig">${picture('signature', { alt: 'Hoda — signature', sizes: '560px' })}</div>
      <p class="s10__sig-caption eyebrow">The same hands, for twenty years</p>
      <blockquote class="s10__quote">
        <p class="display">“In the last many years, the owner and server has remained the same — and I have not had un-delicious food.”</p>
        <cite>${quote.author} · ${quote.source} · 12th check-in</cite>
      </blockquote>
      <div class="s10__tags">${restaurant.cuisine.map((c) => `<span>${c}</span>`).join('')}</div>
      <div class="s10__dust" aria-hidden="true"></div>
    </div></section>`)
  film.appendChild(section)
  const sig = qs('.s10__sig', section), cap = qs('.s10__sig-caption', section), q = qs('.s10__quote .display', section), cite = qs('.s10__quote cite', section)
  const tags = qsa('.s10__tags span', section), dust = qs('.s10__dust', section), objA = qs('.s10__obj--a', section), objB = qs('.s10__obj--b', section)

  bindScene(section, (p) => {
    const w = easeOut(seg(p, 0.04, 0.4)); sig.style.clipPath = `inset(0 ${(1 - w) * 100}% 0 0)`
    cap.style.opacity = `${seg(p, 0.4, 0.5) * (1 - seg(p, 0.84, 0.9))}`
    const qv = seg(p, 0.3, 0.48) * (1 - seg(p, 0.84, 0.92)); q.style.opacity = `${qv}`; q.style.transform = `translateY(${20 * (1 - qv)}px)`
    cite.style.opacity = `${seg(p, 0.46, 0.56) * (1 - seg(p, 0.84, 0.92))}`
    tags.forEach((t, i) => { const v = seg(p, 0.52 + i * 0.06, 0.62 + i * 0.06) * (1 - seg(p, 0.86, 0.94)); t.style.opacity = `${v}`; t.style.transform = `translateY(${14 * (1 - v)}px)` })
    objA.style.transform = `translateY(${(0.5 - p) * 60}px)`; objB.style.transform = `translateY(${(p - 0.5) * 80}px)`
    // exit: the ink dissolves into distant lights
    const x = seg(p, 0.84, 1)
    sig.style.filter = `blur(${x * 16}px)`; sig.style.opacity = `${1 - x}`; dust.style.opacity = `${x * 0.9}`
    ;(section.querySelector('.stage') as HTMLElement).style.filter = `brightness(${1 - x * 0.6})`
  })
  return section
}

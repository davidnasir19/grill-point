import { scrollToEl } from '../animations/scroll'

/** Vertical story rail: one dot per scene, current one lit. */
export function mountRail(root: HTMLElement, scenes: HTMLElement[]) {
  root.innerHTML = scenes.map((s, i) => `<button type="button" data-i="${i}" aria-label="Go to ${s.dataset.scene}"><span>${s.dataset.scene}</span></button>`).join('')
  const btns = Array.from(root.querySelectorAll('button'))
  btns.forEach((b, i) => b.addEventListener('click', () => scrollToEl(scenes[i], 0)))
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { const i = scenes.indexOf(e.target as HTMLElement); btns.forEach((b, j) => b.toggleAttribute('aria-current', j === i)); if (i === 0) btns.forEach((b, j) => j === 0 && b.setAttribute('aria-current', 'true')) } })
  }, { rootMargin: '-45% 0px -45% 0px' })
  scenes.forEach((s) => io.observe(s))
  const vis = () => root.classList.toggle('is-visible', scrollY > innerHeight * 0.5)
  addEventListener('scroll', vis, { passive: true }); vis()
}

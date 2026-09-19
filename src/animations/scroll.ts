import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { reducedMotion } from '../utils/device'

gsap.registerPlugin(ScrollTrigger)
export { gsap, ScrollTrigger }

export let lenis: Lenis | null = null

export function initScroll() {
  if (reducedMotion) return
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, touchMultiplier: 1.4 })
  lenis.on('scroll', ScrollTrigger.update)
  if (import.meta.env.DEV) (window as any).__lenis = lenis
  gsap.ticker.add((t) => lenis!.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

export function scrollToEl(target: string | HTMLElement, offset = 0) {
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 3) })
  else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ behavior: 'smooth' })
}

/**
 * Binds a pinned scene to a progress callback. The section itself provides the scroll length
 * (CSS `--len`); the sticky `.stage` inside stays on screen while `p` runs 0 → 1.
 */
export function bindScene(section: HTMLElement, onProgress: (p: number) => void, opts: { onEnter?: () => void; onLeave?: () => void } = {}) {
  if (reducedMotion) { onProgress(1); return null }
  let last = -1
  const st = ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (self) => { if (self.progress !== last) { last = self.progress; onProgress(self.progress) } },
    onEnter: opts.onEnter, onEnterBack: opts.onEnter, onLeave: opts.onLeave, onLeaveBack: opts.onLeave,
  })
  dipTriggers(section)
  onProgress(0)
  return st
}

/**
 * Hides the hand-over between two pinned scenes.
 *
 * A sticky stage keeps sliding up for one whole viewport AFTER its scrub progress reaches 1,
 * and the next stage slides in over that same stretch — so both are on screen at once, split by
 * a hard horizontal seam. These two triggers cover exactly that stretch and darken each stage,
 * peaking (sin curve) at the instant the seam would be visible and clearing immediately after.
 */
function dipTriggers(section: HTMLElement) {
  let outP = 0, inP = 0
  const write = () => section.style.setProperty('--dip', `${Math.max(outP, inP).toFixed(3)}`)
  const curve = (t: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 1.4
  ScrollTrigger.create({
    trigger: section, start: 'bottom bottom', end: 'bottom top', scrub: true,
    onUpdate: (self) => { outP = curve(self.progress); write() },
  })
  ScrollTrigger.create({
    trigger: section, start: 'top bottom', end: 'top top', scrub: true,
    onUpdate: (self) => { inP = curve(1 - self.progress); write() },
  })
}

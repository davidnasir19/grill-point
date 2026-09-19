import { bindScene } from '../animations/scroll'
import { SequencePlayer } from '../animations/scrub'
import { Embers } from '../animations/particles'
import { seq } from '../data/sequences'
import { restaurant } from '../data/restaurant'
import { openStatus } from '../utils/hours'
import { findDish } from '../data/menu'
import { reducedMotion, isMobile } from '../utils/device'
import { picture } from '../utils/media'
import { el, qs, qsa, seg, esc, clamp } from '../utils/dom'

interface Copy { at: [number, number]; place?: 'bl' | 'c' | 'bc'; eyebrow?: string; title?: string; body?: string; cite?: string }
interface Shot { id: string; frames: number; weight: number; copy: Copy[]; embers?: boolean }

/**
 * THE VISIT — one pinned scene, one canvas, one continuous playhead.
 * Five clips play back to back; the last image of each is the first image of the next
 * (produced with `end_image`), so the camera walks from the parking lot to the plate
 * without a single cut. Copy ranges are LOCAL to each shot.
 */
export function mountVisit(film: HTMLElement): HTMLElement {
  const status = openStatus()
  const adana = findDish('Adana Kebab', 'Entrees')!

  const SHOTS: Shot[] = ([
    { ...seq('VID_A_ENTER'), weight: 2.0, copy: [
      { at: [0.02, 0.4], place: 'bl', eyebrow: `${restaurant.address.line1} · ${restaurant.address.city}, NJ`,
        title: '<span translate="no">Grill&nbsp;Point</span>', body: `${restaurant.tagline}. <em class="warm">${status.label}</em>` },
      { at: [0.55, 0.98], place: 'bl', title: 'Come in.', body: 'The door is the easy part. What is behind it took twenty years.' },
    ] },
    { ...seq('VID_02_INSIDE'), weight: 1.6, copy: [
      { at: [0.06, 0.5], place: 'bl', title: 'Sit down.', body: '“Nice warm bread with lunch. Spacious eating area. Friendly service.”', cite: 'Stephy S. · Yelp' },
      { at: [0.58, 0.98], place: 'bl', eyebrow: 'Dine in · Takeout · Catering', body: 'Tables for two, tables for twenty. Bread arrives before you order it.' },
    ] },
    { ...seq('VID_C_TOFIRE'), weight: 1.6, copy: [
      { at: [0.06, 0.5], place: 'bl', title: 'Follow the smoke.', body: 'Every plate on this menu starts at the same place.' },
      { at: [0.6, 0.98], place: 'bl', eyebrow: 'The pass', body: 'Charcoal, not gas. Lit before service, kept alive all day.' },
    ] },
    { ...seq('VID_03_GRILL'), weight: 1.8, embers: true, copy: [
      { at: [0.08, 0.58], place: 'c', title: 'Everything begins <em class="warm">over the fire.</em>' },
      { at: [0.64, 0.98], place: 'bc', body: 'Open flame &nbsp;·&nbsp; Secret spices &nbsp;·&nbsp; Twenty years' },
    ] },
    { ...seq('VID_D_PLATE'), weight: 1.7, copy: [
      { at: [0.42, 0.78], place: 'bl', title: 'And ends on the plate.' },
      { at: [0.8, 0.99], place: 'bl', eyebrow: `${adana.name} · ${adana.prices[0]}`, body: adana.description },
    ] },
  ] as Shot[]).filter((s) => s.frames > 0)

  const total = SHOTS.reduce((s, x) => s + x.weight, 0)
  // cumulative start fraction of each shot along the whole scene
  const starts: number[] = []
  SHOTS.reduce((acc, s) => { starts.push(acc / total); return acc + s.weight }, 0)
  const spans = SHOTS.map((s) => s.weight / total)

  const PLACE = { bl: 'shot__copy--bl', c: 'shot__copy--c', bc: 'shot__copy--bc' }
  const section = el(`<section class="scene scene--pin visit" style="--len:${isMobile() ? total * 0.78 : total}" data-scene="The visit" aria-label="A walk through Grill Point, from the door to the plate">
    <div class="stage">
      <div class="shot">${picture('facade', { alt: 'Grill Point at night on Route 9', sizes: '100vw', eager: true })}</div>
      <canvas class="visit__embers" aria-hidden="true"></canvas>
      <div class="shot__scrim" aria-hidden="true"></div>
      ${SHOTS.map((s, k) => s.copy.map((c, j) => `<div class="shot__copy ${PLACE[c.place ?? 'bl']}" data-k="${k}" data-j="${j}">
        ${c.eyebrow ? `<span class="eyebrow">${esc(c.eyebrow)}</span>` : ''}
        ${c.title ? `<h2 class="display">${c.title}</h2>` : ''}
        ${c.body ? `<p class="lede">${c.body}</p>` : ''}
        ${c.cite ? `<cite>${esc(c.cite)}</cite>` : ''}
      </div>`).join('')).join('')}
      <div class="visit__chapters" aria-hidden="true">${SHOTS.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div>
    </div></section>`)
  film.appendChild(section)

  const shotEl = qs('.shot', section)
  const player = new SequencePlayer(SHOTS.map((s) => ({ id: s.id, frames: s.frames })), { x: 0.5, y: 0.46 })
  shotEl.appendChild(player.canvas)
  const blocks = qsa('.shot__copy', section).map((e) => ({ e, k: +e.dataset.k!, j: +e.dataset.j! }))
  const chapters = qsa('.visit__chapters i', section)
  const embersCanvas = qs<HTMLCanvasElement>('.visit__embers', section)
  const embers = reducedMotion ? null : new Embers(embersCanvas, { max: 220 })

  player.ensure(0)
  let armed = -1

  const apply = (p: number) => {
    // which shot are we in, and how far through it
    let k = SHOTS.length - 1
    for (let i = 0; i < SHOTS.length; i++) if (p < starts[i] + spans[i]) { k = i; break }
    const local = clamp((p - starts[k]) / spans[k])
    player.seek(k, local)

    // decode the next shot while this one plays, so the hand-over is invisible
    if (armed !== k) { armed = k; player.ensure(k + 1) }
    if (local > 0.55) player.ensure(k + 2)

    for (const b of blocks) {
      const c = SHOTS[b.k].copy[b.j]
      const [a, z] = c.at
      const span = z - a
      const v = (b.k === k ? seg(local, a, a + span * 0.2) * (1 - seg(local, z - span * 0.2, z)) : 0)
      b.e.style.opacity = `${v}`
      b.e.style.transform = `translateY(${16 * (1 - Math.min(1, v * 2))}px)`
      b.e.style.visibility = v < 0.01 ? 'hidden' : 'visible'
    }
    chapters.forEach((c, i) => c.classList.toggle('is-on', i === k))

    const fire = SHOTS[k]?.embers ? seg(local, 0.05, 0.3) * (1 - seg(local, 0.85, 1)) : 0
    embersCanvas.style.opacity = `${fire}`
    if (embers) embers.intensity = fire
  }

  if (reducedMotion) {
    player.ensure(0).then(() => player.seek(0, 0.5))
    blocks.forEach((b) => { b.e.style.opacity = '1'; b.e.style.position = 'static' })
  } else {
    bindScene(section, apply, { onEnter: () => embers?.start(), onLeave: () => embers?.stop() })
    new IntersectionObserver((es, io) => { if (es.some((e) => e.isIntersecting)) { player.ensure(0); player.ensure(1); io.disconnect() } }, { rootMargin: '200% 0px' }).observe(section)
  }
  return section
}

import manifest from '../data/images.json'
import { asset } from './asset'
import { videoAllowed } from './device'

type Variant = { w: number; h: number }
type Entry = { variants: Variant[]; aspect: number; alpha?: boolean }
const M = manifest as Record<string, Entry>

export interface PicOpts { alt: string; sizes?: string; eager?: boolean; className?: string; fetchpriority?: 'high' | 'low' }
/** <picture> with AVIF → WebP → JPEG and intrinsic width/height (no layout shift). */
export function picture(id: string, o: PicOpts): string {
  const e = M[id]; if (!e) throw new Error(`unknown image ${id}`)
  const vs = e.variants, last = vs[vs.length - 1]
  const set = (ext: string) => vs.map((v) => `${asset(`assets/img/${id}-${v.w}.${ext}`)} ${v.w}w`).join(', ')
  const sizes = o.sizes ?? '100vw'
  if (e.alpha) return `<picture class="pic ${o.className ?? ''}"><source type="image/webp" srcset="${asset(`assets/img/${id}-${last.w}.webp`)}"><img src="${asset(`assets/img/${id}-${last.w}.png`)}" width="${last.w}" height="${last.h}" alt="${o.alt}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async"></picture>`
  return `<picture class="pic ${o.className ?? ''}">
    <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
    <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
    <img src="${asset(`assets/img/${id}-${last.w}.jpg`)}" srcset="${set('jpg')}" sizes="${sizes}" width="${last.w}" height="${last.h}" alt="${o.alt}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async"${o.fetchpriority ? ` fetchpriority="${o.fetchpriority}"` : ''}>
  </picture>`
}
export const aspectOf = (id: string) => M[id].aspect

/**
 * Video clips produced for the story. `available` is flipped to true once a clip exists in
 * /public/assets/video — until then the scene plays its poster with a slow Ken Burns move.
 */
export const clips: Record<string, { poster: string; available: boolean; loop: boolean }> = {
  VID_01_ARRIVAL: { poster: 'facade', available: true, loop: true },
  VID_02_INSIDE:  { poster: 'interior-b', available: true, loop: true },
  VID_03_GRILL:   { poster: 'adana', available: true, loop: true },
  VID_04_PLATING: { poster: 'adana', available: true, loop: true },
}

/** Returns a media-fill element: poster picture, plus a lazily-attached <video> when allowed. */
export function videoSlot(id: keyof typeof clips, alt: string, sizes = '100vw'): HTMLElement {
  const c = clips[id]
  const wrap = document.createElement('div')
  wrap.className = 'media-fill' + (c.available && videoAllowed() ? '' : ' kenburns')
  wrap.innerHTML = picture(c.poster, { alt, sizes, eager: id === 'VID_01_ARRIVAL', fetchpriority: id === 'VID_01_ARRIVAL' ? 'high' : undefined })
  if (c.available && videoAllowed()) {
    const v = document.createElement('video')
    v.muted = true; v.playsInline = true; v.loop = c.loop; v.preload = 'none'; v.setAttribute('aria-hidden', 'true')
    v.innerHTML = `<source src="${asset(`assets/video/${id}.webm`)}" type="video/webm"><source src="${asset(`assets/video/${id}.mp4`)}" type="video/mp4">`
    v.addEventListener('canplay', () => wrap.classList.add('is-video-ready'), { once: true })
    v.addEventListener('error', () => wrap.classList.add('kenburns'), { once: true })
    wrap.appendChild(v)
    // load only when the scene approaches
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { v.preload = 'auto'; v.load(); v.play().catch(() => {}); io.disconnect() } }, { rootMargin: '150% 0px' })
    io.observe(wrap)
  }
  return wrap
}

/** A bare looping <video> for clips that have their own extracted poster (fire, plating). Null when the clip is unavailable or video is disallowed. */
export function clipVideo(id: keyof typeof clips): HTMLVideoElement | null {
  const c = clips[id]
  if (!c.available || !videoAllowed()) return null
  const v = document.createElement('video')
  v.muted = true; v.playsInline = true; v.loop = true; v.preload = 'none'; v.setAttribute('aria-hidden', 'true')
  v.poster = asset(`assets/video/${id}-poster.jpg`)
  v.innerHTML = `<source src="${asset(`assets/video/${id}.webm`)}" type="video/webm"><source src="${asset(`assets/video/${id}.mp4`)}" type="video/mp4">`
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { v.preload = 'auto'; v.load(); v.play().catch(() => {}); io.disconnect() } }, { rootMargin: '150% 0px' })
  io.observe(v)
  return v
}

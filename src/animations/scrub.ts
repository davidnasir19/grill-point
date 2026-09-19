import { clamp } from '../utils/dom'
import { asset } from '../utils/asset'
import { isMobile, reducedMotion, saveData, tier } from '../utils/device'

/**
 * Scroll-scrubbed frame sequence: the scroll IS the playhead.
 * Frames are decoded to ImageBitmaps and painted on a canvas with object-fit:cover maths,
 * so the "camera" moves forward and backward exactly with the user's scroll.
 */
export interface ScrubOpts {
  /** clip id under /assets/seq/<id>/ */
  id: string
  /** number of frames in the sequence */
  frames: number
  /** poster shown until enough frames are ready */
  poster?: string
  /** how much of the sequence to have ready before revealing (0..1) */
  warmup?: number
  /** object-position, as fractions (0.5 = centre) */
  focus?: { x?: number; y?: number }
}

const supportsBitmap = typeof createImageBitmap === 'function'

export class Scrubber {
  readonly canvas = document.createElement('canvas')
  private ctx: CanvasRenderingContext2D
  private bitmaps: (ImageBitmap | HTMLImageElement | null)[]
  private loaded = 0
  private width: number
  private dpr = Math.min(devicePixelRatio || 1, tier === 2 ? 2 : 1.5)
  private cw = 0; private ch = 0
  private current = -1
  private pending = 0
  private started = false
  private focusX: number; private focusY: number
  ready = false

  constructor(private o: ScrubOpts) {
    this.bitmaps = new Array(o.frames).fill(null)
    this.width = isMobile() || saveData || tier === 0 ? 720 : 1280
    this.focusX = o.focus?.x ?? 0.5
    this.focusY = o.focus?.y ?? 0.5
    this.canvas.className = 'scrub'
    this.canvas.setAttribute('aria-hidden', 'true')
    this.ctx = this.canvas.getContext('2d', { alpha: false })!
    this.resize()
    addEventListener('resize', () => { this.resize(); this.paint(this.current, true) }, { passive: true })
  }

  private url(i: number) { return asset(`assets/seq/${this.o.id}/${this.width}/${String(i).padStart(3, '0')}.webp`) }

  private resize() {
    const r = this.canvas.getBoundingClientRect()
    this.cw = r.width || innerWidth; this.ch = r.height || innerHeight
    this.canvas.width = Math.round(this.cw * this.dpr)
    this.canvas.height = Math.round(this.ch * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  /** Decode one frame; resolves whether it succeeded. */
  private async load(i: number): Promise<void> {
    if (this.bitmaps[i] || this.pending > 6) return
    this.pending++
    try {
      if (supportsBitmap) {
        const res = await fetch(this.url(i))
        if (!res.ok) throw new Error(String(res.status))
        this.bitmaps[i] = await createImageBitmap(await res.blob())
      } else {
        const img = new Image()
        img.decoding = 'async'; img.src = this.url(i)
        await img.decode()
        this.bitmaps[i] = img
      }
      this.loaded++
    } catch { /* a missing frame simply keeps the previous one on screen */ }
    finally { this.pending-- }
  }

  /** Begin loading: the warm-up slice first, then everything else in the background. */
  start() {
    if (this.started || this.o.frames < 1) return
    this.started = true
    const warm = Math.max(2, Math.round(this.o.frames * (this.o.warmup ?? 0.25)))
    const order = [
      ...Array.from({ length: warm }, (_, i) => Math.round((i / Math.max(1, warm - 1)) * (this.o.frames - 1))),
      ...Array.from({ length: this.o.frames }, (_, i) => i),
    ]
    const seen = new Set<number>()
    const queue = order.filter((i) => !seen.has(i) && seen.add(i))
    const pump = async () => {
      for (const i of queue) {
        await this.load(i)
        if (!this.ready && this.loaded >= Math.min(3, this.o.frames)) { this.ready = true; this.canvas.classList.add('is-ready'); this.paint(this.current < 0 ? 0 : this.current, true) }
      }
    }
    pump(); pump(); pump()
  }

  /** Nearest already-decoded frame, so scrubbing never shows a blank. */
  private nearest(i: number) {
    if (this.bitmaps[i]) return i
    for (let d = 1; d < this.o.frames; d++) {
      if (this.bitmaps[i - d]) return i - d
      if (this.bitmaps[i + d]) return i + d
    }
    return -1
  }

  private paint(i: number, force = false) {
    if (i < 0) return
    const n = this.nearest(i)
    if (n < 0) return
    if (n === this.current && !force) return
    this.current = n
    const b = this.bitmaps[n]!
    const bw = (b as ImageBitmap).width, bh = (b as ImageBitmap).height
    const scale = Math.max(this.cw / bw, this.ch / bh)
    const w = bw * scale, h = bh * scale
    this.ctx.drawImage(b as CanvasImageSource, (this.cw - w) * this.focusX, (this.ch - h) * this.focusY, w, h)
  }

  /** p in 0..1 — the scroll position inside this shot. */
  seek(p: number) {
    if (this.o.frames < 1) return
    this.paint(Math.round(clamp(p) * (this.o.frames - 1)))
  }

  /** Static poster frame for reduced-motion / failure. */
  freeze(p = 0.5) { this.start(); this.seek(p) }

  destroy() {
    this.bitmaps.forEach((b) => (b as ImageBitmap)?.close?.())
    this.bitmaps = []
  }
}

/** Builds a scrubber plus its fallback picture layer, ready to drop into a stage. */
export function scrubShot(o: ScrubOpts & { alt: string; posterHtml: string }) {
  const wrap = document.createElement('div')
  wrap.className = 'shot'
  wrap.innerHTML = o.posterHtml
  const s = new Scrubber(o)
  wrap.appendChild(s.canvas)
  if (reducedMotion) s.freeze(0.35)
  return { wrap, scrubber: s }
}

export interface Clip { id: string; frames: number }

/**
 * One canvas, many clips, one timeline.
 *
 * The visit used to be five pinned sections. At every boundary the outgoing sticky stage slid
 * up while the incoming one slid in, so two shots were on screen at once, split by a hard
 * horizontal seam — that was the "trembling" and the feeling that the shots were unrelated.
 * Here the whole visit is a single canvas and the scroll drives one continuous playhead.
 */
export class SequencePlayer {
  readonly canvas = document.createElement('canvas')
  private ctx: CanvasRenderingContext2D
  private store: (ImageBitmap | HTMLImageElement | null)[][]
  private done: boolean[]
  private started: boolean[]
  private width: number
  private dpr = Math.min(devicePixelRatio || 1, tier === 2 ? 2 : 1.5)
  private cw = 0; private ch = 0
  private painted = ''
  ready = false

  constructor(private clips: Clip[], private focus = { x: 0.5, y: 0.5 }) {
    this.store = clips.map((c) => new Array(c.frames).fill(null))
    this.done = clips.map(() => false)
    this.started = clips.map(() => false)
    this.width = isMobile() || saveData || tier === 0 ? 720 : 1280
    this.canvas.className = 'scrub'
    this.canvas.setAttribute('aria-hidden', 'true')
    this.ctx = this.canvas.getContext('2d', { alpha: false })!
    this.resize()
    addEventListener('resize', () => { this.resize(); this.repaint() }, { passive: true })
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect()
    this.cw = r.width || innerWidth; this.ch = r.height || innerHeight
    this.canvas.width = Math.round(this.cw * this.dpr)
    this.canvas.height = Math.round(this.ch * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  /** Decode a whole clip before it is ever shown — partial clips are what made it stutter. */
  async ensure(k: number) {
    if (k < 0 || k >= this.clips.length || this.started[k]) return
    this.started[k] = true
    const { id, frames } = this.clips[k]
    let inFlight = 0
    const load = async (i: number) => {
      try {
        const res = await fetch(asset(`assets/seq/${id}/${this.width}/${String(i).padStart(3, '0')}.webp`))
        if (!res.ok) throw new Error(String(res.status))
        this.store[k][i] = await createImageBitmap(await res.blob())
      } catch { /* a hole simply reuses the neighbouring frame */ }
    }
    const queue = Array.from({ length: frames }, (_, i) => i)
    const workers = Array.from({ length: 6 }, async () => {
      while (queue.length) { inFlight++; await load(queue.shift()!); inFlight-- }
    })
    await Promise.all(workers)
    void inFlight
    this.done[k] = true
    if (!this.ready) { this.ready = true; this.canvas.classList.add('is-ready') }
    this.repaint()
  }

  private nearest(k: number, i: number) {
    const arr = this.store[k]
    if (arr[i]) return i
    for (let d = 1; d < arr.length; d++) {
      if (arr[i - d]) return i - d
      if (arr[i + d]) return i + d
    }
    return -1
  }

  private last = { k: 0, i: 0 }
  private repaint() { this.paint(this.last.k, this.last.i) }

  private paint(k: number, i: number) {
    // Until a clip is fully decoded, hold whatever is already on screen: the previous clip ends
    // on the same image this one starts from, so the camera appears to pause rather than tear.
    if (!this.done[k]) return
    const n = this.nearest(k, i)
    if (n < 0) return
    const key = `${k}:${n}`
    if (key === this.painted) return
    this.painted = key; this.last = { k, i: n }
    const b = this.store[k][n]! as ImageBitmap
    const scale = Math.max(this.cw / b.width, this.ch / b.height)
    const w = b.width * scale, h = b.height * scale
    this.ctx.drawImage(b as CanvasImageSource, (this.cw - w) * this.focus.x, (this.ch - h) * this.focus.y, w, h)
  }

  /** local is 0..1 inside clip k. */
  seek(k: number, local: number) {
    this.paint(k, Math.round(clamp(local) * (this.clips[k].frames - 1)))
  }
  isDone(k: number) { return this.done[k] }
}

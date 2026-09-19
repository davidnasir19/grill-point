import { tier } from '../utils/device'

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; hue: number }

/** Embers + soft smoke on a 2D canvas. Intensity 0→1 drives spawn rate; cheap enough for mid-tier devices. */
export class Embers {
  private ctx: CanvasRenderingContext2D
  private ps: P[] = []
  private raf = 0
  private w = 0; private h = 0
  intensity = 0
  private cap: number
  private dpr = Math.min(devicePixelRatio || 1, 1.5)
  constructor(private canvas: HTMLCanvasElement, opts: { max?: number } = {}) {
    this.ctx = canvas.getContext('2d', { alpha: true })!
    this.cap = opts.max ?? [80, 160, 360][tier]
    this.resize(); addEventListener('resize', () => this.resize(), { passive: true })
  }
  resize() {
    const r = this.canvas.getBoundingClientRect()
    this.w = r.width; this.h = r.height
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }
  start() { if (!this.raf) { const loop = () => { this.step(); this.raf = requestAnimationFrame(loop) }; this.raf = requestAnimationFrame(loop) } }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; this.ctx.clearRect(0, 0, this.w, this.h) }
  private spawn() {
    const smoke = Math.random() < 0.18
    this.ps.push({
      x: this.w * (0.2 + Math.random() * 0.6), y: this.h * (0.75 + Math.random() * 0.3),
      vx: (Math.random() - 0.5) * 0.35, vy: -(0.6 + Math.random() * 1.3) * (smoke ? 0.5 : 1),
      life: 0, max: (smoke ? 260 : 120) + Math.random() * 120, r: smoke ? 18 + Math.random() * 40 : 0.8 + Math.random() * 2.2, hue: smoke ? -1 : 18 + Math.random() * 26,
    })
  }
  private step() {
    const { ctx, w, h } = this
    ctx.clearRect(0, 0, w, h)
    const want = Math.round(this.cap * this.intensity)
    for (let i = 0; i < 3 && this.ps.length < want; i++) this.spawn()
    ctx.globalCompositeOperation = 'lighter'
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i]; p.life++
      p.x += p.vx + Math.sin((p.life + p.y) * 0.02) * 0.25; p.y += p.vy; p.vy *= 0.995
      const t = p.life / p.max, a = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85
      if (p.life >= p.max || p.y < -50) { this.ps.splice(i, 1); continue }
      if (p.hue < 0) { // smoke
        ctx.globalCompositeOperation = 'source-over'
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
        g.addColorStop(0, `rgba(120,90,70,${0.05 * a * this.intensity})`); g.addColorStop(1, 'rgba(120,90,70,0)')
        ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2)
        ctx.globalCompositeOperation = 'lighter'
      } else {
        ctx.fillStyle = `hsla(${p.hue},100%,${55 + 20 * a}%,${0.9 * a})`
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      }
    }
    ctx.globalCompositeOperation = 'source-over'
  }
}

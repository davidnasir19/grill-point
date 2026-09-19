/**
 * Every asset URL the app can build, checked against what is really in dist/ — byte-for-byte,
 * so a case or extension difference is caught. macOS is case-insensitive; the GitHub runner is not.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
const DIST = 'dist'
const wanted = new Set()
const add = (p) => wanted.add(p.replace(/^\.?\//, ''))

// images: picture() builds <id>-<w>.{avif,webp,jpg}; alpha entries use .png/.webp
const img = JSON.parse(readFileSync('src/data/images.json', 'utf8'))
for (const [id, e] of Object.entries(img)) {
  const last = e.variants[e.variants.length - 1]
  if (e.alpha) { add(`assets/img/${id}-${last.w}.png`); add(`assets/img/${id}-${last.w}.webp`); continue }
  for (const v of e.variants) for (const ext of ['avif', 'webp', 'jpg']) add(`assets/img/${id}-${v.w}.${ext}`)
}
// scrub sequences: both widths, every frame
const seq = JSON.parse(readFileSync('src/data/sequences.json', 'utf8'))
for (const [id, e] of Object.entries(seq))
  for (const w of [1280, 720])
    for (let i = 0; i < e.frames; i++) add(`assets/seq/${id}/${w}/${String(i).padStart(3, '0')}.webp`)
// map composites referenced in the scenes
const src = ['src/scenes/s02-descent.ts', 'src/scenes/s11-return.ts'].map((f) => readFileSync(f, 'utf8')).join('\n')
const zooms = [...src.matchAll(/ZOOMS = \[([\d,\s]+)\]/g)].flatMap((m) => m[1].split(',').map((n) => n.trim()))
for (const z of zooms.length ? zooms : [7, 10, 12, 14, 16]) for (const ext of ['avif', 'webp', 'jpg']) add(`assets/map/map-z${z}.${ext}`)
for (const m of src.matchAll(/map-z(\d+)\.(avif|webp|jpg)/g)) add(`assets/map/map-z${m[1]}.${m[2]}`)
// earth textures + video clips still played as <video>
for (const m of readFileSync('src/scenes/s01-earth.ts', 'utf8').matchAll(/assets\/earth\/([\w.]+)/g)) add(`assets/earth/${m[1]}`)
const media = readFileSync('src/utils/media.ts', 'utf8')
for (const m of media.matchAll(/(\w+):\s*\{\s*poster:[^}]*available:\s*true/g)) {
  const id = m[1]
  for (const f of [`${id}.webm`, `${id}.mp4`, `${id}-poster.jpg`]) add(`assets/video/${f}`)
}

const missing = [...wanted].filter((p) => !existsSync(join(DIST, p)))
// exact-case check: compare against the real directory listing
const caseIssues = []
for (const p of wanted) {
  const parts = p.split('/'); const file = parts.pop()
  const dir = join(DIST, parts.join('/'))
  if (!existsSync(dir)) continue
  if (!readdirSync(dir).includes(file)) caseIssues.push(p)
}
console.log(`URL attendues par le code : ${wanted.size}`)
console.log(`absentes de dist/         : ${missing.length}`)
missing.slice(0, 12).forEach((m) => console.log('   MANQUE', m))
console.log(`casse/extension differente: ${caseIssues.length}`)
caseIssues.slice(0, 12).forEach((m) => console.log('   CASSE ', m))
process.exit(missing.length + caseIssues.length ? 1 : 0)

import manifest from './sequences.json'

type Entry = { frames: number; kb: number }
const M = manifest as Record<string, Entry>

/** Frame count for a scrub sequence, with a safe fallback when a clip has not been produced yet. */
export function seq(id: string): { id: string; frames: number } {
  const e = M[id]
  if (!e) {
    console.warn(`[seq] "${id}" has no frames yet — the scene will show its poster.`)
    return { id, frames: 0 }
  }
  return { id, frames: e.frames }
}
export const totalKb = Object.values(M).reduce((s, e) => s + e.kb, 0)

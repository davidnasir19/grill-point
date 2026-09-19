export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
export const coarsePointer = matchMedia('(pointer: coarse)').matches
export const isMobile = () => innerWidth < 720
const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } }
export const saveData = !!nav.connection?.saveData || /2g/.test(nav.connection?.effectiveType ?? '')
/** 0 = low, 1 = mid, 2 = high — drives particle counts, WebGL resolution, video usage. */
export const tier: 0 | 1 | 2 = (() => {
  const cores = navigator.hardwareConcurrency ?? 4, mem = nav.deviceMemory ?? 8
  if (reducedMotion || saveData || cores <= 2 || mem <= 2) return 0
  if (cores <= 4 || mem <= 4 || isMobile()) return 1
  return 2
})()
export const videoAllowed = () => tier > 0 && !saveData && innerWidth >= 720

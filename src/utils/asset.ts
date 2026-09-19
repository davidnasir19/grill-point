/**
 * Resolves a runtime asset URL against the deployment base.
 *
 * Absolute paths like "/assets/img/x.webp" only work when the site sits at the domain root.
 * On GitHub Pages a project site lives under /<repo>/, so every URL built at runtime has to
 * carry that prefix. Vite exposes it as import.meta.env.BASE_URL (we build with base "./",
 * which resolves relative to the page and therefore works at any depth).
 */
const BASE = import.meta.env.BASE_URL || '/'
export const asset = (path: string) => `${BASE}${path.replace(/^\/+/, '')}`.replace(/([^:])\/{2,}/g, '$1/')

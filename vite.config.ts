import { defineConfig } from 'vite'

export default defineConfig({
  // './' keeps every URL relative, so the same build works at a domain root AND under
  // GitHub Pages' /<repo>/ sub-path without knowing the repository name.
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Three.js only serves the opening scene: keep it out of the main bundle.
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three'
          if (/node_modules\/(gsap|lenis)/.test(id)) return 'motion'
        },
      },
    },
  },
})

import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/scenes.css'
import { initScroll, ScrollTrigger, scrollToEl } from './animations/scroll'
import { mountNav } from './components/nav'
import { mountDock } from './components/dock'
import { mountRail } from './components/progress'
import { mountSheet } from './components/dish-sheet'
import { mountEarth } from './scenes/s01-earth'
import { mountDescent } from './scenes/s02-descent'
import { mountVisit } from './scenes/visit'
import { mountShowcase } from './scenes/s07-showcase'
import { mountBook } from './scenes/s08-book'
import { mountMenu } from './scenes/s09-menu'
import { mountHeritage } from './scenes/s10-heritage'
import { mountReturn } from './scenes/s11-return'
import { mountBookTable } from './scenes/s12-book'
import { restaurant, DAY_NAMES } from './data/restaurant'
import { qs } from './utils/dom'

history.scrollRestoration = 'manual'
const film = qs('#film')
initScroll()

/**
 * The film, in order. Scenes 3–7 are one continuous scrubbed camera move
 * (see scenes/visit.ts): the scroll is the playhead, never a slideshow.
 */
const earth = mountEarth(film)
const scenes = [
  earth.section,
  mountDescent(film),
  mountVisit(film),
  mountShowcase(film),
  mountBook(film),
  mountMenu(film),
  mountHeritage(film),
  mountReturn(film),
  mountBookTable(film),
]

mountSheet(qs('#sheet'))
mountNav(qs('#nav'))
mountDock(qs('#dock'))
mountRail(qs('#rail'), scenes)

// Structured data — the legacy site published none at all.
const ld = {
  '@context': 'https://schema.org', '@type': 'Restaurant', name: `${restaurant.name} ${restaurant.tagline}`, servesCuisine: restaurant.cuisine.slice(0, 2), telephone: restaurant.phoneHref.slice(4), email: restaurant.email,
  address: { '@type': 'PostalAddress', streetAddress: restaurant.address.line1, addressLocality: restaurant.address.city, addressRegion: restaurant.address.state, postalCode: restaurant.address.zip, addressCountry: 'US' },
  geo: { '@type': 'GeoCoordinates', latitude: restaurant.coords.lat, longitude: restaurant.coords.lng },
  openingHoursSpecification: restaurant.hours.map((h, i) => h && { '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_NAMES[i], opens: `${String(Math.floor(h.open / 60)).padStart(2, '0')}:00`, closes: `${String(Math.floor(h.close / 60)).padStart(2, '0')}:00` }).filter(Boolean),
  acceptsReservations: 'True', hasMenu: `${location.origin}/#menu`, url: location.origin, sameAs: [restaurant.links.facebook, restaurant.links.instagram, restaurant.links.yelp],
}
qs('#ld-restaurant').textContent = JSON.stringify(ld)

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]:not([data-cat])'); if (!a) return
  const t = document.querySelector<HTMLElement>(a.getAttribute('href')!); if (!t) return
  e.preventDefault(); scrollToEl(t, -60)
})

Promise.all([earth.ready, (document as any).fonts?.ready ?? Promise.resolve()]).then(() => {
  ScrollTrigger.refresh()
  qs('#loader').classList.add('loader--done')
  setTimeout(() => qs('#loader').remove(), 900)
})
addEventListener('load', () => ScrollTrigger.refresh())
if (import.meta.env.DEV) (window as any).__scenes = scenes

import { el, qs, qsa, esc } from '../utils/dom'
import { logoSvg } from '../components/logo'
import { restaurant, DAY_NAMES } from '../data/restaurant'
import { hoursTable, slotsFor } from '../utils/hours'
import { scrollToEl } from '../animations/scroll'

export function mountBookTable(film: HTMLElement) {
  const today = new Date(); const min = today.toISOString().slice(0, 10)
  const section = el(`<section class="scene s12" id="book" data-scene="Book a table" aria-label="Book a table or order">
    <div class="s12__inner">
      <div>
        <span class="eyebrow">Reservations · groups · private events</span>
        <h2 class="display">Book a table.</h2>
        <p class="s12__lead">Birthdays, office lunches, baby showers — tell us the date and how many, and we'll call you back to confirm. For tonight, just call.</p>
        <form class="form" novalidate>
          <div class="form__row">
            <div class="field"><label for="r-date">Date</label><input id="r-date" name="date" type="date" min="${min}" required><small></small></div>
            <div class="field"><label for="r-time">Time</label><select id="r-time" name="time" required disabled><option value="">Pick a date first</option></select></div>
            <div class="field"><label for="r-people">Guests</label><select id="r-people" name="people" required>${Array.from({ length: restaurant.reservations.maxPartyOnline }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? 'guests' : 'guest'}</option>`).join('')}<option value="10+">More than 10 — we'll call you</option></select></div>
          </div>
          <div class="form__row">
            <div class="field"><label for="r-name">Name</label><input id="r-name" name="name" type="text" autocomplete="name" required></div>
            <div class="field"><label for="r-phone">Phone</label><input id="r-phone" name="phone" type="tel" autocomplete="tel" required></div>
            <div class="field"><label for="r-email">Email</label><input id="r-email" name="email" type="email" autocomplete="email" required></div>
          </div>
          <div class="field"><label for="r-notes">Occasion or requests (optional)</label><input id="r-notes" name="notes" type="text" placeholder="Birthday, high chair, window table…"></div>
          <p class="form__msg" aria-live="polite"></p>
          <div class="form__actions"><button class="btn btn--primary" type="submit">Send the request</button><a class="btn btn--ghost" href="${restaurant.phoneHref}">Or call ${restaurant.phone}</a></div>
          <small class="sheet__fine">This opens a pre-filled email to the restaurant. Requests are confirmed by phone — nothing is booked until we call you back.</small>
        </form>
      </div>
      <div class="order-card">
        <div class="order-card__box">
          <h4>Order online</h4>
          <p>Pickup and scheduled orders, ${fmtWindow(restaurant.onlineOrderingHours)}. Delivery through DoorDash.</p>
          <div class="s07__actions"><a class="btn btn--sign btn--sm" href="${restaurant.links.order}" target="_blank" rel="noopener">Start an order</a><a class="btn btn--ghost btn--sm" href="${restaurant.links.doordash}" target="_blank" rel="noopener">DoorDash</a></div>
          <p class="sheet__fine">Online prices may differ slightly from the dining-room menu. Lunch special is dine-in only.</p>
        </div>
        <div class="order-card__box">
          <h4>Hours</h4>
          <ul class="hours">${hoursTable().map((h) => `<li class="${h.today ? 'is-today' : ''}"><span>${h.day}</span><span>${h.text}</span></li>`).join('')}</ul>
        </div>
      </div>
    </div>
    <footer class="footer">
      <div class="footer__brand">${logoSvg()}<div><strong translate="no">${restaurant.name}</strong><br><small>${restaurant.tagline}</small></div></div>
      <div class="footer__links">
        <a href="${restaurant.links.instagram}" target="_blank" rel="noopener">Instagram</a>
        <a href="${restaurant.links.facebook}" target="_blank" rel="noopener">Facebook</a>
        <a href="${restaurant.links.yelp}" target="_blank" rel="noopener">Yelp</a>
        <a href="${restaurant.links.doordash}" target="_blank" rel="noopener">DoorDash</a>
        <a href="#menu">Menu</a>
      </div>
      <small>${restaurant.address.full} · <a href="${restaurant.phoneHref}">${restaurant.phone}</a></small>
    </footer>
  </section>`)
  film.appendChild(section)

  const form = qs<HTMLFormElement>('form', section), date = qs<HTMLInputElement>('#r-date', section), time = qs<HTMLSelectElement>('#r-time', section), hint = qs('#r-date + small', section) ?? qs('.field small', section), msg = qs('.form__msg', section)
  date.addEventListener('change', () => {
    const d = new Date(date.value + 'T12:00:00'); const slots = slotsFor(d)
    time.innerHTML = slots.length ? `<option value="">Choose a time</option>${slots.map((s) => `<option>${s}</option>`).join('')}` : `<option value="">Closed that day</option>`
    time.disabled = !slots.length
    hint.textContent = slots.length ? `${DAY_NAMES[d.getDay()]} · last seating ${slots[slots.length - 1]}` : `We're closed on ${DAY_NAMES[d.getDay()]}s — pick another day.`
  })
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const f = new FormData(form), get = (k: string) => String(f.get(k) ?? '').trim()
    const missing = ['date', 'time', 'name', 'phone', 'email'].filter((k) => !get(k))
    if (missing.length || time.disabled) { msg.textContent = time.disabled && get('date') ? 'We are closed on that day.' : 'Please fill in the date, time, your name, phone and email.'; return }
    const subject = `Table request — ${get('date')} ${get('time')} — ${get('people')} guests`
    const body = [`Name: ${get('name')}`, `Phone: ${get('phone')}`, `Email: ${get('email')}`, `Date: ${get('date')}`, `Time: ${get('time')}`, `Guests: ${get('people')}`, get('notes') && `Notes: ${get('notes')}`].filter(Boolean).join('\n')
    location.href = `mailto:${restaurant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    msg.textContent = `Your email app should open with the request — we'll confirm by phone at ${get('phone')}.`
  })
  qsa<HTMLAnchorElement>('a[href="#menu"]', section).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollToEl('#menu', -60) }))
  return section
}
const fmtWindow = (h: { open: number; close: number }) => { const f = (m: number) => `${((Math.floor(m / 60) + 11) % 12) + 1} ${m < 720 ? 'AM' : 'PM'}`; return `${f(h.open)} – ${f(h.close)} daily` }
void esc

import { restaurant, DAY_NAMES } from '../data/restaurant'

const fmt = (min: number) => { const h = Math.floor(min / 60), m = min % 60; const h12 = ((h + 11) % 12) + 1; return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}` }
export const formatTime = fmt

function nowInNJ() {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: restaurant.timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date())
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { day, minutes: (parseInt(get('hour')) % 24) * 60 + parseInt(get('minute')) }
}

export interface Status { open: boolean; label: string; short: string }
export function openStatus(): Status {
  const { day, minutes } = nowInNJ()
  const today = restaurant.hours[day]
  if (today && minutes >= today.open && minutes < today.close) {
    const closingSoon = today.close - minutes <= 45
    return { open: true, label: `Open now · until ${fmt(today.close)}`, short: closingSoon ? `Closing ${fmt(today.close)}` : `Open until ${fmt(today.close)}` }
  }
  for (let i = 0; i < 7; i++) {
    const d = (day + i) % 7, h = restaurant.hours[d]
    if (!h) continue
    if (i === 0 && minutes < h.open) return { open: false, label: `Opens today at ${fmt(h.open)}`, short: `Opens ${fmt(h.open)}` }
    if (i > 0) return { open: false, label: `Closed now · opens ${i === 1 ? 'tomorrow' : DAY_NAMES[d]} at ${fmt(h.open)}`, short: `Opens ${i === 1 ? 'tomorrow' : DAY_NAMES[d].slice(0, 3)} ${fmt(h.open)}` }
  }
  return { open: false, label: 'Closed', short: 'Closed' }
}

export function hoursTable(): { day: string; text: string; today: boolean }[] {
  const { day } = nowInNJ()
  return restaurant.hours.map((h, i) => ({ day: DAY_NAMES[i], text: h ? `${fmt(h.open)} – ${fmt(h.close)}` : 'Closed', today: i === day }))
}

/** Reservation slots for a given date: every 30 min from opening to (close − last seating). Empty when closed. */
export function slotsFor(date: Date): string[] {
  const h = restaurant.hours[date.getDay()]
  if (!h) return []
  const out: string[] = []
  for (let t = h.open; t <= h.close - restaurant.reservations.lastSeatingBeforeClose; t += restaurant.reservations.slotMinutes) out.push(fmt(t))
  return out
}

/**
 * Single source of truth for business facts.
 * The legacy site published three contradictory versions of the hours.
 * Values below follow the most detailed version (homepage "Book Table" block) — flags mark
 * what the restaurant must confirm before launch.
 */
export interface DayHours { open: number; close: number } // minutes from midnight, local time

export const restaurant = {
  name: 'Grill Point',
  tagline: 'Mediterranean Cuisine & Café',
  cuisine: ['Mediterranean', 'Turkish', 'Halal'], // "halal" is the site's own claim (about-us meta)
  yearsOpen: 20,
  address: { line1: '415 Route 9 South', city: 'Marlboro', state: 'NJ', zip: '07746', full: '415 Route 9 South, Marlboro, NJ 07746' },
  coords: { lat: 40.3316166, lng: -74.3065493 },
  phone: '(732) 851-5200',
  phoneHref: 'tel:+17328515200',
  email: 'grillpointnj@gmail.com',
  timeZone: 'America/New_York',
  links: {
    order: 'https://grillpointnj.smartonlineorder.com/',
    directions: 'https://www.google.com/maps/dir/?api=1&destination=40.3316166,-74.3065493',
    doordash: 'https://www.doordash.com/store/grill-point-englishtown-463628/',
    yelp: 'https://www.yelp.com/biz/grill-point-mediterranean-cuisine-and-caf%C3%A9-marlboro',
    facebook: 'https://www.facebook.com/grillpointnj/',
    instagram: 'https://www.instagram.com/grillpointnj/',
  },
  /** index 0 = Sunday … 6 = Saturday; null = closed */
  hours: [
    { open: 12 * 60, close: 21 * 60 }, // Sun  — TO CONFIRM: footer omitted Sunday, meta said "Tue-Sat"
    null,                               // Mon  — closed
    { open: 12 * 60, close: 21 * 60 }, // Tue
    { open: 12 * 60, close: 21 * 60 }, // Wed
    { open: 12 * 60, close: 21 * 60 }, // Thu
    { open: 12 * 60, close: 22 * 60 }, // Fri
    { open: 12 * 60, close: 22 * 60 }, // Sat
  ] as (DayHours | null)[],
  onlineOrderingHours: { open: 12 * 60, close: 21 * 60 }, // verified on the ordering platform
  lunch: {
    price: 18,          // TO CONFIRM: a flyer in the old gallery said "Starts at $19.50"
    days: 'Tuesday – Friday',
    window: '12 – 3 PM',
    inStoreOnly: true,  // verified: "Lunch Special - In store only" on the ordering platform
    note: 'Not available on holidays',
  },
  reservations: {
    slotMinutes: 30,
    maxPartyOnline: 10,
    lastSeatingBeforeClose: 60, // minutes
  },
  reviews: [
    { author: 'Neil M.', source: 'Yelp', text: 'One of the best Mediterranean spots in a 100 mile radius. In the last many years, the owner and server has remained the same and I have not had un-delicious food. Top picks — hummus, several helpings of bread, Adana kebab, baklava.' },
    { author: 'Stephy S.', source: 'Yelp', text: 'Still yummy! Spacious eating area. Nice warm bread with lunch. I got the beef and lamb shawarma platter and it was huge and delicious. Friendly service.' },
    { author: 'Leena S.', source: 'Yelp', text: 'The Mediterranean Turkish food at Grill Point was absolutely fantastic. Everything from the falafel appetizer to the chicken shish kebabs with rice was delicious, fresh and piping hot. The portions are very generous.' },
  ],
} as const

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

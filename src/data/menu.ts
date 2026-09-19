import raw from './menu.json'

export interface Dish { id: string; name: string; price: string; prices: string[]; description: string; category: string; tags: string[] }
export interface Category { slug: string; name: string; label: string; image: string; blurb: string; dishes: Dish[] }

/** Editorial mapping over the 10 real categories extracted from the legacy site. */
const META: Record<string, { slug: string; label: string; image: string; blurb: string }> = {
  'Soup & Salads':      { slug: 'salads',   label: 'Soups & Salads',   image: 'cat-salads',  blurb: 'Bright, herb-heavy, dressed with olive oil and lemon.' },
  'Cold Appetizers':    { slug: 'cold',     label: 'Cold Mezze',       image: 'cat-cold',    blurb: 'Hummus, labne, ezme — the table always starts here.' },
  'Hot Appetizers':     { slug: 'hot',      label: 'Hot Mezze',        image: 'cat-hot',     blurb: 'Kibbe, börek and falafel, straight from the fryer.' },
  'Vegetarian Entrees': { slug: 'veg',      label: 'Vegetarian',       image: 'cat-veg',     blurb: 'Stuffed, braised and grilled vegetables as main events.' },
  'Side Orders':        { slug: 'sides',    label: 'Sides & Bread',    image: 'cat-sides',   blurb: 'Bulgur, rice, lemon potatoes and warm Turkish bread.' },
  'Entrees':            { slug: 'grill',    label: 'From the Grill',   image: 'cat-entrees', blurb: 'Kebabs, chops and shawarma over open flame.' },
  'Pita Wraps':         { slug: 'wraps',    label: 'Pita Wraps',       image: 'cat-wraps',   blurb: 'The grill, rolled in warm pita with your toppings.' },
  'Kids Menu':          { slug: 'kids',     label: 'Kids',             image: 'cat-kids',    blurb: 'Smaller plates, same fire.' },
  'Beverages':          { slug: 'drinks',   label: 'Drinks',           image: 'cat-drinks',  blurb: 'Turkish tea and coffee, ayran, gazoz.' },
  'Sweet Corner':       { slug: 'sweets',   label: 'Sweet Corner',     image: 'cat-sweets',  blurb: 'Baklava, künefe and kazandibi.' },
}

const VEG_NAMES = /falafel|hummus|baba|labne|eggplant|ezme|grape leaves|cheese dip|spinach|foul|koshary|okra|stuffed|bulgur|rice|fries|feta|potato|bread|quinoa|chickpea|tabboule|fattoush|house|shepherd|lentil/i
const SEAFOOD = /bronzini|shrimp|salmon/i
const SPICY = /adana|ezme|spicy/i

function tagsFor(cat: string, name: string): string[] {
  const t: string[] = []
  if (cat === 'Vegetarian Entrees' || ((cat.includes('Appetizers') || cat === 'Soup & Salads' || cat === 'Side Orders') && VEG_NAMES.test(name) && !/liver|meat|chicken|wing|kibbe|borek/i.test(name))) t.push('vegetarian')
  if (SEAFOOD.test(name)) t.push('seafood')
  if (SPICY.test(name)) t.push('spicy')
  if (cat === 'Entrees' || cat === 'Pita Wraps') t.push('grill')
  return t
}

export const categories: Category[] = (raw as any[]).map((c) => {
  const m = META[c.category]
  return {
    slug: m.slug, name: c.category, label: m.label, image: m.image, blurb: m.blurb,
    dishes: c.items.map((i: any, n: number) => ({
      id: `${m.slug}-${n}`, name: i.name, price: i.price_raw, prices: i.price_variants?.length ? i.price_variants : [i.price_raw],
      description: i.description, category: c.category, tags: tagsFor(c.category, i.name),
    })),
  }
})

export const allDishes: Dish[] = categories.flatMap((c) => c.dishes)
export const bySlug = (slug: string) => categories.find((c) => c.slug === slug)!
export const findDish = (name: string, cat?: string) => allDishes.find((d) => d.name === name && (!cat || d.category === cat))

/** Order of the pages in the menu book (S08). Sides are folded into the mezze page. */
export const bookPages = ['cold', 'hot', 'salads', 'grill', 'wraps', 'veg', 'kids', 'sweets', 'drinks'].map(bySlug)

/** The three signature dishes staged in S07 — prices come from the extracted menu, never typed by hand. */
export const heroes = [
  { dish: findDish('Adana Kebab', 'Entrees')!, image: 'adana', eyebrow: 'The signature', callouts: ['Hand-minced lamb & beef', 'Our house spice blend', 'Bulgur pilaf, grilled pepper'] },
  { dish: findDish('Chicken Shish Kebab', 'Entrees')!, image: 'chicken-shish', eyebrow: 'From the grill', callouts: ['Chicken breast, marinated overnight', 'Charred on the skewer', 'Rice, salad, warm bread'] },
  { dish: findDish('Chicken Shawarma (Döner)', 'Entrees')!, image: 'shawarma-wrap', eyebrow: 'From the spit', callouts: ['Thin-sliced off the vertical spit', 'Garlic sauce, pickles', 'Platter or wrap'] },
]

export const lunch = {
  step1: ['Lentil soup or soup of the day', 'House salad', 'Hummus', 'Falafel', 'Baba ghanoush', 'Labne', 'Eggplant salad', 'French fries'],
  step2: ['Chicken shish kebab', 'Adana kebab', 'Adana chicken', 'Beef & lamb shawarma', 'Chicken shawarma', 'Falafel'],
  styles: ['Sandwich', 'Platter (with rice)'],
  toppings: ['Lettuce', 'Tomatoes', 'Onions', 'Cucumbers', 'Pickles', 'Parsley', 'Turnip'],
  dressings: ['Tahini', 'Garlic sauce', 'Yogurt sauce', 'Hummus'],
  step3: ['Soda (Pepsi, Diet Pepsi, Sprite, Ginger Ale, Fanta)', 'Poland Spring'],
}

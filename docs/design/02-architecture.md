# Architecture front-end

> Vite 8 · TypeScript 7 (strict) · GSAP 3.15 + ScrollTrigger · Lenis 1.3 · Three.js 0.186.
> Aucun framework UI : le site est une seule page narrative, chaque scène est un module autonome.

## Arborescence

```
index.html                      coquille : loader, #nav, #film, #dock, #rail, #sheet, JSON-LD
src/
  main.ts                       assemble les scènes dans l'ordre, initialise le scroll, injecte le JSON-LD
  styles/
    tokens.css                  design tokens (nuit/papier, feu, rouge conforme AA, typo, easings)
    base.css                    reset, typographie, boutons, .scene/.stage (sticky pin), loader, reduced-motion
    components.css              nav, dock mobile, rail de progression, panneau plat
    scenes.css                  une section par scène S01…S12
  data/
    restaurant.ts               SOURCE UNIQUE : NAP, horaires, liens, formule déjeuner, avis, drapeaux "à confirmer"
    menu.json                   les 93 plats extraits du site existant, jamais ressaisis
    menu.ts                     typage, catégories éditoriales, tags (végétarien/épicé/poisson), pages du livre, plats héros
    images.json                 manifeste des variantes d'images (généré par scripts/build-assets.py)
  utils/
    device.ts                   reduced-motion, tier d'appareil (0/1/2), saveData, videoAllowed()
    media.ts                    picture() responsive AVIF/WebP/JPEG, videoSlot(), clipVideo(), registre des clips
    hours.ts                    "ouvert maintenant", table des horaires, créneaux de réservation
    dom.ts                      el(), qs(), seg(), easings
  animations/
    scroll.ts                   Lenis + ScrollTrigger, bindScene(section, p => …), scrollToEl()
    scrub.ts                    Scrubber : le scroll est la tête de lecture (ImageBitmap → canvas)
    particles.ts                braises + fumée (canvas 2D), densité selon le tier
  components/
    logo.ts nav.ts dock.ts progress.ts dish-sheet.ts
  scenes/
    s01-earth.ts, s02-descent.ts   ouverture : globe WebGL puis descente cartographique
    shot.ts                        fabrique de scène « plan scrubé » (footage + copie + overlay)
    visit.ts                       LA VISITE : 5 plans enchaînés pilotés au scroll
    s07-showcase.ts … s12-book.ts  plats signature, livre, carte, héritage, retour, réservation
scripts/
  build-assets.py               photos réelles → AVIF/WebP/JPEG 480/1024/2048 + recadrages macro + signature détourée
  fetch-map.py                  composites cartographiques z5/8/11/14/16 centrés sur le restaurant
  encode-video.sh               clip → boucle sans raccord → MP4 H.264 + WebM VP9 + posters
public/assets/{img,map,video,earth}
```

## Le mécanisme de continuité

Chaque scène épinglée est une `<section class="scene scene--pin" style="--len:N">` dont la hauteur
vaut `N × 100svh` ; son `.stage` est `position: sticky` et reste à l'écran pendant que la
progression `p` (0 → 1) pilote toutes les transformations via `bindScene()`.

**Règle d'enchaînement** : *l'état visuel final de la scène N est l'état initial de la scène N+1.*
Aucune couche partagée n'est nécessaire, la passation est invisible :

| Frontière | État partagé |
|---|---|
| S01 → S02 | globe flouté et assombri ≈ composite z5 flouté puis net |
| S02 → S03 | écran couvert par le halo jaune du repère = voile `.s03__veil` à 1 |
| S03 → S07 | **la caméra ne coupe pas** : la dernière image de chaque plan est la première du suivant (`end_image`), voir [03-videos.md](03-videos.md) |
| S07 → S08 | l'assiette se réduit **exactement** sur le médaillon de la couverture — position et taille mesurées en direct, relativement à la scène (elle est `sticky`) et depuis le centre propre de l'assiette : vérifié à 0 px près |
| S08 → S09 | le livre s'efface, la carte suit dans le flux normal |
| S10 → S11 | poussière de lumière `.s10__dust` → `.s11__dust` qui s'éteint |

## Données, pas de HTML dupliqué

Le menu (S08 livre, S09 carte, S07 héros, panneau plat, JSON-LD) est rendu depuis `menu.json`.
Changer un prix = un seul fichier. Les horaires, l'adresse, les liens et la formule déjeuner
viennent de `restaurant.ts` ; l'état « ouvert maintenant » est calculé en `America/New_York`.

## Performance

- Images : 3 formats × 3 largeurs, `width/height` toujours renseignés, `loading="lazy"` hors S01–S03.
- Vidéos : ≤ 0,9 Mo, muettes, `playsinline`, chargées à 150 % de la fenêtre avant la scène, poster obligatoire ; sous 720 px ou `saveData` → poster animé (Ken Burns).
- Three.js dans son propre chunk ; pixel ratio plafonné (1,25 en tier 1, 2 en tier 2) ; texture nuit désactivée en tier 0.
- Particules : 80 / 160 / 360 selon le tier.
- `prefers-reduced-motion` : sections dépinglées (`.scene--pin { height:auto }`), aucune particule, globe statique côté New Jersey, livre navigable par onglets sans rotation.

## Ce qui reste volontairement hors périmètre

- **Back-end de réservation** : le formulaire compose un e-mail préformaté (comme l'ancien site, mais avec des créneaux corrects et le lundi bloqué). Un vrai système (OpenTable, Resy, ou un endpoint) se branche dans `s12-book.ts`.
- **Commande intégrée** : la plateforme Clover reste externe ; ses prix (+4 %) sont signalés.
- **Analytics** : aucun script tiers n'est posé — à ajouter avec consentement.

# Grill Point — expérience web cinématique

Site vitrine du restaurant **Grill Point** (Mediterranean Cuisine & Café, 415 Route 9 South,
Marlboro, New Jersey). Page unique, pilotée au défilement : le scroll **est** la tête de lecture
d'une caméra qui part de la Méditerranée, franchit la porte du restaurant, traverse la salle,
arrive au grill, et finit sur l'assiette — puis ouvre la carte et propose de réserver.

Reconstruit à partir d'un audit complet de l'ancien site (conservé hors dépôt).

---

## Démarrer

```bash
npm install
npm run dev          # http://127.0.0.1:5173
```

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | vérification TypeScript + build de production dans `dist/` |
| `npm run preview` | sert le `dist/` construit |
| `npm run assets` | régénère les images responsives depuis les photos d'origine |
| `npm run map` | régénère les fonds cartographiques |

Scripts d'atelier (hors build) :

```bash
scripts/extract-frames.sh <clip.mp4> <ID> [images] [qualité]   # séquence de scroll-scrub
scripts/stabilize.sh <in.mp4> <out.mp4> [lissage] [zoom]        # retire le tremblement caméra
scripts/shake.py <clips...>                                     # mesure le tremblement (numpy)
scripts/shots.mjs 1440 900 <dossier>                            # captures desktop réelles
scripts/check-deploy.mjs <url>                                  # test de déploiement
```

---

## Comment ça marche

### Le scroll est la tête de lecture

Les plans de la visite ne sont pas des `<video>` autonomes. Chaque plan est décomposé en images
WebP, décodées en `ImageBitmap` et peintes sur un `<canvas>` : la position de défilement choisit
l'image. On avance en descendant, on revient en arrière en remontant.

### Une seule scène pour toute la visite

C'est le point structurant. Une scène `sticky` continue de remonter **pendant une pleine hauteur
d'écran** après la fin de son défilement, pendant que la suivante arrive par le bas : deux plans
se retrouvent alors à l'écran en même temps, séparés par une couture horizontale. Les cinq plans
de la visite vivent donc dans **une seule section, un seul canvas, une seule timeline**
(`src/scenes/visit.ts` + `SequencePlayer` dans `src/animations/scrub.ts`).

La continuité vient de `end_image` : **la dernière image d'un plan est la première du suivant.**

```
parking → façade → porte franchie → salle → comptoir → grill → recul → assiette
```

Entre les scènes qui restent distinctes, un fondu piloté sur la **sortie réelle** de la scène
(`bottom bottom` → `bottom top`) masque la jonction, avec un pic en sinus à l'instant exact
de la couture.

### Le contenu vient des données, pas du HTML

`src/data/menu.json` contient les 93 plats extraits de l'ancien site. Le livre de menu, la carte
interactive, les plats signature, le panneau de détail et le JSON-LD sont tous rendus depuis ce
fichier. `src/data/restaurant.ts` est la **source unique** pour l'adresse, le téléphone, les
horaires, les liens et la formule déjeuner.

---

## Structure

```
index.html                  coquille : loader, nav, film, barre CTA, rail, panneau plat, JSON-LD
src/
  main.ts                   assemble les scènes dans l'ordre
  data/                     restaurant.ts · menu.json/ts · sequences.json/ts · images.json
  utils/                    device · media (images responsives) · hours · asset (base de déploiement) · dom
  animations/               scroll (Lenis + ScrollTrigger + fondus) · scrub (SequencePlayer) · particles
  components/               logo · nav · dock mobile · rail de progression · panneau plat
  scenes/                   s01-earth · s02-descent · visit · s07-showcase · s08-book
                            s09-menu · s10-heritage · s11-return · s12-book
public/assets/              img (AVIF/WebP/JPEG ×3 largeurs) · seq (scroll-scrub) · video · map · earth
docs/design/                storyboard · architecture · production vidéo · mise en ligne
```

---

## Performance et accessibilité

- Images en **AVIF + WebP + JPEG**, trois largeurs, `width`/`height` toujours renseignés.
- Séquences de scrub : une seule largeur téléchargée par appareil (1280 px desktop, 720 px mobile),
  chargées **plan par plan** à l'approche. ≈ 5 Mo desktop / 2,5 Mo mobile pour toute la visite.
- Three.js isolé dans son propre chunk (il ne sert que la scène d'ouverture).
- `prefers-reduced-motion` respecté : scènes dépinglées, aucune particule, globe statique.
- Paliers d'appareil (`src/utils/device.ts`) : particules, résolution WebGL et vidéos réduites
  sur machines modestes ou en `saveData`.
- Rouge de marque conforme **WCAG AA** (`#c5161b`, 5,99:1) — l'ancien `#e7272d` échouait à 4,44:1.
- Données structurées `Restaurant` en JSON-LD, absentes de l'ancien site.

---

## À confirmer avec le restaurant avant mise en ligne publique

Ces valeurs viennent de l'ancien site, qui se contredisait. Elles sont marquées dans
`src/data/restaurant.ts`.

| Point | État |
|---|---|
| **Ouverture le dimanche** | l'ancien site donnait trois versions différentes |
| **Prix de la formule déjeuner** | 18 $ sur le site, 19,50 $ sur un flyer de la galerie |
| **Fiche DoorDash** | libellée « englishtown » alors que le restaurant est à Marlboro |
| **Réservation** | le formulaire compose un e-mail ; aucun back-end n'est branché |

La plateforme de commande (Smart Online Order / Clover) applique **+4 %** sur les prix du site —
le site le mentionne explicitement plutôt que de le masquer.

---

## Mise en ligne

Voir **[docs/design/04-mise-en-ligne.md](docs/design/04-mise-en-ligne.md)** pour la procédure
GitHub Pages pas à pas.

En résumé : pousser le dépôt, activer Pages en source « GitHub Actions », et l'URL publique
apparaît. Le build utilise une base relative (`base: './'`), donc il fonctionne aussi bien à la
racine d'un domaine que sous `/<nom-du-depot>/`.

---

## Crédits

Photographies et contenus du restaurant : Grill Point. Fonds cartographiques : Esri, HERE, Garmin,
© OpenStreetMap contributors. Textures de la Terre : projet three.js (MIT). Séquences vidéo
générées avec Higgsfield Cinema Studio à partir des photographies réelles du restaurant.

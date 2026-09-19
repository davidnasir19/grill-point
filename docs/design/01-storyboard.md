# Storyboard — Homepage cinématique Grill Point

> Document de conception validé **avant** le développement. Chaque scène est décrite avec
> son objectif, ses assets, sa plage de défilement, ses transitions et son comportement mobile.
> Les identifiants d'assets (`FOOD_001`, `RESTAURANT_001`…) proviennent de la bibliothèque
> d'assets établie pendant l'audit, conservée hors dépôt.

---

## 0. Le fil conducteur

**Une seule histoire** : *de la Méditerranée à la Route 9, puis de la porte au feu, du feu à l'assiette,
de l'assiette à la carte, et retour dehors pour réserver.*

### La visite est UNE scène, pas cinq

C'est la correction majeure. Les cinq plans de la visite étaient d'abord cinq sections épinglées
distinctes. Une scène `sticky` continue de remonter **pendant une pleine hauteur d'écran** après la
fin de son défilement, tandis que la suivante arrive par le bas : les deux étaient donc à l'écran
en même temps, séparées par une **couture horizontale nette**. C'est ce que montrait
l'enregistrement du client — d'où « ça tremble » et « les vidéos ne sont pas reliées ».

Désormais : **une section épinglée, un canvas, une tête de lecture unique**
([`src/scenes/visit.ts`](../../src/scenes/visit.ts), [`SequencePlayer`](../../src/animations/scrub.ts)).
Les cinq clips s'enchaînent sur la même surface ; la dernière image de l'un étant la première du
suivant (`end_image`), la caméra ne coupe jamais.

### Les jonctions restantes

Entre deux scènes épinglées (Origins → Marlboro → **La visite** → Signatures → La carte), la même
couture existerait. Deux `ScrollTrigger` par scène couvrent exactement la fenêtre de passation et
assombrissent l'image, avec un **pic en sinus à l'instant précis de la couture** : un battement de
paupière, pas un trou noir. Mesuré : **0 image entièrement noire** sur un défilement de 20 poses.

> Piège évité : `progress` atteint 1 une pleine hauteur d'écran **avant** que la scène ne sorte.
> Un fondu piloté par `progress` restait donc noir tout ce temps. Il est piloté par
> `start: 'bottom bottom'` → `end: 'bottom top'`, c'est-à-dire la sortie réelle.

### Le motif de continuité

La **lumière chaude** : lumières de la côte Est vues de l'espace → enseigne allumée → plafonniers
de la salle → braises du grill → doré de l'assiette → cuir rouge de la carte → encre de la
signature → enseigne de nouveau.

```
 S01 TERRE ──▶ S02 DESCENTE ──▶ S03 LA VISITE (une seule scène, cinq plans enchaînés)
                                    │  façade → porte → salle → passe → feu → recul → assiette
                                    ▼
 S08 RÉSERVER ◀── S07 RETOUR ◀── S06 HÉRITAGE ◀── S05 LA CARTE ◀── S04 PLATS & LIVRE
```

**Défilement total** : ≈ 17 écrans en desktop, ≈ 13 en mobile.

---

## Grille de lecture des scènes

| Champ | Signification |
|---|---|
| SCROLL RANGE | Plage en « écrans » depuis le haut de page (desktop / mobile) |
| VIDEO | `VID_xx` = séquence à produire (Higgsfield) ; toujours doublée d'un **poster** de repli |
| CAMERA | Mouvement de caméra simulé (transformations, parallaxe, WebGL) |

---

## S01 — TERRE

| | |
|---|---|
| **OBJECTIF** | Poser l'origine (Méditerranée) et la destination (New Jersey) en un seul mouvement. Créer l'ampleur. |
| **ASSET** | Globe WebGL (Three.js) : texture jour `earth_atmos_2048` + texture nuit `earth_lights_2048` (assets three.js, MIT), halo atmosphérique, champ d'étoiles procédural |
| **VIDEO** | aucune — rendu temps réel |
| **SCROLL RANGE** | 0 → 1,6 écrans (mobile : 0 → 1,2) |
| **ANIMATION** | Le globe démarre **face à la Méditerranée orientale** (Turquie, Liban, Égypte — les origines de la carte). Le scroll le fait tourner vers l'ouest, traverse l'Atlantique ; le terminateur jour/nuit avance : quand la côte Est apparaît, **elle est de nuit, constellée de lumières**. |
| **CAMERA** | Dolly avant continu : distance 3,2 → 1,35 rayons. Légère inclinaison pour amener le New Jersey au centre. |
| **TRANSITION ENTRANTE** | Fondu depuis le noir du chargeur ; le logo (flamme) se réduit en un point de lumière qui devient… une étoile du champ. |
| **TRANSITION SORTANTE** | Les lumières urbaines de la côte Est se **dilatent** ; le globe se fond dans le premier niveau de carte (raccord d'échelle : la courbure disparaît sous un léger flou). |
| **TEXT** | « *From the eastern Mediterranean* » (apparaît sur la Turquie) → « *to a small stretch of Route 9* » (apparaît sur la côte Est) |
| **CTA** | Aucun — moment d'ouverture. Indice de scroll discret (« Scroll to arrive »). |
| **MOBILE** | Globe à 70 % de la largeur, 40 % d'étoiles en moins, pas de texture nuit sur appareils faibles (jour seul teinté). `prefers-reduced-motion` : image fixe du globe côté New Jersey, textes en fondu simple. |

## S02 — DESCENTE

| | |
|---|---|
| **OBJECTIF** | Transformer la géographie en adresse. « Le lieu devient le restaurant. » |
| **ASSET** | 5 composites de tuiles cartographiques (fond sombre CARTO, © OpenStreetMap) centrés sur `40.3316, −74.3065` aux niveaux **z5 → z8 → z11 → z14 → z16**, générés à la construction (`scripts/fetch-map.py`). Repère lumineux SVG. |
| **VIDEO** | aucune |
| **SCROLL RANGE** | 1,6 → 3,2 écrans (mobile : 1,2 → 2,6) |
| **ANIMATION** | Zoom continu : chaque composite s'agrandit (×1 → ×8) pendant que le suivant apparaît en fondu à l'échelle correspondante — un **zoom infini** sans saut. Le nom « New Jersey », puis « Marlboro », puis « 415 Route 9 South » se posent comme des étiquettes de carte. Au dernier niveau, un **repère rouge `#c5161b`** pulse sur la parcelle. |
| **CAMERA** | Piqué vertical (top-down), vitesse décroissante (ease-out) pour « atterrir ». |
| **TRANSITION ENTRANTE** | Le globe flou devient le composite z5 (même teinte nuit, mêmes lumières). |
| **TRANSITION SORTANTE** | **Transition lumière** : le halo du repère s'étend jusqu'à couvrir l'écran d'un orange-jaune (la couleur exacte de l'enseigne) ; dans ce halo apparaît la façade. |
| **TEXT** | « Marlboro, New Jersey » · « 415 Route 9 South » · (petit) « Attribution © OpenStreetMap contributors © CARTO » |
| **CTA** | « Get directions » apparaît en filigrane au niveau z14, cliquable sans quitter la scène (ouvre Google Maps dans un nouvel onglet). |
| **MOBILE** | Mêmes composites (recadrés en portrait), 4 niveaux au lieu de 5 (z5, z9, z13, z16). |

## S03 — ARRIVÉE

| | |
|---|---|
| **OBJECTIF** | Premier contact avec le vrai lieu. Ancrer la marque et donner l'heure. |
| **ASSET** | `RESTAURANT_001` — façade de nuit, enseigne allumée (626×736, agrandie à 1400 avec netteté préservée puis grain léger pour masquer la définition). |
| **VIDEO** | **`VID_01_ARRIVAL`** — image-vers-vidéo depuis `RESTAURANT_001` : lent travelling avant vers la porte, léger scintillement de l'enseigne, phares d'une voiture qui balaient le parking. 5 s, muet, bouclable. Poster = la photo. |
| **SCROLL RANGE** | 3,2 → 4,4 écrans (mobile : 2,6 → 3,6) |
| **ANIMATION** | La photo naît du halo (luminosité 3 → 1, flou 24 px → 0). Travelling avant continu vers la porte (échelle 1,0 → 1,28, point de fuite sur la porte). Le wordmark « Grill Point » se compose lettre à lettre **dans la même couleur que l'enseigne**. |
| **CAMERA** | Push-in lent, centré sur l'entrée. |
| **TRANSITION ENTRANTE** | Halo lumineux (voir S02). |
| **TRANSITION SORTANTE** | **Masque** : le rectangle lumineux de la porte vitrée devient un `clip-path` qui s'ouvre (inset 42 %/38 % → 0) et révèle la salle — **on entre**. |
| **TEXT** | « Grill Point » · « Mediterranean Cuisine & Café » · état calculé : « Open now · until 9 PM » ou « Opens Tuesday at noon » |
| **CTA** | La **barre de conversion** apparaît ici pour la première fois et reste ensuite : *Order online · Book a table · Call · Directions* (desktop : en haut à droite ; mobile : barre basse). |
| **MOBILE** | Recadrage sur la porte et l'enseigne (image en `object-position: 60% 50%`). Vidéo désactivée sous 720 px ou en connexion lente (`saveData`) → poster. |

## S04 — EN SALLE

| | |
|---|---|
| **OBJECTIF** | Donner la sensation d'être assis. Chaleur, calme, pain chaud. |
| **ASSET** | `INTERIOR_002` (`lunch/12.jpg`, 1000×750) puis `INTERIOR_001` (`about3.jpg`, 1000×538). Étalonnage commun : +8 % de chaleur, vignette douce. |
| **VIDEO** | **`VID_02_INSIDE`** — image-vers-vidéo depuis `INTERIOR_002` : lent travelling latéral dans la salle vide, lumière stable. 5 s. Poster = la photo. |
| **SCROLL RANGE** | 4,4 → 5,8 écrans (mobile : 3,6 → 4,6) |
| **ANIMATION** | Trois plans de profondeur : (1) cadre de porte flou au premier plan qui s'écarte, (2) la salle qui glisse de gauche à droite (parallaxe 1×), (3) le fond (comptoir) plus lent (0,6×). Fondu enchaîné `INTERIOR_002 → INTERIOR_001` au tiers de la scène, **sur un même mouvement** de caméra pour que les deux photos semblent une seule prise. |
| **CAMERA** | Travelling latéral gauche → droite, puis dérive vers le passe de cuisine. |
| **TRANSITION ENTRANTE** | Masque-porte (S03). |
| **TRANSITION SORTANTE** | La caméra dérive vers le comptoir ; les bords se réchauffent (orange), une **distorsion de chaleur** (shader/filtre) apparaît, des braises traversent l'écran de bas en haut — nous passons derrière le comptoir. |
| **TEXT** | « Come in. Sit down. » · « *The bread arrives warm.* » (tiré d'un avis client réel) |
| **CTA** | « Book a table » mis en évidence dans la barre (état actif). |
| **MOBILE** | Un seul plan de parallaxe, fondu simple entre les deux photos. |

## S05 — LE FEU

| | |
|---|---|
| **OBJECTIF** | Le cœur de la marque. Le nom, le logo et la carte reposent sur le grill — le montrer enfin. |
| **ASSET** | **Aucune photo n'existe** (aucun asset de grill n'existait). Scène **procédurale** : canvas de braises, fumée volumétrique légère, halo orange ; le logo-flamme en filigrane s'aligne sur les flammes. |
| **VIDEO** | **`VID_03_GRILL`** — texte-vers-vidéo : gros plan de brochettes Adana sur charbon, flammes qui lèchent la viande, braises qui s'élèvent, fond noir, ralenti. 5 s, muet. **Poster = image fixe extraite** de la vidéo. Sans vidéo, la scène procédurale suffit. |
| **SCROLL RANGE** | 5,8 → 7,2 écrans (mobile : 4,6 → 5,6) |
| **ANIMATION** | Les braises s'intensifient avec le scroll (densité 0,3 → 1). Le titre « Everything begins over the fire » se révèle par un **masque de chaleur** (texte qui ondule légèrement puis se stabilise). Les trois mots-clés « Open flame · Secret spices · Twenty years » se posent sur des braises qui montent. |
| **CAMERA** | Immobile, très légère respiration (échelle ±1,5 %). |
| **TRANSITION ENTRANTE** | Distorsion de chaleur + braises (S04). |
| **TRANSITION SORTANTE** | **Raccord couleur** : l'orange des braises se concentre au centre et devient l'orange-brun du kebab Adana ; la fumée se transforme en **vapeur** au-dessus de l'assiette. |
| **TEXT** | « Everything begins over the fire. » · « Open flame · Secret spices · Twenty years » |
| **CTA** | Aucun (moment d'émotion). |
| **MOBILE** | 120 particules au lieu de 400, pas de fumée volumétrique, halo statique. Reduced-motion : image fixe braise + texte. |

## S06 — DU FEU À L'ASSIETTE

| | |
|---|---|
| **OBJECTIF** | Raconter la préparation en continu : épices → braise → dressage → plat. |
| **ASSET** | Recadrages macro des vraies photos pour servir de « plans de détail » : bulgur (`FOOD_001` crop), poivron grillé (`FOOD_003` crop), viande (`FOOD_004` crop), riz (`FOOD_009` crop). Plan final : `FOOD_001` entier. |
| **VIDEO** | **`VID_04_PLATING`** — image-vers-vidéo depuis `FOOD_001` : vapeur qui s'élève, très lente rotation de l'assiette (5°), lumière rasante. 5 s. Poster = la photo. |
| **SCROLL RANGE** | 7,2 → 9,0 écrans (mobile : 5,6 → 7,0) |
| **ANIMATION** | **Ruban horizontal** : une bande de 5 étapes (Season · Skewer · Grill · Rest · Plate) défile latéralement avec le scroll (desktop). Chaque étape = un plan macro qui **s'agrandit depuis le précédent** (zoom continu, jamais de coupe). Le dernier zoom arrière révèle l'assiette complète. |
| **CAMERA** | Travelling latéral (desktop) / vertical (mobile), puis zoom arrière pour révéler. |
| **TRANSITION ENTRANTE** | Raccord couleur braise → viande (S05). |
| **TRANSITION SORTANTE** | L'assiette termine centrée, à 60 % de l'écran — elle **est déjà** le premier plat héros de S07 (aucune coupe). |
| **TEXT** | Étapes : « Seasoned by hand » · « Skewered » · « Over the coals » · « Rested » · « Plated » |
| **CTA** | Aucun. |
| **MOBILE** | Ruban vertical (défilement naturel), zooms conservés, vidéo → poster sous 720 px. |

## S07 — PLATS HÉROS

| | |
|---|---|
| **OBJECTIF** | Faire désirer trois plats signature et donner un prix et un bouton à chacun. |
| **ASSET** | `FOOD_001` Adana Kebab (24 $) · `FOOD_003` Chicken Shish Kebab (23 $) · `FOOD_005` Chicken Shawarma (22 $). *(`FOOD_004` Mixed Grill écarté : libellés manuscrits sur l'assiette.)* Prix : `menu.json`. |
| **VIDEO** | aucune |
| **SCROLL RANGE** | 9,0 → 11,0 écrans (mobile : 7,0 → 8,6) |
| **ANIMATION** | Chaque plat occupe ~0,66 écran de scroll : l'assiette (masquée en cercle) entre par la droite en tournant de 12°, se stabilise au centre ; **trois repères** apparaissent autour (ingrédients tirés de la description réelle), puis le nom, le prix et le bouton. Au scroll suivant, elle sort par la gauche pendant que la suivante entre — **plateau tournant**. |
| **CAMERA** | Légère orbite (rotation 12° → 0 → −12°) + échelle 0,9 → 1 → 0,9. |
| **TRANSITION ENTRANTE** | Continuité directe depuis S06 (même assiette). |
| **TRANSITION SORTANTE** | La dernière assiette **rétrécit et se pose** sur un rectangle rouge sombre qui monte du bas : c'est la **couverture de la carte** — l'assiette devient son médaillon. |
| **TEXT** | Nom du plat · description réelle · prix · « From the grill » |
| **CTA** | « Order this dish » (vers la commande en ligne) · « See full menu » (saut vers S09) |
| **MOBILE** | Cartes à balayage horizontal (swipe) avec points de navigation ; le scroll vertical fait avancer aussi. |

## S08 — LE LIVRE

| | |
|---|---|
| **OBJECTIF** | Feuilleter la carte comme un objet physique — et rester **intuitif**. |
| **ASSET** | Couverture : cuir rouge sombre `#3a0d0f` avec le logo **embossé** (SVG). Pages : papier crème `#f4ecdf`, texture grain fine (CSS). Contenu : `menu.json`, 3 à 4 plats vedettes par catégorie. |
| **VIDEO** | aucune |
| **SCROLL RANGE** | 11,0 → 13,0 écrans (mobile : 8,6 → 10,0) |
| **ANIMATION** | Livre fermé (perspective CSS 3D). Le scroll **ouvre la couverture** (rotateY 0 → −180°, ombre portée mobile). Puis chaque cran de scroll **tourne une page** (rotateY sur l'axe de la reliure, courbure simulée par un dégradé mobile). Ordre des pages : *Starters · Salads · From the Grill · Shawarma & Wraps · Vegetarian · Kids · Sweet Corner · Drinks*. |
| **CAMERA** | Vue légèrement plongeante (rotateX 8°), immobile ; le livre respire à l'ouverture. |
| **TRANSITION ENTRANTE** | L'assiette se pose sur la couverture (S07). |
| **TRANSITION SORTANTE** | La dernière page tournée, le livre **s'aplatit et s'agrandit** ; ses pages se détachent et se réorganisent en **grille de cartes** — la carte interactive (S09) naît du livre. |
| **TEXT** | Sur chaque page : nom de catégorie, 3–4 plats (nom, prix), « See all 16 dishes → » |
| **CTA** | **Toujours visibles** : onglets de catégories (cliquables, clavier ← →), « Skip to full menu ». Un libellé permanent indique « Page 3 / 8 — From the Grill ». |
| **MOBILE** | Livre en portrait, une page à la fois, **balayage horizontal** pour tourner ; les onglets deviennent une barre défilante. Reduced-motion : pages empilées sans rotation. |

## S09 — CARTE INTERACTIVE *(section utilisable, non épinglée)*

| | |
|---|---|
| **OBJECTIF** | L'usage réel : trouver un plat, lire, comparer, commander. Le spectaculaire ne gêne jamais. |
| **ASSET** | `menu.json` (93 plats) · visuels de catégorie `FOOD_006-013`, `DESSERT_001`, `DRINK_001` en repli (aucune photo par plat n'existe) · configurateur **Lunch Special** (18 $, 3 étapes). |
| **VIDEO** | aucune |
| **SCROLL RANGE** | 13,0 → ~15 écrans (hauteur naturelle) |
| **ANIMATION** | Apparition des cartes en cascade légère (40 ms), états `hover` (élévation, zoom photo 1,04), ouverture d'un **panneau de détail** (glissement latéral desktop, feuille basse mobile). |
| **CAMERA** | Aucune — interface. |
| **TRANSITION ENTRANTE** | Les pages du livre deviennent les premières cartes (S08). |
| **TRANSITION SORTANTE** | Fondu vers le fond sombre de S10. |
| **TEXT** | Filtres : *All · Starters · Salads · From the Grill · Wraps · Vegetarian · Kids · Sweet Corner · Drinks* ; bascules : *Vegetarian · Seafood · Two sizes*. Note visible : « Online ordering prices may differ slightly. » |
| **CTA** | Par carte : « Order » ; panneau : « Order online », « Book a table » ; bloc Lunch Special : « Build your lunch » → configurateur 3 étapes → « Order at the counter · Tue–Fri 12–3 PM » *(la formule n'est pas commandable en ligne — fait vérifié)*. |
| **MOBILE** | Filtres en barre horizontale défilante, cartes en 1 colonne, feuille de détail plein écran. |

## S10 — HÉRITAGE

| | |
|---|---|
| **OBJECTIF** | Rendre crédibles « 20 ans » et « de génération en génération » avec le seul élément humain existant : la signature. |
| **ASSET** | `BRAND_003` signature « Hoda » (détourée) · `DESSERT_001` baklava · `DRINK_001` thé · les **3 avis réels** (Stephy S., Neil M., Leena S.). |
| **VIDEO** | aucune |
| **SCROLL RANGE** | ~15 → 16,4 écrans (mobile : 10,0 → 11,2) |
| **ANIMATION** | Fond nuit chaude. La signature **s'écrit** (masque de révélation gauche → droite, 1,2 s lié au scroll). La citation de Neil M. — « *In the last many years, the owner and server has remained the same* » — se compose en grand. Les trois mots « Mediterranean · Turkish · Halal » se posent sur une ligne dorée. Baklava et thé dérivent en parallaxe douce. |
| **CAMERA** | Immobile ; légère dérive des objets. |
| **TRANSITION ENTRANTE** | Fondu depuis la carte. |
| **TRANSITION SORTANTE** | L'encre de la signature **se dissout** en particules qui deviennent… les lumières lointaines de la nuit — la façade réapparaît. |
| **TEXT** | « Twenty years. The same hands. » · citation · « Recipes passed from generation to generation » |
| **CTA** | Aucun. |
| **MOBILE** | Signature à 80 % de la largeur, citation en 3 lignes, avis en carrousel à balayage. |

## S11 — RETOUR DEHORS

| | |
|---|---|
| **OBJECTIF** | Fermer la boucle : on ressort, on sait où c'est, quand, et comment venir. |
| **ASSET** | `RESTAURANT_001` (même façade qu'à l'arrivée — **symétrie**) · composite carte z15 avec repère · données `restaurant.ts` (horaires **source unique**). |
| **VIDEO** | `VID_01_ARRIVAL` réutilisé (lecture inversée si possible, sinon poster). |
| **SCROLL RANGE** | 16,4 → 17,2 écrans (mobile : 11,2 → 12,0) |
| **ANIMATION** | La façade émerge des particules ; cette fois la caméra **recule** (échelle 1,2 → 1,0). Un panneau d'informations glisse depuis la droite : horaires du jour en évidence, adresse, téléphone, carte. |
| **CAMERA** | Pull-back lent. |
| **TRANSITION ENTRANTE** | Particules d'encre → lumières (S10). |
| **TRANSITION SORTANTE** | Le panneau s'étend pour devenir la section réservation. |
| **TEXT** | « We're right here on Route 9. » · horaires · adresse · téléphone |
| **CTA** | « Get directions » · « Call » · « Order online » |
| **MOBILE** | Panneau en bas, façade en fond ; carte statique cliquable. |

## S12 — RÉSERVER / COMMANDER *(section utilisable)*

| | |
|---|---|
| **OBJECTIF** | Convertir. |
| **ASSET** | Formulaire (créneaux **corrects** : 12:00 → fermeture par pas de 30 min, **18:30 et 19:00 présents**, lundi bloqué, date native) · lien commande · téléphone · pied de page (Facebook, **Instagram**, Yelp, DoorDash). |
| **VIDEO** | aucune |
| **SCROLL RANGE** | 17,2 → fin |
| **ANIMATION** | Aucune au-delà des états de formulaire. |
| **TEXT** | « Book a table » · « Order online » · « Groups & private events » |
| **CTA** | « Book » (compose la demande — le site actuel n'a pas de back-end : envoi par e-mail préformaté, clairement indiqué) · « Order online » · « Call ». |
| **MOBILE** | Champs pleine largeur, sélecteur de date natif, barre CTA masquée quand le formulaire est visible. |

---

## Éléments persistants

| Élément | Comportement |
|---|---|
| **Navigation** | Logo (SVG) + *Menu · Reserve · Order*. Transparente sur S01–S05, fond nuit à partir de S06. |
| **Barre de conversion** | Apparaît à S03. Desktop : groupe compact en haut à droite. Mobile : barre basse 4 boutons (*Order · Book · Call · Directions*). Masquée quand le formulaire S12 est visible. |
| **Indicateur de progression** | Ligne verticale discrète à droite (desktop) avec les 12 scènes ; cliquable. |
| **Curseur** | Standard (pas de curseur personnalisé — accessibilité). |

## Politique média et performance

| Règle | Application |
|---|---|
| Images | AVIF + WebP + JPEG, largeurs 480 / 1024 / 2048, `width`/`height` renseignés, `loading="lazy"` hors S01–S03 |
| Vidéos | ≤ 6 s, muettes, `playsinline`, WebM (AV1/VP9) + MP4 (H.264), ≤ 1,5 Mo chacune, poster obligatoire, chargement différé à l'approche de la scène |
| Repli | Vidéo indisponible ou `saveData` ou < 720 px → poster animé (Ken Burns léger) |
| Mouvement | `prefers-reduced-motion` → scènes dépinglées, fondus simples, globe statique, aucune particule |
| Appareils faibles | `navigator.hardwareConcurrency ≤ 4` ou `deviceMemory ≤ 4` → particules ÷ 3, WebGL basse résolution, pas de texture nuit |
| Chargement | Préchargement : texture Terre + façade uniquement. Tout le reste à la demande, 1,5 écran avant la scène. |

## Vidéos à produire (Higgsfield) — par ordre de valeur narrative

| ID | Scène | Source | Type | Durée | Rôle de pont |
|---|---|---|---|---|---|
| `VID_03_GRILL` | S05 | — (aucun asset) | texte → vidéo | 5 s | **Le seul contenu impossible à simuler par photo.** Pont S04 → S06 |
| `VID_01_ARRIVAL` | S03 / S11 | `RESTAURANT_001` | image → vidéo | 5 s | Réutilisé deux fois (arrivée et retour) |
| `VID_04_PLATING` | S06 | `FOOD_001` | image → vidéo | 5 s | Vapeur = pont fumée → assiette |
| `VID_02_INSIDE` | S04 | `INTERIOR_002` | image → vidéo | 5 s | Travelling en salle |

**Contrainte** : 218 crédits disponibles. Chaque génération est **préflightée** (coût affiché avant
soumission). Priorité stricte à `VID_03_GRILL`, puis `VID_01_ARRIVAL`. Les scènes fonctionnent
intégralement **sans** vidéo grâce aux posters et à la scène procédurale.

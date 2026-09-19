# Vidéo pilotée par le scroll — production et montage

## Le principe : le scroll est la tête de lecture

Les plans de la visite ne sont **pas** des `<video>` qui se lancent toutes seules. Chaque plan est
décomposé en images fixes, décodées en `ImageBitmap` et peintes sur un `<canvas>` : la position de
défilement choisit l'image. On avance dans le plan en descendant, on revient en arrière en remontant.
Moteur : [`src/animations/scrub.ts`](../../src/animations/scrub.ts), mise en scène :
[`src/scenes/shot.ts`](../../src/scenes/shot.ts).

## La chaîne continue

Le maillon décisif est `end_image` : la dernière image d'un plan **est** la première du suivant.
La caméra ne coupe jamais entre le parking et l'assiette.

```
entrance.jpg ──VID_A_ENTER──▶ lunch/12.jpg ──VID_02_INSIDE──▶ about3.jpg
                                                                   │
                                                             VID_C_TOFIRE
                                                                   ▼
assiette Adana ◀──VID_D_PLATE── dernière image du grill ◀──VID_03_GRILL── première image du grill
```

| ID | Scène | Départ → Arrivée | Images | Poids (1280 + 720) |
|---|---|---|---|---|
| `VID_A_ENTER` | Arrival | façade de nuit → salle | 48 | 2 233 Ko |
| `VID_02_INSIDE` | The room | salle → comptoir | 40 | 2 464 Ko |
| `VID_C_TOFIRE` | To the fire | salle → grill incandescent | 44 | 2 702 Ko |
| `VID_03_GRILL` | The fire | brochettes sur la braise | 48 | 1 231 Ko |
| `VID_D_PLATE` | The plate | braises → assiette dressée | 44 | 752 Ko |

Une seule largeur est téléchargée par appareil (1280 px en desktop, 720 px en mobile) : ~5 Mo sur
l'ensemble de la visite en desktop, ~2,5 Mo en mobile, chargés **scène par scène** à l'approche.

## Ce que le plan gratuit autorise réellement

| Modèle | 5 s | Verdict |
|---|---|---|
| **Seedance 2.5** | 15 crédits (480p) · 32,5 (720p) | ⛔ **`Requires plus plan or higher`** à toutes les résolutions — inutilisable malgré le devis affiché |
| Kling v3.0 | 6,25 | ⛔ `Requires basic plan or higher` |
| Grok Video 1.5 | 22,5 | ⛔ `Requires basic plan or higher` |
| **Cinema Studio `std`** | 5 | ✅ |
| **Cinema Studio `pro`** | **7,5** | ✅ **retenu** — accepte `start_image` **et** `end_image` |

`get_cost` renvoie un tarif pour Seedance, mais la génération est refusée : seul un appel réel
révèle le blocage. **Un seul job simultané.**

### Dépense

| Étape | Clips | Crédits |
|---|---|---|
| Première série (Cinema Studio `std`) | 4 | 20 |
| Chaîne de la visite (`pro`) | 3 réussis + 1 échec non facturé | 22,5 |
| **Total** | | **~42,5** sur 218 |

Le clip feu → assiette a échoué au premier essai avec deux images de référence trop dissemblables
(braises sombres → assiette claire) ; relancé avec la seule image de départ, il a abouti.

## Stabilisation — `scripts/stabilize.sh`

Les modèles génératifs produisent une caméra qui flotte. Mesuré par corrélation de phase
(`scripts/shake.py` : déplacement entre images consécutives, puis variation de ce déplacement) :

| Plan | Secousse avant | Après stabilisation | Verdict |
|---|---|---|---|
| `VID_02_INSIDE` (la salle) | **1,79** (pic 4,5) | **0,39** (pic 1,4) | ✅ −78 % |
| `VID_A_ENTER` (l'entrée) | 0,95 (pic 9,4) | 1,02 (pic **8,1**) | ✅ pic réduit |

Sur le plan de la salle, la secousse (1,79) était presque aussi forte que le mouvement voulu
(1,89 px/image) : d'où l'impression de tremblement. Deux passes `vidstab` avec un lissage de 40
images retirent l'oscillation en conservant le travelling. **Coût : zéro crédit.**

> Les valeurs élevées mesurées sur `VID_03_GRILL` et `VID_D_PLATE` ne sont **pas** de la secousse
> caméra mais le mouvement des flammes, que la corrélation de phase interprète comme un
> déplacement. Ces deux plans ne sont pas stabilisés — cela déformerait le feu.

## Post-production — `scripts/extract-frames.sh`

1. Recadrage 16:9 si le modèle a suivi le format portrait de la photo source
   (`VID_A_ENTER` est sorti en 1328×1560 : bande 1328×747 conservant l'enseigne et la porte).
2. Extraction en WebP à deux largeurs, **nombre d'images et qualité réglés selon le mouvement réel** :
   48 images pour la marche d'entrée et les flammes, 40 pour le travelling en salle, 26 pour un plan
   fixe. Un plan quasi immobile en 48 images pesait 99 Ko/image pour rien.
3. `scripts/seq-manifest.py` écrit `src/data/sequences.json`, lu par le code — aucun nombre codé en dur.

`scripts/encode-video.sh` reste utilisé pour les deux plans encore lus en `<video>` (S11 retour),
avec boucle sans raccord et posters.

## Prompts

**VID_A_ENTER** — *One continuous steadicam shot, no cuts, moving forward the entire time. Begin outside at night facing the illuminated storefront, glide forward toward the glass entrance door, the doorway grows and fills the frame, we pass through it, and we arrive inside the warm softly lit dining room with wooden chairs, set tables and a tiled floor.*

**VID_C_TOFIRE** — *One continuous steadicam shot, no cuts, moving forward. Start inside the warm dining room, glide past the tables toward the back of the room, and arrive at the kitchen pass where a charcoal grill glows. The light shifts from soft warm lamps to deep orange firelight.*

**VID_D_PLATE** — *One continuous shot. Start tight on glowing charcoal embers and small orange flames. The camera lifts and pulls back through thin rising smoke; the fire falls away below and out of frame, and a finished plated kebab comes into view from above.*

## Ce qui reste à tourner sur place

Broche de shawarma en rotation · pain sortant du four · mains qui assaisonnent · künefe filant ·
visages de l'équipe. Aucune génération ne remplacera les vraies personnes du restaurant.

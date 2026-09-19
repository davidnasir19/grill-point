# Mettre le site en ligne gratuitement sur GitHub Pages

Objectif : obtenir une **URL publique** du type
`https://VOTRE-NOM.github.io/grill-point/` à envoyer à une entreprise.

C'est gratuit et sans carte bancaire. Comptez **10 à 15 minutes**.

> **Un point à savoir d'emblée** : sur un compte GitHub gratuit, GitHub Pages ne fonctionne que
> si le dépôt est **public**. N'importe qui pourra donc lire le code et les photos. Si le dépôt
> doit rester privé, il faut un abonnement GitHub Pro — ou un autre hébergeur
> (voir « Si vous préférez autre chose » à la fin).

---

## Étape 1 — Créer un compte GitHub

Si vous en avez déjà un, passez à l'étape 2.

1. Ouvrez **https://github.com/signup**
2. Renseignez e-mail, mot de passe, nom d'utilisateur.
   👉 **Ce nom d'utilisateur apparaîtra dans l'URL publique.** Choisissez-le en conséquence
   (`grillpointnj` donnerait `https://grillpointnj.github.io/…`).
3. Validez le code reçu par e-mail.

---

## Étape 2 — Créer le dépôt

1. Allez sur **https://github.com/new**
2. Remplissez :
   - **Repository name** : `grill-point`
     *(ce nom devient la fin de l'URL — évitez espaces et majuscules)*
   - **Description** *(facultatif)* : `Grill Point — expérience web cinématique`
   - Cochez **Public** ← indispensable pour Pages en gratuit
   - **Ne cochez rien d'autre.** Surtout pas « Add a README file », ni `.gitignore`, ni licence :
     le projet en contient déjà, et cela créerait un conflit au premier envoi.
3. Cliquez **Create repository**.

GitHub affiche alors une page « …or push an existing repository from the command line ».
Gardez-la ouverte, l'étape suivante en reprend l'adresse.

---

## Étape 3 — Envoyer les fichiers

Ouvrez le **Terminal** (Applications → Utilitaires → Terminal) et collez ces commandes **une par
une**. Remplacez `VOTRE-NOM` par votre nom d'utilisateur GitHub.

```bash
cd /Users/loucoufamille/orca/workspaces/APP/App
```

```bash
git remote add origin https://github.com/VOTRE-NOM/grill-point.git
```

```bash
git push -u origin public-site:main
```

**À propos de cette dernière commande** : le projet possède une branche `public-site` qui contient
exactement le site, **sans l'audit de l'ancien site** (conservé chez vous dans `docs/audit/`) et
**sans historique** — rien d'autre que le site ne part donc sur GitHub. `public-site:main` l'envoie
sous le nom `main`, la branche principale attendue par GitHub.

GitHub demandera vos identifiants :
- **Username** : votre nom d'utilisateur GitHub
- **Password** : ⚠️ **pas votre mot de passe** — GitHub exige un *jeton d'accès*.
  Créez-le sur **https://github.com/settings/tokens/new** :
  cochez la case **`repo`**, choisissez une expiration, cliquez **Generate token**,
  puis **copiez-le immédiatement** (il ne sera plus jamais affiché) et collez-le comme mot de passe.

L'envoi transfère environ **40 Mo** (les photos et les séquences vidéo) : comptez une à trois
minutes selon votre connexion.

---

## Étape 4 — Activer GitHub Pages

1. Sur votre dépôt : **Settings** (onglet en haut à droite)
2. Menu de gauche → **Pages**
3. Sous **Build and deployment → Source**, choisissez **GitHub Actions**
   *(surtout pas « Deploy from a branch » : le site doit être construit avant d'être publié)*
4. C'est tout — il n'y a rien à valider, le choix est enregistré automatiquement.

---

## Étape 5 — Attendre la construction et récupérer l'URL

1. Onglet **Actions** de votre dépôt.
2. Une exécution **« Deploy to GitHub Pages »** est en cours (point orange).
   Elle dure **2 à 4 minutes** : elle installe les dépendances, construit le site, le publie.
3. Quand la pastille passe au **vert ✅**, retournez dans **Settings → Pages**.
4. L'URL publique s'affiche en haut :

```
https://VOTRE-NOM.github.io/grill-point/
```

👉 **C'est le lien à envoyer à l'entreprise.** Ouvrez-le d'abord vous-même pour vérifier.

> La toute première publication peut mettre **jusqu'à 10 minutes** à devenir accessible, même
> une fois l'action au vert. Si vous voyez une page 404, attendez et rechargez.

---

## Mettre le site à jour plus tard

Travaillez normalement sur votre branche habituelle, validez vos modifications, puis régénérez et
republiez la branche publique :

```bash
git add -A && git commit -m "Mise à jour du site"
```

```bash
scripts/prepare-public.sh
```

```bash
git push -f origin public-site:main
```

Le `-f` est normal ici : `public-site` est un **instantané** du site, régénéré à chaque publication,
pas une branche de travail. GitHub reconstruit et republie automatiquement en 2 à 4 minutes.

---

## Si quelque chose ne marche pas

| Symptôme | Cause la plus probable | Solution |
|---|---|---|
| Page **404** après le vert | délai de première publication | attendre 10 min et recharger |
| **Le site s'affiche sans style** (texte brut) | source réglée sur « Deploy from a branch » | Settings → Pages → Source → **GitHub Actions** |
| Action **rouge ❌** | voir le détail dans l'onglet Actions | cliquez sur l'exécution, dépliez l'étape en rouge |
| `remote origin already exists` | remote déjà ajouté | `git remote set-url origin https://github.com/VOTRE-NOM/grill-point.git` |
| `Authentication failed` | mot de passe utilisé au lieu du jeton | recréez un jeton (étape 3) |
| `Updates were rejected` | le dépôt n'était pas vide | vous aviez coché « Add a README » — recréez le dépôt sans rien cocher |
| `src refspec public-site does not match` | branche absente | lancez `scripts/prepare-public.sh` puis relancez le push |
| **Onglet Pages absent** | dépôt privé sur compte gratuit | Settings → General → bas de page → **Change visibility → Public** |

---

## Pourquoi le site fonctionne sous `/grill-point/`

Un site GitHub Pages de projet ne vit pas à la racine du domaine mais sous `/<nom-du-depot>/`.
Tout chemin écrit `/assets/...` y renvoie donc une **erreur 404**.

Le projet est configuré pour l'éviter :
- `vite.config.ts` utilise `base: './'` — tous les chemins produits sont **relatifs** ;
- les URL construites pendant l'exécution passent par `src/utils/asset.ts`, qui applique
  la base de déploiement.

Le même build fonctionne donc **à la racine d'un domaine comme sous un sous-chemin**, sans
connaître le nom du dépôt. Vérifié en servant `dist/` sous `/grill-point/` : **zéro requête en
erreur** sur l'ensemble du parcours (`scripts/check-deploy.mjs`).

---

## Utiliser un nom de domaine personnalisé *(facultatif)*

Si le restaurant possède déjà un domaine (par exemple `grillpointnj.com`) :

1. **Settings → Pages → Custom domain** : saisissez le domaine, **Save**.
2. Chez le fournisseur du domaine, créez un enregistrement **CNAME** pointant vers
   `VOTRE-NOM.github.io`.
3. Revenez sur la page Pages et cochez **Enforce HTTPS** dès que l'option devient disponible
   (le certificat met jusqu'à 24 h à être émis).

---

## Si vous préférez autre chose

| Hébergeur | Intérêt | Limite |
|---|---|---|
| **GitHub Pages** | gratuit, intégré au dépôt | dépôt public obligatoire en gratuit |
| **Netlify** | glisser-déposer du dossier `dist/`, dépôt privé possible | 100 Go/mois |
| **Cloudflare Pages** | très rapide, dépôt privé possible | — |
| **Vercel** | déploiement automatique depuis GitHub | — |

Pour Netlify sans ligne de commande : lancez `npm run build`, puis déposez le dossier `dist/`
sur **https://app.netlify.com/drop**. Vous obtenez une URL en quelques secondes.

# Ura

Traqueur d'eau personnel avec récompenses façon Pokémon TCG Pocket (une carte tous les
0,5 L, un booster à 1,5 L, collection type Pokédex). « Ura » = eau en basque.

## Statut : projet personnel d'Iban, pas Miatu

Malgré son emplacement dans `Proiektuak\`, ce projet est **personnel**. Aucune ressource de
Miatu (serveurs, outils, organisation GitHub) n'est utilisée et aucun document Miatu ne le
cite. Dépôt git à la racine de ce dossier, publié sur le compte personnel GitHub
`Ibanokod/ura` (dépôt public : code seulement) et servi par GitHub Pages. Les données de
l'utilisateur (consommation, collection) vivent dans le navigateur, **jamais dans le dépôt**.

## Sources de vérité

- `PRODUCT.md` : cadrage produit (écrans, règles de récompense, tables de tirage, modèle de
  données, hors périmètre).
- `DESIGN.md` : charte visuelle. À lire avant tout travail d'interface, ne jamais inventer.
- Plan initial du 21/09/2026 : `~\.claude\plans\projet-perso-rien-dans-lively-cupcake.md`.

## Stack

Vite + React 19 + TypeScript. CSS pur : variables dans `src/styles/tokens.css` (issues du
DESIGN.md) et un fichier `.module.css` par composant. État : `useReducer` + Context React,
persisté dans localStorage sous la clé `ura.v1` (champ `version` pour les migrations).
Tests : Vitest, sur la logique pure de `src/lib/`. Cartes : API communautaire TCGdex (fr),
données pré-téléchargées dans `src/data/sets/`, images chargées depuis le CDN TCGdex.

## Commandes

```bash
npm run dev        # serveur de développement (http://localhost:5173)
npm test           # tests Vitest
npm run build      # vérification TypeScript + build statique dans dist/
npm run cards      # regénère src/data/sets/A1.json depuis TCGdex (node scripts/fetch-cards.mjs)
npm run icons      # regénère public/icons/*.png avec Edge headless (node scripts/make-icons.mjs)
npm run preview    # sert dist/ comme en production (service worker actif)
```

## Sécurité (exigence d'Iban)

Aucun secret, aucun backend, données uniquement dans le navigateur. En production : CSP
stricte injectée au build (`vite.config.ts`), `noindex`, `referrer` masqué, images
uniquement depuis `assets.tcgdex.net`. Workflow GitHub Actions à permissions minimales.
Ne jamais ajouter de script, police ou style externe sans mettre la CSP à jour et le noter
ici. Lancer `npm audit` avant chaque déploiement.

## Règles de travail

- Une étape à la fois : expliquer le concept nouveau en deux phrases, livrer, faire
  vérifier par Iban, committer. Objectif d'apprentissage autant que de production.
- Logique métier (seuils, tirages, jour) en **fonctions pures** dans `src/lib/`, testées
  avant toute interface. Les composants ne contiennent pas de règles métier.
- Aucun asset du jeu copié : dos de carte, visuel de booster et icônes sont faits maison.
  Les images de cartes viennent du CDN TCGdex, usage personnel uniquement.
- Zéro design générique : suivre `DESIGN.md` (pas de gradients décoratifs, pas d'emoji,
  pas de bento).
- Pas de nouvelle dépendance sans raison écrite dans le commit.

## État d'avancement

- [x] Étape 0 : cadrage (CLAUDE.md, PRODUCT.md, DESIGN.md, launch.json), 21/09/2026
- [x] Étape 1 : socle Vite 8 + React 19 + TS 7, dépôt git local, premier commit, 21/09/2026
- [x] Étape 2 : données cartes A1 (script TCGdex, 286 cartes), tables de tirage, raretés
- [x] Étape 3 : logique pure + 48 tests Vitest (jour, seuils, tirages sans doublon, repli)
- [x] Étape 4 : état persistant (reducer, localStorage `ura.v1`, export / import)
- [x] Étape 5 : coquille + design system (tokens, boutons, barre d'onglets)
- [x] Étape 6 : écran Aujourd'hui (jauge, + 0,15 L, autre volume, prises, gagné aujourd'hui)
- [x] Étape 7 : révélation (carte, booster avec paquet, paquet rare, reprise après fermeture)
- [x] Étape 8 : écran Pokédex (progression, filtres, grille, détail)
- [x] Étape 9 : écran Historique (7 jours, jours dépliables) + réglages (export, import, reset)
- [x] Retours d'Iban du 21/09 (soir) : fiche détaillée sous la carte (révélation et Pokédex),
  feuille centrée sur grand écran, fond d'écran de l'accueil (dernière carte ou carte épinglée)
- [x] Étape 10 : PWA : `vite-plugin-pwa`, manifeste, icônes (`npm run icons`, Edge headless),
  service worker, CSP et `noindex` en production ; `npm audit` : 0 vulnérabilité
- [x] Hébergement GitHub Pages : dépôt public `Ibanokod/ura` créé et poussé le 21/09/2026
  (soir) avec l'accord d'Iban ; Pages en mode « GitHub Actions » ;
  adresse : https://ibanokod.github.io/ura/
- [ ] Installation sur le téléphone d'Iban (Chrome Android : « Ajouter à l'écran d'accueil »)
  et vérification du service worker en conditions réelles (le navigateur intégré de Claude
  ne les enregistre pas)
- [ ] Validation visuelle finale par Iban, puis DESIGN.md passe en « acté »
- [ ] Étape 11 : clôture (cartographie, état, commit)

## Déployer

Tout push sur `main` déclenche le workflow (tests, build, publication) ; suivre avec
`gh run list` / `gh run watch`. Avant de pousser : `npm test`, `npm run build`, `npm audit`,
et relire le diff pour s'assurer qu'aucun nom d'infrastructure Miatu ni donnée personnelle
ne part dans le dépôt public.

Vérifié le 21/09/2026 dans le navigateur intégré (parcours piloté par script) : carte à
0,5 L et 1 L, booster à 1,5 L (5 cartes distinctes, bilan), carte ☆ à 2 L, suppression puis
remise d'une prise sans double récompense, rechargement sans perte, reprise d'une
révélation interrompue, Pokédex 8 / 286, historique, réglages.

## Pièges connus

- TCGdex : deux cartes A1 « Sans Rareté » corrigées dans `scripts/fetch-cards.mjs`
  (`OVERRIDES`) ; le filtre `set.id` est un « contient » ; l'URL `symbol` renvoyée par l'API
  (`/univ/`) n'existe pas sur le CDN, on construit `/fr/tcgp/<set>/symbol.webp`.
- Navigateur intégré de Claude : les clics par coordonnées ou par `ref` peuvent tomber à côté
  quand la fenêtre est réduite (échelle du viewport émulé) ; pour vérifier un parcours, piloter
  la page par `javascript_tool` (`button.click()`) et lire `localStorage`.

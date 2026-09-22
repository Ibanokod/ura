# Ura

Traqueur d'eau personnel avec un moteur de motivation inspiré de Pokémon TCG Pocket : un
verre noté, une jauge qui monte, et des cartes à gagner. Une carte tous les 0,5 L, un booster
de cinq cartes à 1,5 L, puis des cartes rares garanties au-delà. Les cartes remplissent un
Pokédex, jamais de doublon. « Ura » veut dire « eau » en basque.

Projet personnel, sans compte ni serveur : **toutes les données restent dans le navigateur de
l'appareil** (export et import JSON depuis les réglages). L'appli est une PWA installable sur
l'écran d'accueil d'un téléphone ; elle se met à jour toute seule à chaque nouvelle version
publiée.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests Vitest (règles de récompense, tirages, journée, état)
npm run build      # build statique dans dist/ (service worker, CSP, noindex)
npm run preview    # sert dist/ comme en production
```

## Données et images des cartes

Les métadonnées des cartes (nom, rareté, PV, attaques...) viennent de l'API communautaire
[TCGdex](https://tcgdex.dev) et sont embarquées dans `src/data/sets/` par
`npm run cards`. Les images sont chargées depuis le CDN TCGdex à l'affichage. Pokémon, le
Jeu de Cartes à Collectionner Pokémon et Pokémon TCG Pocket appartiennent à leurs ayants
droit : ce projet est un outil personnel non commercial, sans aucun asset du jeu copié
(dos de carte, visuel de booster et icônes sont dessinés maison).

## Sécurité

Aucun secret, aucun backend, aucune connexion sortante hors les images de cartes. En
production : politique de sécurité du contenu stricte, page `noindex`, `referrer` masqué,
déploiement GitHub Pages par GitHub Actions avec permissions minimales.

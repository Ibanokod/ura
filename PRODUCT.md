# PRODUCT.md : Ura

Cadrage produit, acté avec Iban le 21/09/2026. Source de vérité des règles fonctionnelles.

## Problème

L'appli Android « Traqueur d'Eau » fait le travail mais coûte trop de clics : menus,
options inutiles, widget à 0,20 L alors que le verre d'Iban fait 0,15 L. Ura garde
l'essentiel (noter ce qu'on boit, voir où on en est) et ajoute un moteur de motivation
copié sur Pokémon TCG Pocket : boire fait gagner des cartes, les cartes remplissent un
Pokédex.

## Décisions

| Sujet | Décision |
|---|---|
| Ajout rapide | Un seul gros bouton « + 0,15 L » + « Autre volume » (saisie libre en mL) |
| Objectif | 1,5 L par jour (jauge pleine = booster) ; le dépassement reste affiché |
| Récompenses | 0,5 L : 1 carte ; 1,0 L : 1 carte ; 1,5 L : booster de 5 cartes (remplace la carte) ; au-delà : 1 carte tous les 0,5 L, garantie ☆ ou mieux ; un seul booster par jour |
| Cartes | Vraies cartes Pokémon TCG Pocket, en français, données et images TCGdex |
| Extension | Puissance Génétique (A1, 286 cartes) seule au départ ; d'autres plus tard par un réglage |
| Doublons | Jamais : le tirage ne propose que des cartes manquantes dans la rareté tirée |
| Révélation | Comme le jeu : face cachée, un tap retourne la suivante, bouton « Tout révéler » |
| Données | Dans le navigateur (localStorage) + export / import JSON ; pas de compte |
| Usage | Appli web installable (PWA) ; hébergement statique GitHub Pages sur le compte Ibanokod (décision du 21/09/2026, soir) ; `npm run dev` en local |
| Fiche de carte | Sous la carte à la révélation et dans le détail du Pokédex : PV, type, stade, talents, attaques (coût, dégâts, effet), faiblesse, retraite, description, illustrateur, paquet |
| Fond d'écran | L'accueil affiche en fond, floutée et fondue, la dernière carte obtenue ; une carte possédée peut être épinglée depuis le Pokédex |
| Journée | Change à minuit, heure locale de l'appareil |

## Écrans

Barre du bas à trois onglets : **Aujourd'hui**, **Pokédex**, **Historique**. Mobile d'abord
(375 px), colonne centrée de 480 px maximum sur PC.

### Aujourd'hui

- Jauge d'eau de 0 à 1,5 L, total du jour en litres (« 0,75 L »).
- Gros bouton « + 0,15 L ». Lien « Autre volume » : champ en mL + valider.
- Indicateur de la prochaine récompense (« Prochaine carte dans 0,25 L », « Booster à 1,5 L »,
  « Prochaine carte rare dans 0,40 L »).
- Liste des prises du jour (heure, volume), suppression avec confirmation.
- Engrenage en haut à droite : exporter, importer, réinitialiser. Rien d'autre.

### Pokédex

- Progression globale « 37 / 286 » et par rareté.
- Grille des 286 emplacements dans l'ordre de l'extension : possédée = vignette, manquante =
  silhouette sombre + numéro.
- Filtres : toutes / possédées / manquantes, et par rareté.
- Tap sur une carte possédée : grande image, nom, rareté, date d'obtention.

### Historique

- Barres des 7 derniers jours avec la ligne d'objectif.
- Liste des jours : date, total, badge objectif atteint, mini-vignettes des cartes gagnées.
- Tap sur un jour : ses prises et ses récompenses.

### Révélation (plein écran, par-dessus les onglets)

- Carte seule : dos maison, tap = retournement 3D, halo selon la rareté.
- Booster : paquet maison au symbole de l'extension, tap ou glisser pour ouvrir, 5 cartes dos
  visible, un tap par carte, « Tout révéler », bilan « 5 nouvelles cartes ». Bannière
  « Paquet rare ! » si le tirage l'a donné.
- Plusieurs récompenses dues (grosse saisie) : révélées l'une après l'autre.
- Appli fermée pendant une révélation : elle reprend là où elle en était.
- `prefers-reduced-motion` : retournement sans animation.

## Règles de récompense

Pour le jour J : `total` = somme des prises du jour ; `s = floor(total / 500 mL)` = seuils
atteints ; `n` = récompenses déjà créées ce jour. Tant que `n < s`, créer la récompense du
seuil `(n + 1) × 500` :

| Seuil (mL) | Récompense | Tirage |
|---|---|---|
| 500, 1000 | 1 carte | table « 4e carte » |
| 1500 | booster de 5 cartes | 3 × ◊, puis table « 4e carte », puis table « 5e carte » ; 0,05 % de paquet rare |
| 2000, 2500, 3000... | 1 carte ☆ ou mieux | table « paquet rare » |

- Une récompense obtenue n'est jamais reprise, même si une prise est supprimée ensuite ;
  repasser un seuil déjà récompensé ne donne rien (c'est `n` qui fait foi).
- Carte seule : jamais de ◊ simple (les ◊ arrivent par les boosters, 3 par booster).
- Rareté épuisée (toutes ses cartes possédées) : repli sur la rareté la plus proche qui a
  encore des cartes manquantes, en montant d'abord, puis en descendant.
- Dans un booster, les 5 cartes sont distinctes entre elles.
- Collection complète : la récompense affiche « Collection complète » et invite à ajouter
  une extension.

## Tables de tirage (chiffres du jeu, en %)

Puissance Génétique (pas de rareté chromatique ✧) :

| Emplacement | ◊◊ | ◊◊◊ | ◊◊◊◊ | ☆ | ☆☆ | ☆☆☆ | ♛ |
|---|---|---|---|---|---|---|---|
| 4e carte | 90 | 5 | 1,666 | 2,572 | 0,5 | 0,222 | 0,04 |
| 5e carte | 60 | 20 | 6,664 | 10,288 | 2 | 0,888 | 0,16 |
| Paquet rare (chaque carte) | | | | 40 | 50 | 5 | 5 |

Cartes 1 à 3 : ◊ à 100 %. Paquet rare : 0,05 % des boosters.

Extensions avec ✧ (à partir de Réjouissances Rayonnantes), pour plus tard :
4e carte ◊◊ 89, ◊◊◊ 4,952, ◊◊◊◊ 1,666, ☆ 2,572, ☆☆ 0,5, ☆☆☆ 0,222, ✧ 0,714, ✧✧ 0,333,
♛ 0,04 ; 5e carte ◊◊ 56,756, ◊◊◊ 19,041, ◊◊◊◊ 6,664, ☆ 10,288, ☆☆ 2, ☆☆☆ 0,888, ✧ 2,857,
✧✧ 1,333, ♛ 0,16 ; paquet rare ☆ 38, ☆☆ 47, ☆☆☆ 5, ✧ 5, ✧✧ 2, ♛ 3.

Ordre des raretés (repli et affichage) : ◊, ◊◊, ◊◊◊, ◊◊◊◊, ☆, ☆☆, ☆☆☆, ✧, ✧✧, ♛.
Chaînes TCGdex (fr) : « Un Diamant », « Deux Diamants », « Trois Diamants »,
« Quatre Diamants », « Une Étoile », « Deux Étoiles », « Trois Étoiles »,
« Un Chromatique », « Deux Chromatiques », « Couronne ».

## Données cartes : TCGdex

- `GET https://api.tcgdex.net/v2/fr/sets/A1` : nom, `cardCount`, `symbol`, `boosters`.
  Les entrées `cards` n'ont pas la rareté.
- `GET https://api.tcgdex.net/v2/fr/cards?set.id=A1&rarity=<chaîne>` : liste brève par
  rareté. Piège : le filtre `set.id` est un « contient » (A1 attrape A1a) ; on garde
  uniquement les ids commençant par `A1-`.
- Images : `<image>/low.webp` (vignettes) et `<image>/high.webp` (révélation, détail).
- `scripts/fetch-cards.mjs` écrit `src/data/sets/A1.json` (286 cartes) et affiche le
  comptage par rareté. À relancer à la main si TCGdex corrige ses données.

## Modèle de données (localStorage `ura.v1`)

```ts
type Entry  = { id: string; at: string; ml: number }             // une prise (date ISO)
type Reward = { id: string; at: string; day: string             // day = AAAA-MM-JJ local
                kind: 'card' | 'booster' | 'rare-card'
                thresholdMl: number                             // 500, 1000, 1500, 2000...
                cardIds: string[]                               // 1 ou 5 ids TCGdex ("A1-001")
                rarePack?: boolean                              // booster tombé en paquet rare
                revealed: number                                // cartes déjà retournées (reprise)
                seen: boolean }                                 // écran de révélation fermé
type State  = { version: 1
                settings: { goalMl: number; quickAddMl: number; setId: string }
                entries: Entry[]; rewards: Reward[]
                collection: Record<string, { at: string }> }   // carte possédée -> date
```

Dérivés, jamais stockés : total du jour, seuils atteints, récompenses dues, récompense à
révéler (la plus ancienne avec `seen: false`), progression du Pokédex.

Deux cartes de A1 (Grodoudou-ex 265 et 279) sont « Sans Rareté » chez TCGdex : le script les
force en Deux Étoiles, comme toutes leurs voisines (correction visible dans `OVERRIDES`).

## Installation sur le téléphone et hébergement

- L'appli est une PWA (`vite-plugin-pwa`) : manifeste, icônes 192 / 512 / maskable, service
  worker qui précache la coquille et met en cache les images de cartes à la volée (90 jours).
  Sur Android, Chrome propose « Ajouter à l'écran d'accueil » ; l'appli s'ouvre plein écran.
- Hébergement : GitHub Pages depuis le dépôt `Ibanokod/ura` (public : code seulement, jamais
  de données), déploiement automatique par GitHub Actions à chaque push sur `main`
  (`.github/workflows/deploy.yml`, build avec `BASE_PATH=/ura/`). Rien chez Miatu.
- Sécurité (exigence d'Iban) : aucun secret ni backend ; données uniquement dans le
  navigateur de l'appareil ; page `noindex` ; politique de sécurité du contenu (CSP) en
  production : scripts et styles de l'appli seulement, images depuis `assets.tcgdex.net`
  uniquement, aucune connexion sortante, aucun cadre, aucun formulaire externe ; `referrer`
  masqué ; workflow avec permissions minimales ; `npm audit` sans vulnérabilité au
  21/09/2026.

## Hors périmètre v1

- Autres extensions et choix du paquet (Mewtwo, Dracaufeu, Pikachu) : `boosters` existe
  côté TCGdex, `setId` est déjà dans les réglages.
- Enveloppe Capacitor si une vraie appli Android (Play Store) devient utile.
- Rappels et notifications, synchronisation entre appareils, points de paquet.

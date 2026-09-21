# DESIGN.md : Ura

> Source de vérité unique pour toute décision visuelle. Toute session Claude Code lit ce
> fichier avant un travail d'interface et n'invente jamais de charte de son côté.

## Statut

Direction choisie par Iban le 21/09/2026 : **sombre, inspiré de l'ambiance de Pokémon TCG
Pocket** (bleu nuit, accents dorés pour les raretés, eau lumineuse), sans copier les assets
du jeu. Valeurs proposées ci-dessous, **à acter sur la capture du premier écran** (étape 5).
Les valeurs vivent dans `src/styles/tokens.css` ; ce fichier explique le pourquoi.

## Principes

1. **L'eau est l'action, les cartes sont la récompense.** Un seul geste principal par écran
   (le bouton « + 0,15 L »), en couleur eau. Les couleurs de rareté n'apparaissent que sur les
   cartes et à la révélation.
2. **Calme par défaut, spectaculaire à la révélation.** L'interface courante est sobre et
   mate ; les halos, brillances et mouvements sont réservés au retournement des cartes.
3. **Lisible d'une main, au réveil.** Gros chiffres, cibles tactiles de 44 px minimum,
   contrastes élevés, aucune information cachée dans un menu.

## Palette

| Token | Valeur | Usage |
|---|---|---|
| `--bg` | `#0B1220` | Fond de l'appli |
| `--surface` | `#141C2E` | Panneaux, cartes de liste, barre du bas |
| `--surface-2` | `#1C2740` | Éléments surélevés (feuille de réglages, champ actif) |
| `--border` | `rgba(233,238,247,.08)` | Séparations discrètes |
| `--text` | `#E9EEF7` | Texte principal |
| `--text-muted` | `#9AA7BD` | Texte secondaire (contraste 7,7:1 sur le fond) |
| `--text-on-accent` | `#071018` | Texte sur bouton eau |
| `--water` | `#3EC1F3` | Jauge, bouton principal, onglet actif, focus |
| `--water-deep` | `#1B7FD1` | Bas de la jauge, états pressés |
| `--success` | `#4ADE80` | Objectif atteint |
| `--danger` | `#F87171` | Suppression, réinitialisation |

Couleurs de rareté (uniquement sur les cartes et la révélation) :

| Token | Valeur | Raretés |
|---|---|---|
| `--rarity-diamond` | `#C9D6E8` (argent) | ◊, ◊◊, ◊◊◊, ◊◊◊◊ |
| `--rarity-star` | `#F2C14E` (or) | ☆, ☆☆, ☆☆☆ |
| `--rarity-shiny` | `#E38BF0` (irisé) | ✧, ✧✧ |
| `--rarity-crown` | `#FFD166` (or intense) + liseré irisé | ♛ |

## Typographie

- **Manrope** (variable, géométrique, chiffres tabulaires), auto-hébergée via le paquet npm
  `@fontsource-variable/manrope`. Aucune requête vers Google Fonts. Repli : `system-ui`.
- Échelle : 12 / 14 / 16 / 20 / 28 / 40 / 56 px. Le total du jour est en 56 px, graisse 800,
  chiffres tabulaires (il ne « saute » pas quand il change).
- Libellés d'onglets 12 px, graisse 600. Corps 16 px, interligne 1,45.

## Espacement, formes, ombres

- Grille de 4 px : 4, 8, 12, 16, 20, 24, 32, 40.
- Rayons : 8 px (petits éléments), 12 px (champs), 16 px (panneaux), pilule pour les
  boutons. Cartes Pokémon : ratio réel 63 / 88, coins `4.8% / 3.4%` (proportionnels).
- Ombres douces et sombres uniquement (`--shadow-1`, `--shadow-2`) ; aucune ombre colorée
  hors révélation.

## Composants

- **Bouton principal** (« + 0,15 L ») : pilule pleine `--water`, texte `--text-on-accent`,
  hauteur 64 px, largeur pleine, graisse 800. Pressé : `--water-deep`.
- **Bouton secondaire** (« Autre volume », filtres) : pilule bordée `--border`, texte
  `--text`, fond transparent. Actif : fond `--surface-2`.
- **Jauge d'eau** : cylindre arrondi, remplissage `--water` vers `--water-deep`, ligne
  d'objectif à 1,5 L, dépassement affiché au-dessus en `--success`. Vague légère à l'ajout,
  aucune animation permanente.
- **Carte** : image TCGdex plein cadre ; **dos maison** (fond `--surface-2`, goutte d'eau en
  `--water`, motif discret) ; halo de révélation dans la couleur de la rareté.
- **Barre du bas** : 3 onglets, icônes lucide 24 px + libellé, actif en `--water`, fond
  `--surface`, bord haut `--border`, marge de sécurité iOS respectée.
- **Feuille** (réglages, détail de carte) : glisse depuis le bas, fond `--surface-2`, coins
  16 px en haut, poignée.
- **Liste** (prises, jours) : lignes de 56 px, séparateur `--border`, heure en
  `--text-muted`, volume en chiffres tabulaires.

## Mouvement

- Courbe `cubic-bezier(.2,.8,.2,1)` ; durées 150 ms (retours), 250 ms (transitions),
  600 ms (retournement de carte).
- `prefers-reduced-motion: reduce` : toutes les durées passent à 0 ms, les cartes
  apparaissent directement face visible.

## Interdits

Gradients « sparkle » ou multicolores décoratifs, bento, blobs, emoji, icônes ou polices
chargées depuis un service externe, assets du jeu (dos de carte officiel, logo, visuels de
booster), ombres colorées hors révélation, animations permanentes.

## Accessibilité

Texte ≥ 4,5:1 sur son fond (vérifié pour toutes les paires ci-dessus), cibles ≥ 44 px,
focus visible en `--water`, libellés textuels sur toutes les icônes, contenu utilisable sans
survol (tactile).

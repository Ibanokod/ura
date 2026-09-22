# DESIGN.md : Ura

> Source de vérité unique pour toute décision visuelle. Toute session Claude Code lit ce
> fichier avant un travail d'interface et n'invente jamais de charte de son côté.

## Statut

Direction choisie par Iban le 21/09/2026 : **sombre, inspiré de l'ambiance de Pokémon TCG
Pocket** (bleu nuit, accents dorés pour les raretés, eau lumineuse), sans copier les assets
du jeu. Valeurs ci-dessous appliquées dans les trois écrans et la révélation (21/09/2026),
**en attente de validation visuelle d'Iban sur la démo locale** avant de passer en « acté ».
Les valeurs vivent dans `src/styles/tokens.css` ; ce fichier explique le pourquoi.

## Principes

1. **L'eau est l'action, les cartes sont la récompense.** Un seul geste principal par écran
   (le bouton « + 0,15 L »), en couleur eau. Les couleurs de rareté n'apparaissent que sur les
   cartes et à la révélation.
2. **Sobre dans la structure, vivant par les cartes.** Les illustrations de la collection
   sont la couleur de l'appli : fond d'écran reconnaissable sur l'accueil, grilles de cartes
   bien visibles (4 par rangée), emplacements manquants teintés par leur rareté. Les panneaux
   posés sur une illustration sont légèrement translucides. Les halos, brillances et
   mouvements restent réservés au retournement des cartes (retour d'Iban du 22/09/2026 :
   la première version était trop sobre).
3. **Lisible d'une main, au réveil.** Gros chiffres, cibles tactiles de 44 px minimum,
   contrastes élevés, aucune information cachée dans un menu.
4. **Toute carte visible s'ouvre d'un tap** (accueil, gagné aujourd'hui, historique,
   Pokédex) sur la même fiche complète.
5. **On lit de haut en bas, jamais de côté.** Coquille à la hauteur de l'écran : seul le
   contenu défile, la barre du bas reste toujours visible. Aucun défilement horizontal : sur
   mobile, une rangée qui déborde élargit la fenêtre de mise en page et décale tout ; les
   rangées passent à la ligne (filtres) ou deviennent des grilles de 4 (cartes).

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

Couleurs des types d'énergie (fiche de carte uniquement : pastilles de coût, type, faiblesse) :

| Token | Valeur | Type |
|---|---|---|
| `--type-plante` | `#5CBF60` | Plante |
| `--type-feu` | `#F2734A` | Feu |
| `--type-eau` | `#4AA8F0` | Eau |
| `--type-electrique` | `#F5D547` | Électrique |
| `--type-psy` | `#B56AD6` | Psy |
| `--type-combat` | `#C98A52` | Combat |
| `--type-obscurite` | `#5D6B8A` | Obscurité |
| `--type-metal` | `#A3B1C2` | Métal |
| `--type-dragon` | `#C9B45A` | Dragon |
| `--type-incolore` | `#D9DEE8` | Incolore |

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
  16 px en haut, poignée. À partir de 600 px de large, elle devient une boîte de dialogue
  centrée (coins 16 px partout, sans poignée).
- **Fiche de carte** (`CardInfo`) : panneau `--surface` sous la carte, comme dans le jeu :
  stade et pré-évolution, PV en 28 px, pastilles de type, talents (étiquette or), attaques
  (coût en pastilles, nom, dégâts en 20 px, effet en `--text-muted`), faiblesse et retraite,
  description en italique, illustrateur et paquet en 12 px. Les énergies `{G}`, `{R}`... des
  textes d'effet sont rendues en pastilles.
- **Fond d'écran de l'accueil** : la dernière carte obtenue (ou la carte épinglée) couvre
  le bloc « héros » entier (titre, dernière carte, jauge, boutons, indication), du haut de
  l'écran au titre « Prises du jour », et défile avec lui. Image `high.webp` à 140 % de la
  hauteur du bloc, centrée horizontalement, calée en haut : l'illustration de la carte (le
  tiers sous le nom) tombe à hauteur de la jauge et de la quantité (retour d'Iban du
  22/09 : l'image « collée en haut » n'était pas propre). Flou 2,5 px, saturation 1,25,
  opacité 0,62, voile uniforme à 18 % puis fondu vers `--bg` sur les 20 % du bas. Sous le
  titre, une ligne « Dernière carte gagnée » (vignette 48 px, nom, rareté) dit ce qui est
  affiché et ouvre la fiche. La jauge (fond `--surface` à 82 %, flou d'arrière-plan 10 px)
  laisse affleurer l'illustration.
- **Grilles de cartes** (gagné aujourd'hui, historique) : 4 par rangée, gouttière 8 px,
  chaque carte est un bouton. Un jour replié de l'historique montre une rangée puis une case
  « +n » ; la liste des prises du jour montre les 3 dernières puis « Voir les n autres ».
- **Emplacement manquant du Pokédex** : fond `--surface` mélangé à 9 % de la couleur de la
  rareté, bordure à 28 %, numéro dans la couleur de la rareté.
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
booster), ombres colorées hors révélation, animations permanentes, **défilement
horizontal** (rangées à faire défiler du doigt).

## Accessibilité

Texte ≥ 4,5:1 sur son fond (vérifié pour toutes les paires ci-dessus), cibles ≥ 44 px,
focus visible en `--water`, libellés textuels sur toutes les icônes, contenu utilisable sans
survol (tactile).

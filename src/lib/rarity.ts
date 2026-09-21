// Raretés de Pokémon TCG Pocket, dans l'ordre croissant (sert au repli et à l'affichage).
// Les chaînes sont celles de l'API TCGdex en français : on les garde telles quelles
// pour que les données téléchargées et le code parlent la même langue.

export const RARITIES = [
  'Un Diamant',
  'Deux Diamants',
  'Trois Diamants',
  'Quatre Diamants',
  'Une Étoile',
  'Deux Étoiles',
  'Trois Étoiles',
  'Un Chromatique',
  'Deux Chromatiques',
  'Couronne',
] as const

export type Rarity = (typeof RARITIES)[number]

/** Première rareté considérée « rare » (cartes garanties au-delà de 1,5 L). */
export const RARE_MIN: Rarity = 'Une Étoile'

const SYMBOLS: Record<Rarity, string> = {
  'Un Diamant': '◊',
  'Deux Diamants': '◊◊',
  'Trois Diamants': '◊◊◊',
  'Quatre Diamants': '◊◊◊◊',
  'Une Étoile': '☆',
  'Deux Étoiles': '☆☆',
  'Trois Étoiles': '☆☆☆',
  'Un Chromatique': '✧',
  'Deux Chromatiques': '✧✧',
  Couronne: '♛',
}

/** Famille visuelle : pilote la couleur du halo et des badges (voir DESIGN.md). */
export type RarityFamily = 'diamond' | 'star' | 'shiny' | 'crown'

export function isRarity(value: string): value is Rarity {
  return (RARITIES as readonly string[]).includes(value)
}

export function rarityRank(rarity: Rarity): number {
  return RARITIES.indexOf(rarity)
}

export function raritySymbol(rarity: Rarity): string {
  return SYMBOLS[rarity]
}

export function rarityFamily(rarity: Rarity): RarityFamily {
  if (rarity === 'Couronne') return 'crown'
  if (rarity.includes('Chromatique')) return 'shiny'
  if (rarity.includes('Étoile')) return 'star'
  return 'diamond'
}

export function isRare(rarity: Rarity): boolean {
  return rarityRank(rarity) >= rarityRank(RARE_MIN)
}

// Accès aux extensions embarquées. Le JSON est produit par scripts/fetch-cards.mjs ;
// on le typpe ici et on fournit une validation utilisée par les tests.

import { isRarity, type Rarity } from '../../lib/rarity'
import A1 from './A1.json'

export type CardData = {
  id: string
  localId: string
  name: string
  /** Base de l'image TCGdex, sans extension : on y ajoute /low.webp ou /high.webp. */
  image: string
  rarity: Rarity
}

export type SetData = {
  id: string
  name: string
  releaseDate: string | null
  symbol: string | null
  cardCount: { official: number; total: number } | null
  boosters: { id: string; name: string }[]
  cards: CardData[]
}

const SETS: Record<string, SetData> = {
  A1: A1 as unknown as SetData,
}

export function getSet(setId: string): SetData {
  const set = SETS[setId]
  if (!set) throw new Error(`Extension inconnue : ${setId}`)
  return set
}

export function listSets(): SetData[] {
  return Object.values(SETS)
}

export type ImageQuality = 'low' | 'high'

export function cardImageUrl(card: Pick<CardData, 'image'>, quality: ImageQuality): string {
  return `${card.image}/${quality}.webp`
}

export function setSymbolUrl(set: SetData): string | null {
  return set.symbol ? `${set.symbol}.webp` : null
}

/** Liste les problèmes d'un jeu de données (vide = tout va bien). */
export function validateSet(set: SetData): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  set.cards.forEach((card, index) => {
    if (ids.has(card.id)) problems.push(`id en double : ${card.id}`)
    ids.add(card.id)
    if (!isRarity(card.rarity)) problems.push(`rareté inconnue pour ${card.id} : ${String(card.rarity)}`)
    if (Number(card.localId) !== index + 1) problems.push(`ordre inattendu : ${card.id} en position ${index + 1}`)
    if (!card.image.startsWith('https://')) problems.push(`image absente pour ${card.id}`)
  })
  if (set.cardCount && set.cards.length !== set.cardCount.total) {
    problems.push(`${set.cards.length} cartes pour ${set.cardCount.total} attendues`)
  }
  return problems
}

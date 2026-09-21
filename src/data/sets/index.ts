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

const indexCache = new WeakMap<SetData, Map<string, CardData>>()

/** Carte par id, avec un index construit une seule fois par extension. */
export function cardById(set: SetData, id: string): CardData | undefined {
  let index = indexCache.get(set)
  if (!index) {
    index = new Map(set.cards.map((card) => [card.id, card]))
    indexCache.set(set, index)
  }
  return index.get(id)
}

export type ImageQuality = 'low' | 'high'

export function cardImageUrl(card: Pick<CardData, 'image'>, quality: ImageQuality): string {
  return `${card.image}/${quality}.webp`
}

/**
 * Symbole de l'extension (64 px). L'API renvoie une base « univ » qui n'existe pas sur le CDN
 * pour Pocket (vérifié le 21/09/2026) : on construit l'URL localisée, qui existe.
 */
export function setSymbolUrl(set: SetData): string {
  return `https://assets.tcgdex.net/fr/tcgp/${set.id}/symbol.webp`
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

import { describe, expect, it } from 'vitest'
import { RATES_CLASSIC, RATES_WITH_SHINY, type RarityTable } from '../data/rates'
import { drawBooster, drawCard, drawForThreshold, drawRareCard, drawSingleCard, resolveRarity, type DrawableCard, type DrawContext } from './draw'
import { pickWeighted, seededRng } from './random'
import { RARITIES, type Rarity, isRare } from './rarity'

/** Jeu de cartes synthétique : `perRarity` cartes pour chaque rareté demandée. */
function makeCards(perRarity: number, rarities: readonly Rarity[] = RARITIES): DrawableCard[] {
  const cards: DrawableCard[] = []
  for (const rarity of rarities) for (let i = 0; i < perRarity; i++) cards.push({ id: `${rarity}#${i}`, rarity })
  return cards
}

function rarityOf(cards: readonly DrawableCard[], id: string): Rarity {
  return cards.find((c) => c.id === id)!.rarity
}

function context(cards: DrawableCard[], owned: string[] = [], seed = 42): DrawContext {
  return { cards, owned: new Set(owned), rates: RATES_CLASSIC, rng: seededRng(seed) }
}

/** Répartition observée (en %) d'une table sur n tirages. */
function distribution(table: RarityTable, n: number, seed = 7): Map<string, number> {
  const rng = seededRng(seed)
  const counts = new Map<string, number>()
  for (let i = 0; i < n; i++) {
    const key = pickWeighted(table, rng)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  for (const [k, v] of counts) counts.set(k, (v / n) * 100)
  return counts
}

describe('tables de tirage', () => {
  it.each([
    ['4e carte', RATES_CLASSIC.slot4],
    ['5e carte', RATES_CLASSIC.slot5],
    ['paquet rare', RATES_CLASSIC.rarePack],
    ['4e carte avec chromatiques', RATES_WITH_SHINY.slot4],
    ['5e carte avec chromatiques', RATES_WITH_SHINY.slot5],
  ])('%s : chaque rareté tombe à ± 0,3 point de la table', (_name, table) => {
    const observed = distribution(table, 200_000)
    for (const [rarity, expected] of Object.entries(table) as [Rarity, number][]) {
      expect(Math.abs((observed.get(rarity) ?? 0) - expected)).toBeLessThan(0.3)
    }
  })

  it('les tables somment à 100 (à 0,05 près)', () => {
    for (const rates of [RATES_CLASSIC, RATES_WITH_SHINY]) {
      for (const table of [rates.slot4, rates.slot5, rates.rarePack]) {
        const sum = Object.values(table).reduce((s, w) => s + (w ?? 0), 0)
        expect(Math.abs(sum - 100)).toBeLessThan(0.05)
      }
    }
  })
})

describe('repli de rareté', () => {
  it('garde la rareté voulue quand elle est disponible', () => {
    expect(resolveRarity('Une Étoile', () => true)).toBe('Une Étoile')
  })

  it('monte d’abord, puis descend', () => {
    const only = (available: Rarity[]) => (r: Rarity) => available.includes(r)
    expect(resolveRarity('Une Étoile', only(['Couronne', 'Un Diamant']))).toBe('Couronne')
    expect(resolveRarity('Une Étoile', only(['Un Diamant', 'Trois Diamants']))).toBe('Trois Diamants')
    expect(resolveRarity('Couronne', only(['Un Diamant']))).toBe('Un Diamant')
  })

  it('rend null quand plus rien n’est disponible', () => {
    expect(resolveRarity('Un Diamant', () => false)).toBeNull()
  })
})

describe('tirage d’une carte', () => {
  it('ne tire jamais une carte possédée', () => {
    const cards = makeCards(3)
    const owned = cards.filter((c) => c.rarity === 'Deux Diamants' || c.rarity === 'Trois Diamants').map((c) => c.id)
    const ctx = context(cards, owned)
    for (let i = 0; i < 500; i++) {
      const card = drawCard(RATES_CLASSIC.slot4, ctx)
      expect(card).not.toBeNull()
      expect(owned).not.toContain(card!.id)
    }
  })

  it('suit la table quand toutes les raretés sont disponibles', () => {
    const cards = makeCards(40)
    const ctx = context(cards, [], 3)
    const counts = new Map<Rarity, number>()
    const n = 20_000
    for (let i = 0; i < n; i++) {
      const card = drawCard(RATES_CLASSIC.slot4, ctx)!
      counts.set(card.rarity, (counts.get(card.rarity) ?? 0) + 1)
    }
    expect(((counts.get('Deux Diamants') ?? 0) / n) * 100).toBeGreaterThan(88)
    expect(((counts.get('Deux Diamants') ?? 0) / n) * 100).toBeLessThan(92)
    expect(counts.get('Un Diamant') ?? 0).toBe(0)
  })

  it('se replie quand la rareté tirée est épuisée', () => {
    // Seules des ◊ et une ♛ existent ; la table veut ☆ : on monte jusqu'à ♛.
    const cards = [...makeCards(5, ['Un Diamant']), { id: 'crown', rarity: 'Couronne' as Rarity }]
    const ctx = context(cards)
    expect(drawCard({ 'Une Étoile': 100 }, ctx)!.id).toBe('crown')
    // ♛ possédée : on redescend sur les ◊.
    const ctx2 = context(cards, ['crown'])
    expect(drawCard({ 'Une Étoile': 100 }, ctx2)!.rarity).toBe('Un Diamant')
  })

  it('rend null quand la collection est complète', () => {
    const cards = makeCards(2)
    const ctx = context(cards, cards.map((c) => c.id))
    expect(drawCard(RATES_CLASSIC.slot4, ctx)).toBeNull()
    expect(drawSingleCard(ctx)).toEqual([])
    expect(drawRareCard(ctx)).toEqual([])
    expect(drawBooster(ctx)).toEqual({ cardIds: [], rarePack: false })
  })
})

describe('carte rare garantie', () => {
  it('donne toujours ☆ ou mieux tant qu’il en reste', () => {
    const cards = makeCards(10)
    const ctx = context(cards, [], 11)
    for (let i = 0; i < 300; i++) {
      const [id] = drawRareCard(ctx)
      expect(isRare(rarityOf(cards, id))).toBe(true)
    }
  })
})

describe('booster', () => {
  it('donne 5 cartes distinctes : 3 × ◊ puis deux cartes des tables 4 et 5', () => {
    const cards = makeCards(30)
    const ctx = context(cards, [], 5)
    for (let i = 0; i < 200; i++) {
      const { cardIds, rarePack } = drawBooster(ctx)
      expect(rarePack).toBe(false)
      expect(cardIds).toHaveLength(5)
      expect(new Set(cardIds).size).toBe(5)
      expect(cardIds.slice(0, 3).map((id) => rarityOf(cards, id))).toEqual(['Un Diamant', 'Un Diamant', 'Un Diamant'])
      expect(rarityOf(cards, cardIds[3])).not.toBe('Un Diamant')
      expect(rarityOf(cards, cardIds[4])).not.toBe('Un Diamant')
    }
  })

  it('ne répète pas une carte même s’il ne reste que 3 ◊', () => {
    const cards = [...makeCards(3, ['Un Diamant']), ...makeCards(5, ['Deux Diamants'])]
    const ctx = context(cards)
    const { cardIds } = drawBooster(ctx)
    expect(new Set(cardIds).size).toBe(cardIds.length)
  })

  it('devient un paquet rare quand le hasard passe sous 0,05 %', () => {
    const cards = makeCards(10)
    let calls = 0
    const rng = () => (calls++ === 0 ? 0.0001 : 0.5)
    const { cardIds, rarePack } = drawBooster({ cards, owned: new Set(), rates: RATES_CLASSIC, rng })
    expect(rarePack).toBe(true)
    expect(cardIds).toHaveLength(5)
    for (const id of cardIds) expect(isRare(rarityOf(cards, id))).toBe(true)
  })

  it('reste un booster normal quand le hasard est au-dessus', () => {
    const cards = makeCards(10)
    const { rarePack } = drawBooster({ cards, owned: new Set(), rates: RATES_CLASSIC, rng: () => 0.999 })
    expect(rarePack).toBe(false)
  })
})

describe('tirage par seuil', () => {
  it('associe le bon type de récompense à chaque seuil', () => {
    const cards = makeCards(10)
    const ctx = context(cards)
    expect(drawForThreshold(500, ctx)).toMatchObject({ kind: 'card' })
    expect(drawForThreshold(500, ctx).cardIds).toHaveLength(1)
    expect(drawForThreshold(1500, ctx)).toMatchObject({ kind: 'booster', rarePack: false })
    expect(drawForThreshold(1500, ctx).cardIds).toHaveLength(5)
    expect(drawForThreshold(2000, ctx)).toMatchObject({ kind: 'rare-card' })
  })
})

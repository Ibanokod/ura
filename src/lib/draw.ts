// Tirage des cartes. Règle centrale : jamais de doublon, on ne tire que parmi les cartes
// manquantes. Si la rareté tirée n'a plus de carte manquante, on se replie sur la rareté
// la plus proche qui en a encore (en montant d'abord, puis en descendant).

import type { RateSet, RarityTable } from '../data/rates'
import { type Rng, pickOne, pickWeighted } from './random'
import { RARITIES, type Rarity, rarityRank } from './rarity'
import { kindForThreshold, type RewardKind } from './rewards'

export type DrawableCard = { id: string; rarity: Rarity }

export type DrawContext = {
  cards: readonly DrawableCard[]
  /** Ids déjà possédés. */
  owned: ReadonlySet<string>
  rates: RateSet
  rng: Rng
}

const ONE_DIAMOND: RarityTable = { 'Un Diamant': 100 }

/** Rareté effective : la voulue si disponible, sinon la plus proche au-dessus, sinon en dessous. */
export function resolveRarity(wanted: Rarity, hasAvailable: (rarity: Rarity) => boolean): Rarity | null {
  const start = rarityRank(wanted)
  for (let i = start; i < RARITIES.length; i++) if (hasAvailable(RARITIES[i])) return RARITIES[i]
  for (let i = start - 1; i >= 0; i--) if (hasAvailable(RARITIES[i])) return RARITIES[i]
  return null
}

function availableByRarity(ctx: DrawContext, exclude: ReadonlySet<string>): Map<Rarity, DrawableCard[]> {
  const pool = new Map<Rarity, DrawableCard[]>()
  for (const card of ctx.cards) {
    if (ctx.owned.has(card.id) || exclude.has(card.id)) continue
    const list = pool.get(card.rarity)
    if (list) list.push(card)
    else pool.set(card.rarity, [card])
  }
  return pool
}

/** Tire une carte manquante selon une table. `null` quand il ne reste aucune carte à gagner. */
export function drawCard(table: RarityTable, ctx: DrawContext, exclude: ReadonlySet<string> = new Set()): DrawableCard | null {
  const pool = availableByRarity(ctx, exclude)
  const wanted = pickWeighted(table, ctx.rng)
  const rarity = resolveRarity(wanted, (r) => (pool.get(r)?.length ?? 0) > 0)
  if (!rarity) return null
  return pickOne(pool.get(rarity)!, ctx.rng)
}

/** Carte seule des seuils 0,5 L et 1 L : table de la 4e carte d'un booster. */
export function drawSingleCard(ctx: DrawContext): string[] {
  const card = drawCard(ctx.rates.slot4, ctx)
  return card ? [card.id] : []
}

/** Carte garantie rare des seuils au-delà de 1,5 L : table du paquet rare. */
export function drawRareCard(ctx: DrawContext): string[] {
  const card = drawCard(ctx.rates.rarePack, ctx)
  return card ? [card.id] : []
}

export type BoosterResult = { cardIds: string[]; rarePack: boolean }

/** Booster de 5 cartes distinctes : 3 × ◊, 4e carte, 5e carte ; ou paquet rare (5 × table rare). */
export function drawBooster(ctx: DrawContext): BoosterResult {
  const rarePack = ctx.rng() * 100 < ctx.rates.rarePackChance
  const tables: RarityTable[] = rarePack
    ? [ctx.rates.rarePack, ctx.rates.rarePack, ctx.rates.rarePack, ctx.rates.rarePack, ctx.rates.rarePack]
    : [ONE_DIAMOND, ONE_DIAMOND, ONE_DIAMOND, ctx.rates.slot4, ctx.rates.slot5]
  const picked = new Set<string>()
  const cardIds: string[] = []
  for (const table of tables) {
    const card = drawCard(table, ctx, picked)
    if (!card) break
    picked.add(card.id)
    cardIds.push(card.id)
  }
  return { cardIds, rarePack }
}

export type DrawResult = { kind: RewardKind; cardIds: string[]; rarePack?: boolean }

export function drawForThreshold(thresholdMl: number, ctx: DrawContext): DrawResult {
  const kind = kindForThreshold(thresholdMl)
  if (kind === 'booster') {
    const booster = drawBooster(ctx)
    return { kind, cardIds: booster.cardIds, rarePack: booster.rarePack }
  }
  if (kind === 'rare-card') return { kind, cardIds: drawRareCard(ctx) }
  return { kind, cardIds: drawSingleCard(ctx) }
}

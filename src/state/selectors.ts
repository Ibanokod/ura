// « Sélecteurs » : des fonctions pures qui calculent ce que les écrans affichent à partir
// de l'état brut (total du jour, prochaine récompense, statistiques du Pokédex...).
// Rien n'est stocké en double : tout se recalcule.

import { cardById, type CardData, type SetData } from '../data/sets'
import { dayKeyOf, entriesForDay, todayKey, totalForDay } from '../lib/day'
import { RARITIES, type Rarity } from '../lib/rarity'
import { nextReward, type NextReward } from '../lib/rewards'
import type { Entry, Reward, State } from './types'

export type DaySummary = {
  day: string
  totalMl: number
  /** Prises du jour, la plus récente en premier. */
  entries: Entry[]
  /** Récompenses du jour, dans l'ordre d'obtention. */
  rewards: Reward[]
  next: NextReward
}

export function selectDay(state: State, day: string): DaySummary {
  const entries = entriesForDay(state.entries, day).sort((a, b) => b.at.localeCompare(a.at))
  const rewards = state.rewards.filter((r) => r.day === day).sort((a, b) => a.at.localeCompare(b.at))
  const totalMl = totalForDay(state.entries, day)
  return { day, totalMl, entries, rewards, next: nextReward(totalMl, rewards.length) }
}

export function selectToday(state: State, now: Date = new Date()): DaySummary {
  return selectDay(state, todayKey(now))
}

/** Récompense à révéler maintenant (la plus ancienne non fermée), ou null. */
export function selectPendingReward(state: State): Reward | null {
  const pending = state.rewards.filter((r) => !r.seen).sort((a, b) => a.at.localeCompare(b.at))
  return pending[0] ?? null
}

/** Jours ayant au moins une prise, du plus récent au plus ancien. */
export function selectDays(state: State): string[] {
  const days = new Set<string>()
  for (const e of state.entries) days.add(dayKeyOf(e.at))
  return [...days].sort((a, b) => b.localeCompare(a))
}

/** Carte affichée en fond de l'accueil : celle choisie, sinon la dernière obtenue, sinon aucune. */
export function selectBackdropCard(state: State, set: SetData): CardData | null {
  const chosen = state.settings.backdropCardId
  if (chosen && state.collection[chosen]) {
    const card = cardById(set, chosen)
    if (card) return card
  }
  let latestId: string | null = null
  let latestAt = ''
  for (const [id, { at }] of Object.entries(state.collection)) {
    if (at > latestAt && cardById(set, id)) {
      latestAt = at
      latestId = id
    }
  }
  return latestId ? (cardById(set, latestId) ?? null) : null
}

export type DexStats = {
  owned: number
  total: number
  byRarity: { rarity: Rarity; owned: number; total: number }[]
}

export function selectDexStats(state: State, set: SetData): DexStats {
  const counts = new Map<Rarity, { owned: number; total: number }>()
  for (const rarity of RARITIES) counts.set(rarity, { owned: 0, total: 0 })
  let owned = 0
  for (const card of set.cards) {
    const c = counts.get(card.rarity)!
    c.total++
    if (state.collection[card.id]) {
      c.owned++
      owned++
    }
  }
  const byRarity = RARITIES.map((rarity) => ({ rarity, ...counts.get(rarity)! })).filter((c) => c.total > 0)
  return { owned, total: set.cards.length, byRarity }
}

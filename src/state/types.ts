// Forme des données sauvegardées (localStorage `ura.v1`). Toute évolution passe par une
// nouvelle version et une migration dans persistence.ts, sauf ajout d'un réglage optionnel
// (complété par sa valeur par défaut au chargement).

import type { RewardKind } from '../lib/rewards'

export type Entry = {
  id: string
  /** Date et heure de la prise, ISO. */
  at: string
  ml: number
}

export type Reward = {
  id: string
  at: string
  /** Jour local AAAA-MM-JJ auquel la récompense appartient. */
  day: string
  kind: RewardKind
  thresholdMl: number
  /** 1 carte, 5 cartes, ou aucune si la collection est complète. */
  cardIds: string[]
  rarePack?: boolean
  /** Nombre de cartes déjà retournées (reprise si l'appli est fermée en cours). */
  revealed: number
  /** L'écran de révélation a été fermé par l'utilisateur. */
  seen: boolean
}

export type Settings = {
  goalMl: number
  quickAddMl: number
  setId: string
  /** Carte choisie comme fond d'écran de l'accueil ; null = la dernière carte obtenue. */
  backdropCardId: string | null
}

export type State = {
  version: 1
  settings: Settings
  entries: Entry[]
  rewards: Reward[]
  /** Carte possédée -> date d'obtention. */
  collection: Record<string, { at: string }>
}

export const DEFAULT_SETTINGS: Settings = { goalMl: 1500, quickAddMl: 150, setId: 'A1', backdropCardId: null }

export function initialState(): State {
  return { version: 1, settings: { ...DEFAULT_SETTINGS }, entries: [], rewards: [], collection: {} }
}

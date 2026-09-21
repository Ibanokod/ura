// Lecture et écriture de l'état dans localStorage, export et import JSON.
// Tout est défensif : une donnée corrompue redonne un état vide plutôt qu'un plantage.

import { DEFAULT_SETTINGS, initialState, type State } from './types'

export const STORAGE_KEY = 'ura.v1'

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export function loadState(): State {
  if (!hasStorage()) return initialState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed: unknown = JSON.parse(raw)
    return isState(parsed) ? withDefaults(parsed) : initialState()
  } catch {
    return initialState()
  }
}

/** Complète les réglages ajoutés depuis la sauvegarde (nouveaux champs optionnels). */
export function withDefaults(state: State): State {
  return { ...state, settings: { ...DEFAULT_SETTINGS, ...state.settings } }
}

export function saveState(state: State): void {
  if (!hasStorage()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Stockage plein ou bloqué : on continue en mémoire, sans casser l'appli.
  }
}

/** Vérification structurelle minimale : assez pour rejeter un fichier qui n'est pas un export Ura. */
export function isState(value: unknown): value is State {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (v.version !== 1) return false
  if (!Array.isArray(v.entries) || !Array.isArray(v.rewards)) return false
  if (typeof v.collection !== 'object' || v.collection === null) return false
  const settings = v.settings as Record<string, unknown> | undefined
  if (!settings || typeof settings.goalMl !== 'number' || typeof settings.quickAddMl !== 'number' || typeof settings.setId !== 'string') {
    return false
  }
  return (v.entries as unknown[]).every(isEntry) && (v.rewards as unknown[]).every(isReward)
}

function isEntry(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const e = value as Record<string, unknown>
  return typeof e.id === 'string' && typeof e.at === 'string' && typeof e.ml === 'number'
}

function isReward(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.at === 'string' &&
    typeof r.day === 'string' &&
    typeof r.thresholdMl === 'number' &&
    Array.isArray(r.cardIds) &&
    typeof r.revealed === 'number' &&
    typeof r.seen === 'boolean'
  )
}

export function exportJson(state: State): string {
  return JSON.stringify(state, null, 2)
}

/** Rend l'état contenu dans un export, ou null si le texte n'est pas un export valide. */
export function parseImport(json: string): State | null {
  try {
    const parsed: unknown = JSON.parse(json)
    return isState(parsed) ? withDefaults(parsed) : null
  } catch {
    return null
  }
}

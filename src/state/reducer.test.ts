import { describe, expect, it } from 'vitest'
import { exportJson, isState, parseImport } from './persistence'
import { reducer } from './reducer'
import { selectDay, selectPendingReward } from './selectors'
import { initialState, type Reward, type State } from './types'

const at = (h: number, m = 0) => new Date(2026, 8, 21, h, m).toISOString()

function reward(overrides: Partial<Reward> = {}): Reward {
  return {
    id: 'r1',
    at: at(10),
    day: '2026-09-21',
    kind: 'card',
    thresholdMl: 500,
    cardIds: ['A1-001'],
    revealed: 0,
    seen: false,
    ...overrides,
  }
}

describe('prises', () => {
  it('ajoute une prise', () => {
    const s = reducer(initialState(), { type: 'addIntake', id: 'e1', at: at(8), ml: 150 })
    expect(s.entries).toEqual([{ id: 'e1', at: at(8), ml: 150 }])
  })

  it('refuse les volumes absurdes', () => {
    const s0 = initialState()
    expect(reducer(s0, { type: 'addIntake', id: 'e1', at: at(8), ml: 0 })).toBe(s0)
    expect(reducer(s0, { type: 'addIntake', id: 'e1', at: at(8), ml: -50 })).toBe(s0)
    expect(reducer(s0, { type: 'addIntake', id: 'e1', at: at(8), ml: 9000 })).toBe(s0)
    expect(reducer(s0, { type: 'addIntake', id: 'e1', at: at(8), ml: Number.NaN })).toBe(s0)
  })

  it('supprime une prise sans toucher aux récompenses', () => {
    let s = reducer(initialState(), { type: 'addIntake', id: 'e1', at: at(8), ml: 500 })
    s = reducer(s, { type: 'createReward', reward: reward() })
    s = reducer(s, { type: 'deleteIntake', id: 'e1' })
    expect(s.entries).toEqual([])
    expect(s.rewards).toHaveLength(1)
    expect(s.collection['A1-001']).toBeDefined()
  })
})

describe('récompenses', () => {
  it('ajoute la récompense et ses cartes à la collection', () => {
    const s = reducer(initialState(), { type: 'createReward', reward: reward({ cardIds: ['A1-001', 'A1-002'] }) })
    expect(s.rewards).toHaveLength(1)
    expect(Object.keys(s.collection).sort()).toEqual(['A1-001', 'A1-002'])
    expect(s.collection['A1-001'].at).toBe(at(10))
  })

  it('ignore un doublon de seuil pour le même jour', () => {
    let s = reducer(initialState(), { type: 'createReward', reward: reward() })
    s = reducer(s, { type: 'createReward', reward: reward({ id: 'r2', cardIds: ['A1-050'] }) })
    expect(s.rewards).toHaveLength(1)
    expect(s.collection['A1-050']).toBeUndefined()
  })

  it('accepte le même seuil un autre jour', () => {
    let s = reducer(initialState(), { type: 'createReward', reward: reward() })
    s = reducer(s, { type: 'createReward', reward: reward({ id: 'r2', day: '2026-09-22', cardIds: ['A1-050'] }) })
    expect(s.rewards).toHaveLength(2)
  })

  it('retourne les cartes une par une, sans dépasser, puis ferme', () => {
    let s = reducer(initialState(), { type: 'createReward', reward: reward({ kind: 'booster', thresholdMl: 1500, cardIds: ['a', 'b', 'c', 'd', 'e'] }) })
    s = reducer(s, { type: 'revealCard', rewardId: 'r1' })
    s = reducer(s, { type: 'revealCard', rewardId: 'r1' })
    expect(s.rewards[0].revealed).toBe(2)
    expect(selectPendingReward(s)?.id).toBe('r1')
    s = reducer(s, { type: 'revealAll', rewardId: 'r1' })
    expect(s.rewards[0].revealed).toBe(5)
    s = reducer(s, { type: 'revealCard', rewardId: 'r1' })
    expect(s.rewards[0].revealed).toBe(5)
    s = reducer(s, { type: 'closeReward', rewardId: 'r1' })
    expect(s.rewards[0].seen).toBe(true)
    expect(selectPendingReward(s)).toBeNull()
  })

  it('révèle les récompenses dans l’ordre d’obtention', () => {
    let s = reducer(initialState(), { type: 'createReward', reward: reward({ id: 'r2', at: at(11), thresholdMl: 1000 }) })
    s = reducer(s, { type: 'createReward', reward: reward({ id: 'r1', at: at(10) }) })
    expect(selectPendingReward(s)?.id).toBe('r1')
  })
})

describe('résumé du jour', () => {
  it('calcule total, prises et prochaine récompense', () => {
    let s = reducer(initialState(), { type: 'addIntake', id: 'e1', at: at(8), ml: 150 })
    s = reducer(s, { type: 'addIntake', id: 'e2', at: at(9), ml: 400 })
    s = reducer(s, { type: 'createReward', reward: reward() })
    const day = selectDay(s, '2026-09-21')
    expect(day.totalMl).toBe(550)
    expect(day.entries.map((e) => e.id)).toEqual(['e2', 'e1'])
    expect(day.rewards).toHaveLength(1)
    expect(day.next).toEqual({ thresholdMl: 1000, remainingMl: 450, kind: 'card' })
  })
})

describe('export et import', () => {
  it('rend un état identique après export puis import', () => {
    let s: State = reducer(initialState(), { type: 'addIntake', id: 'e1', at: at(8), ml: 150 })
    s = reducer(s, { type: 'createReward', reward: reward() })
    const imported = parseImport(exportJson(s))
    expect(imported).toEqual(s)
    expect(reducer(initialState(), { type: 'importState', state: imported! })).toEqual(s)
  })

  it('rejette un fichier qui n’est pas un export Ura', () => {
    expect(parseImport('{"hello":1}')).toBeNull()
    expect(parseImport('pas du json')).toBeNull()
    expect(isState({ version: 2, entries: [], rewards: [], collection: {}, settings: {} })).toBe(false)
  })

  it('réinitialise tout', () => {
    const s = reducer(initialState(), { type: 'addIntake', id: 'e1', at: at(8), ml: 150 })
    expect(reducer(s, { type: 'reset' })).toEqual(initialState())
  })
})

// Le « reducer » : une fonction pure qui reçoit l'état courant et une action, et rend le
// nouvel état. Il ne tire jamais au hasard et ne lit jamais l'heure : ce qui dépend du
// monde extérieur (id, date, cartes tirées) arrive déjà calculé dans l'action.

import { initialState, type Reward, type State } from './types'

export type Action =
  | { type: 'addIntake'; id: string; at: string; ml: number }
  | { type: 'deleteIntake'; id: string }
  | { type: 'createReward'; reward: Reward }
  | { type: 'revealCard'; rewardId: string }
  | { type: 'revealAll'; rewardId: string }
  | { type: 'closeReward'; rewardId: string }
  | { type: 'setBackdrop'; cardId: string | null }
  | { type: 'importState'; state: State }
  | { type: 'reset' }

export const MAX_INTAKE_ML = 5000

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'addIntake': {
      const ml = Math.round(action.ml)
      if (!Number.isFinite(ml) || ml <= 0 || ml > MAX_INTAKE_ML) return state
      return { ...state, entries: [...state.entries, { id: action.id, at: action.at, ml }] }
    }

    case 'deleteIntake':
      return { ...state, entries: state.entries.filter((e) => e.id !== action.id) }

    case 'createReward': {
      const { reward } = action
      // Un seuil donné n'est récompensé qu'une fois par jour, quoi qu'il arrive.
      const exists = state.rewards.some((r) => r.day === reward.day && r.thresholdMl === reward.thresholdMl)
      if (exists) return state
      const collection = { ...state.collection }
      for (const id of reward.cardIds) if (!collection[id]) collection[id] = { at: reward.at }
      return { ...state, rewards: [...state.rewards, reward], collection }
    }

    case 'revealCard':
      return updateReward(state, action.rewardId, (r) => ({ ...r, revealed: Math.min(r.cardIds.length, r.revealed + 1) }))

    case 'revealAll':
      return updateReward(state, action.rewardId, (r) => ({ ...r, revealed: r.cardIds.length }))

    case 'closeReward':
      return updateReward(state, action.rewardId, (r) => ({ ...r, revealed: r.cardIds.length, seen: true }))

    case 'setBackdrop':
      if (action.cardId !== null && !state.collection[action.cardId]) return state
      return { ...state, settings: { ...state.settings, backdropCardId: action.cardId } }

    case 'importState':
      return action.state

    case 'reset':
      return initialState()
  }
}

function updateReward(state: State, rewardId: string, update: (reward: Reward) => Reward): State {
  const index = state.rewards.findIndex((r) => r.id === rewardId)
  if (index === -1) return state
  const rewards = state.rewards.slice()
  rewards[index] = update(rewards[index])
  return { ...state, rewards }
}

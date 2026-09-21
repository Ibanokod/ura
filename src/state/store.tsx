// Le « store » : branche le reducer sur React (useReducer), sauvegarde chaque changement
// dans localStorage, et crée les récompenses dues dès qu'un seuil est franchi.
// Les écrans lisent l'état avec useAppState() et agissent avec useActions().

import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { ratesForSet } from '../data/rates'
import { getSet } from '../data/sets'
import { dayKeyOf, totalForDay } from '../lib/day'
import { drawForThreshold } from '../lib/draw'
import { defaultRng } from '../lib/random'
import { dueThresholds } from '../lib/rewards'
import { loadState, saveState } from './persistence'
import { reducer, type Action } from './reducer'
import type { State } from './types'

const StateContext = createContext<State | null>(null)
const DispatchContext = createContext<Dispatch<Action> | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  // 1. Chaque changement d'état est sauvegardé.
  useEffect(() => {
    saveState(state)
  }, [state])

  // 2. Dès qu'un seuil non récompensé est franchi, on tire et on crée la récompense.
  //    On regarde le jour de la dernière prise (et pas « maintenant ») pour qu'une prise
  //    saisie à 23 h 59 soit récompensée sur le bon jour.
  useEffect(() => {
    const last = state.entries[state.entries.length - 1]
    if (!last) return
    const day = dayKeyOf(last.at)
    const total = totalForDay(state.entries, day)
    const created = state.rewards.filter((r) => r.day === day).length
    const [thresholdMl] = dueThresholds(total, created)
    if (thresholdMl === undefined) return

    const set = getSet(state.settings.setId)
    const owned = new Set(Object.keys(state.collection))
    const result = drawForThreshold(thresholdMl, { cards: set.cards, owned, rates: ratesForSet(set.id), rng: defaultRng })
    dispatch({
      type: 'createReward',
      reward: {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        day,
        kind: result.kind,
        thresholdMl,
        cardIds: result.cardIds,
        rarePack: result.rarePack,
        revealed: 0,
        seen: false,
      },
    })
  }, [state])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppState(): State {
  const state = useContext(StateContext)
  if (!state) throw new Error('useAppState doit être utilisé sous <StoreProvider>')
  return state
}

export function useDispatch(): Dispatch<Action> {
  const dispatch = useContext(DispatchContext)
  if (!dispatch) throw new Error('useDispatch doit être utilisé sous <StoreProvider>')
  return dispatch
}

/** Actions prêtes à l'emploi pour les écrans : elles fabriquent id et date, le reducer reste pur. */
export function useActions() {
  const dispatch = useDispatch()
  return useMemo(
    () => ({
      addIntake: (ml: number) => dispatch({ type: 'addIntake', id: crypto.randomUUID(), at: new Date().toISOString(), ml }),
      deleteIntake: (id: string) => dispatch({ type: 'deleteIntake', id }),
      revealCard: (rewardId: string) => dispatch({ type: 'revealCard', rewardId }),
      revealAll: (rewardId: string) => dispatch({ type: 'revealAll', rewardId }),
      closeReward: (rewardId: string) => dispatch({ type: 'closeReward', rewardId }),
      importState: (state: State) => dispatch({ type: 'importState', state }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [dispatch],
  )
}

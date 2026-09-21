import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../../components/Card/Card'
import { cardById, getSet } from '../../data/sets'
import { cx } from '../../lib/cx'
import { dayLabel, formatLiters, formatLitersShort, formatTime, lastDays, totalForDay } from '../../lib/day'
import { rewardLabel } from '../../lib/rewards'
import { selectDay, selectDays } from '../../state/selectors'
import { useAppState } from '../../state/store'
import styles from './HistoryScreen.module.css'

/** Hauteur du graphique = 1,5 fois l'objectif : l'objectif tombe aux deux tiers, le dépassement reste visible. */
const CHART_SCALE = 1.5

export function HistoryScreen() {
  const state = useAppState()
  const set = getSet(state.settings.setId)
  const goal = state.settings.goalMl
  const [openDay, setOpenDay] = useState<string | null>(null)

  const week = lastDays(7).map((day) => ({ day, totalMl: totalForDay(state.entries, day) }))
  const days = selectDays(state)

  return (
    <div className={styles.screen}>
      <header>
        <h1 className={styles.title}>Historique</h1>
        <p className={styles.subtitle}>7 derniers jours</p>
      </header>

      <section className={styles.chartCard} aria-label="Consommation des 7 derniers jours">
        <div className={styles.chart} style={{ '--goal-y': `${(1 / CHART_SCALE) * 100}%` } as React.CSSProperties}>
          <span className={styles.goalLabel}>{formatLitersShort(goal)}</span>
          {week.map(({ day, totalMl }) => {
            const height = Math.min(100, (totalMl / (goal * CHART_SCALE)) * 100)
            return (
              <div key={day} className={styles.col} title={`${dayLabel(day)} : ${formatLiters(totalMl)}`}>
                {totalMl > 0 && <span className={cx(styles.value, 'tabular')}>{(totalMl / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</span>}
                <div className={cx(styles.bar, totalMl === 0 && styles.barEmpty, totalMl >= goal && styles.barReached)} style={{ height: `${height}%` }} />
              </div>
            )
          })}
        </div>
        <div className={styles.axis}>
          {week.map(({ day }) => (
            <span key={day}>{weekdayShort(day)}</span>
          ))}
        </div>
      </section>

      {days.length === 0 ? (
        <p className={styles.empty}>Aucune prise enregistrée pour l'instant. Tout commence par un verre.</p>
      ) : (
        <ul className={styles.days}>
          {days.map((day) => {
            const summary = selectDay(state, day)
            const open = openDay === day
            const cards = summary.rewards.flatMap((r) => r.cardIds).map((id) => cardById(set, id))
            return (
              <li key={day} className={styles.day}>
                <button type="button" className={styles.dayHead} aria-expanded={open} onClick={() => setOpenDay(open ? null : day)}>
                  <span className={styles.dayLabel}>{dayLabel(day)}</span>
                  <span className={cx(styles.dayTotal, 'tabular')}>{formatLiters(summary.totalMl)}</span>
                  {summary.totalMl >= goal && (
                    <span className={styles.badge}>
                      <Check size={14} aria-hidden="true" /> Objectif
                    </span>
                  )}
                  <ChevronDown size={18} className={cx(styles.chevron, open && styles.chevronOpen)} aria-hidden="true" />
                </button>
                {cards.length > 0 && (
                  <ul className={styles.thumbs} aria-label="Cartes gagnées">
                    {cards.slice(0, 8).map((card, i) => (card ? <li key={`${card.id}-${i}`}>{<Card card={card} faceUp quality="low" />}</li> : null))}
                    {cards.length > 8 && <li className={styles.more}>+{cards.length - 8}</li>}
                  </ul>
                )}
                {open && (
                  <div className={styles.details}>
                    <ul className={styles.entries}>
                      {summary.entries.map((e) => (
                        <li key={e.id}>
                          <span className={cx(styles.time, 'tabular')}>{formatTime(e.at)}</span>
                          <span className="tabular">{formatLitersShort(e.ml)}</span>
                        </li>
                      ))}
                    </ul>
                    {summary.rewards.length > 0 && (
                      <ul className={styles.rewards}>
                        {summary.rewards.map((r) => (
                          <li key={r.id}>
                            <span className={cx(styles.time, 'tabular')}>{formatLitersShort(r.thresholdMl)}</span>
                            <span>
                              {rewardLabel(r.kind)}
                              {r.rarePack ? ' · paquet rare' : ''} · {r.cardIds.length} {r.cardIds.length > 1 ? 'cartes' : 'carte'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** « lun », « mar », « mer »... (la forme à une lettre confond mardi et mercredi). */
function weekdayShort(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
}

import { ChevronDown, Package, RectangleVertical, Settings, Sparkles, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Card } from '../../components/Card/Card'
import { CardViewer } from '../../components/CardViewer/CardViewer'
import { Gauge } from '../../components/Gauge/Gauge'
import { cardById, cardImageUrl, getSet, type CardData } from '../../data/sets'
import { cx } from '../../lib/cx'
import { formatLitersShort, formatTime } from '../../lib/day'
import { selectBackdropCard, selectDexStats, selectToday } from '../../state/selectors'
import { useActions, useAppState } from '../../state/store'
import { SettingsSheet } from './SettingsSheet'
import styles from './TodayScreen.module.css'

/** Prises affichées avant de déplier la liste complète. */
const VISIBLE_ENTRIES = 3

export function TodayScreen() {
  const state = useAppState()
  const actions = useActions()
  const today = selectToday(state)
  const set = getSet(state.settings.setId)
  const dex = selectDexStats(state, set)
  const complete = dex.owned >= dex.total
  const backdrop = selectBackdropCard(state, set)

  const [showOther, setShowOther] = useState(false)
  const [other, setOther] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [showAllEntries, setShowAllEntries] = useState(false)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const submitOther = (e: FormEvent) => {
    e.preventDefault()
    const ml = Number(other)
    if (!Number.isFinite(ml) || ml <= 0) return
    actions.addIntake(ml)
    setOther('')
    setShowOther(false)
  }

  const wonToday = today.rewards
    .flatMap((r) => r.cardIds)
    .map((id) => cardById(set, id))
    .filter((c): c is CardData => c !== undefined)
  const hiddenEntries = Math.max(0, today.entries.length - VISIBLE_ENTRIES)
  const entries = showAllEntries ? today.entries : today.entries.slice(0, VISIBLE_ENTRIES)

  return (
    <div className={styles.screen}>
      {/* Bloc « héros » : l'illustration de la dernière carte couvre exactement ce bloc,
          du haut de l'écran jusqu'au titre « Prises du jour », centrée sur la jauge. */}
      <div className={styles.hero}>
        {backdrop && (
          <div className={styles.backdrop} aria-hidden="true">
            <img key={backdrop.id} src={cardImageUrl(backdrop, 'high')} alt="" draggable={false} />
          </div>
        )}

      <header className={styles.header}>
        <div>
          <p className={styles.date}>{todayLabel()}</p>
          <h1 className={styles.title}>Aujourd'hui</h1>
        </div>
        <button type="button" className={styles.iconBtn} aria-label="Réglages" onClick={() => setSettingsOpen(true)}>
          <Settings size={22} aria-hidden="true" />
        </button>
      </header>

      <Gauge totalMl={today.totalMl} goalMl={state.settings.goalMl} />

      <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => actions.addIntake(state.settings.quickAddMl)}>
        + {formatLitersShort(state.settings.quickAddMl)}
      </button>

      {showOther ? (
        <form className={styles.otherForm} onSubmit={submitOther}>
          <label className={styles.otherLabel}>
            <span>Volume en mL</span>
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              min={10}
              max={5000}
              step={10}
              placeholder="330"
              value={other}
              onChange={(e) => setOther(e.target.value)}
              autoFocus
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={Number(other) <= 0}>
            Ajouter
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowOther(false)}>
            Annuler
          </button>
        </form>
      ) : (
        <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowOther(true)}>
          Autre volume
        </button>
      )}

      <p className={styles.next}>
        <NextIcon kind={complete ? 'complete' : today.next.kind} />
        <span>{nextLabel(complete, today.next.kind, today.next.remainingMl)}</span>
      </p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.h2}>Prises du jour</h2>
        {today.entries.length === 0 ? (
          <p className={styles.empty}>Rien pour l'instant. Un premier verre ?</p>
        ) : (
          <ul className={styles.list}>
            {entries.map((entry) => (
              <li key={entry.id} className={styles.row}>
                <span className={cx(styles.time, 'tabular')}>{formatTime(entry.at)}</span>
                <span className={cx(styles.vol, 'tabular')}>{formatLitersShort(entry.ml)}</span>
                {confirmId === entry.id ? (
                  <span className={styles.confirm}>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        actions.deleteIntake(entry.id)
                        setConfirmId(null)
                      }}
                    >
                      Supprimer
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmId(null)}>
                      Annuler
                    </button>
                  </span>
                ) : (
                  <button type="button" className={styles.iconBtn} aria-label="Supprimer cette prise" onClick={() => setConfirmId(entry.id)}>
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
            {hiddenEntries > 0 && (
              <li>
                <button type="button" className={styles.more} aria-expanded={showAllEntries} onClick={() => setShowAllEntries((v) => !v)}>
                  <span>{showAllEntries ? 'Réduire' : `Voir les ${hiddenEntries} autres prises`}</span>
                  <ChevronDown size={18} aria-hidden="true" className={cx(styles.chevron, showAllEntries && styles.chevronOpen)} />
                </button>
              </li>
            )}
          </ul>
        )}
      </section>

      {wonToday.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.h2}>
            Gagné aujourd'hui <span className={cx(styles.count, 'tabular')}>{wonToday.length}</span>
          </h2>
          <ul className={styles.won}>
            {wonToday.map((card, i) => (
              <li key={`${card.id}-${i}`}>
                <Card card={card} faceUp quality="low" onClick={() => setViewerIndex(i)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CardViewer cards={wonToday} index={viewerIndex} onChange={setViewerIndex} onClose={() => setViewerIndex(null)} />
    </div>
  )
}

function todayLabel(): string {
  const label = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function nextLabel(complete: boolean, kind: 'card' | 'booster' | 'rare-card', remainingMl: number): string {
  if (complete) return 'Collection complète : plus rien à gagner pour le moment'
  const remaining = formatLitersShort(remainingMl)
  if (kind === 'booster') return `Booster dans ${remaining}`
  if (kind === 'rare-card') return `Carte rare dans ${remaining}`
  return `Prochaine carte dans ${remaining}`
}

function NextIcon({ kind }: { kind: 'card' | 'booster' | 'rare-card' | 'complete' }) {
  if (kind === 'booster') return <Package size={18} aria-hidden="true" />
  if (kind === 'rare-card' || kind === 'complete') return <Sparkles size={18} aria-hidden="true" />
  return <RectangleVertical size={18} aria-hidden="true" />
}

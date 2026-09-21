import { ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../../components/Card/Card'
import { CardInfo } from '../../components/CardInfo/CardInfo'
import { RarityBadge } from '../../components/RarityBadge/RarityBadge'
import { Sheet } from '../../components/Sheet/Sheet'
import { cardImageUrl, getSet, type CardData } from '../../data/sets'
import { cx } from '../../lib/cx'
import type { Rarity } from '../../lib/rarity'
import { selectDexStats } from '../../state/selectors'
import { useActions, useAppState } from '../../state/store'
import styles from './DexScreen.module.css'

type Status = 'all' | 'owned' | 'missing'

const STATUS_LABELS: Record<Status, string> = { all: 'Toutes', owned: 'Possédées', missing: 'Manquantes' }

export function DexScreen() {
  const state = useAppState()
  const set = getSet(state.settings.setId)
  const stats = selectDexStats(state, set)
  const [status, setStatus] = useState<Status>('all')
  const [rarity, setRarity] = useState<Rarity | null>(null)
  const [selected, setSelected] = useState<CardData | null>(null)

  const cards = set.cards.filter((card) => {
    const owned = card.id in state.collection
    if (status === 'owned' && !owned) return false
    if (status === 'missing' && owned) return false
    if (rarity && card.rarity !== rarity) return false
    return true
  })

  const percent = stats.total === 0 ? 0 : (stats.owned / stats.total) * 100

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pokédex</h1>
        <p className={styles.setName}>{set.name}</p>
        <div className={styles.progress}>
          <div className={styles.progressBar} role="progressbar" aria-valuemin={0} aria-valuemax={stats.total} aria-valuenow={stats.owned}>
            <div className={styles.progressFill} style={{ width: `${percent}%` }} />
          </div>
          <span className={cx(styles.progressText, 'tabular')}>
            {stats.owned} / {stats.total}
          </span>
        </div>
      </header>

      <ul className={styles.rarities} aria-label="Filtrer par rareté">
        {stats.byRarity.map((r) => (
          <li key={r.rarity}>
            <button
              type="button"
              className={cx(styles.chip, rarity === r.rarity && styles.chipActive)}
              aria-pressed={rarity === r.rarity}
              onClick={() => setRarity(rarity === r.rarity ? null : r.rarity)}
            >
              <RarityBadge rarity={r.rarity} />
              <span className="tabular">
                {r.owned}/{r.total}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.segmented} role="group" aria-label="Filtrer par possession">
        {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
          <button key={s} type="button" className={cx(styles.segment, status === s && styles.segmentActive)} aria-pressed={status === s} onClick={() => setStatus(s)}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {cards.length === 0 ? (
        <p className={styles.empty}>Aucune carte ne correspond à ce filtre.</p>
      ) : (
        <ul className={styles.grid}>
          {cards.map((card) => {
            const owned = card.id in state.collection
            return (
              <li key={card.id}>
                <button
                  type="button"
                  className={cx(styles.slot, !owned && styles.slotMissing)}
                  onClick={() => setSelected(card)}
                  aria-label={owned ? `${card.name}, ${card.rarity}` : `Carte ${card.localId}, ${card.rarity}, pas encore obtenue`}
                >
                  {owned ? (
                    <img src={cardImageUrl(card, 'low')} alt="" loading="lazy" decoding="async" draggable={false} />
                  ) : (
                    <>
                      <span className={cx(styles.slotNumber, 'tabular')}>{card.localId}</span>
                      <RarityBadge rarity={card.rarity} className={styles.slotRarity} />
                    </>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={selected !== null} onClose={() => setSelected(null)} title={selected ? (selected.id in state.collection ? selected.name : `Carte ${selected.localId}`) : ''}>
        {selected && (
          <CardDetail
            card={selected}
            obtainedAt={state.collection[selected.id]?.at}
            isBackdrop={state.settings.backdropCardId === selected.id}
          />
        )}
      </Sheet>
    </div>
  )
}

function CardDetail({ card, obtainedAt, isBackdrop }: { card: CardData; obtainedAt: string | undefined; isBackdrop: boolean }) {
  const actions = useActions()
  return (
    <div className={styles.detail}>
      <div className={styles.detailCard}>
        {obtainedAt ? (
          <Card card={card} faceUp glow eager />
        ) : (
          <div className={styles.detailMissing}>
            <span className={cx(styles.detailNumber, 'tabular')}>{card.localId}</span>
            <span>Pas encore obtenue</span>
          </div>
        )}
      </div>
      <dl className={styles.detailFacts}>
        <div>
          <dt>Numéro</dt>
          <dd className="tabular">{card.localId}</dd>
        </div>
        <div>
          <dt>Rareté</dt>
          <dd>
            <RarityBadge rarity={card.rarity} withLabel />
          </dd>
        </div>
        {obtainedAt && (
          <div>
            <dt>Obtenue le</dt>
            <dd>{new Date(obtainedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
          </div>
        )}
      </dl>
      {obtainedAt && (
        <>
          <CardInfo card={card} />
          <button
            type="button"
            className="btn btn-secondary btn-block"
            aria-pressed={isBackdrop}
            onClick={() => actions.setBackdrop(isBackdrop ? null : card.id)}
          >
            <ImageIcon size={18} aria-hidden="true" />
            {isBackdrop ? "Retirer du fond d'écran" : "Mettre en fond d'écran"}
          </button>
        </>
      )}
    </div>
  )
}

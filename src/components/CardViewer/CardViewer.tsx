import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { useEffect, useRef, type PointerEvent } from 'react'
import { cardImageUrl, type CardData } from '../../data/sets'
import { cx } from '../../lib/cx'
import { useActions, useAppState } from '../../state/store'
import { Card } from '../Card/Card'
import { CardInfo } from '../CardInfo/CardInfo'
import { RarityBadge } from '../RarityBadge/RarityBadge'
import { Sheet } from '../Sheet/Sheet'
import styles from './CardViewer.module.css'

type Props = {
  /** La liste dans laquelle on navigue (cartes du jour, d'une journée, du Pokédex filtré). */
  cards: CardData[]
  /** Position ouverte, ou null si la fenêtre est fermée. */
  index: number | null
  onChange: (index: number) => void
  onClose: () => void
}

/** Glissement latéral minimal (px) pour changer de carte. */
const SWIPE_MIN = 48

/**
 * Fiche d'une carte dans une fenêtre centrée, avec navigation gauche / droite dans la liste
 * d'origine (flèches, glissement latéral, touches ←/→) sans quitter la fenêtre.
 */
export function CardViewer({ cards, index, onChange, onClose }: Props) {
  const state = useAppState()
  const actions = useActions()
  const card = index !== null ? cards[index] : undefined
  const count = cards.length
  const canPrev = index !== null && index > 0
  const canNext = index !== null && index < count - 1
  const areaRef = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number } | null>(null)

  const prev = () => {
    if (canPrev) onChange(index - 1)
  }
  const next = () => {
    if (canNext) onChange(index + 1)
  }

  // Touches ←/→ au clavier (ordinateur).
  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // À chaque changement de carte : retour en haut de la fenêtre et préchargement des voisines.
  useEffect(() => {
    if (index === null) return
    areaRef.current?.parentElement?.scrollTo({ top: 0 })
    for (const neighbour of [cards[index - 1], cards[index + 1]]) {
      if (neighbour && state.collection[neighbour.id]) {
        const img = new Image()
        img.src = cardImageUrl(neighbour, 'high')
      }
    }
  }, [index, cards, state.collection])

  const onPointerDown = (e: PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: PointerEvent) => {
    const s = start.current
    start.current = null
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next()
      else prev()
    }
  }

  const obtainedAt = card ? state.collection[card.id]?.at : undefined
  const isBackdrop = card !== undefined && state.settings.backdropCardId === card.id

  const footer = (
    <div className={styles.nav}>
      <button type="button" className={styles.arrow} onClick={prev} disabled={!canPrev} aria-label="Carte précédente">
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
      <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
        Fermer
      </button>
      <button type="button" className={styles.arrow} onClick={next} disabled={!canNext} aria-label="Carte suivante">
        <ChevronRight size={22} aria-hidden="true" />
      </button>
    </div>
  )

  return (
    <Sheet
      open={card !== undefined}
      onClose={onClose}
      title={card ? (obtainedAt ? card.name : `Carte ${card.localId}`) : ''}
      subtitle={count > 1 && index !== null ? `${index + 1} / ${count}` : undefined}
      footer={count > 1 ? footer : undefined}
    >
      {card && (
        <div
          ref={areaRef}
          key={card.id}
          className={styles.area}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            start.current = null
          }}
        >
          <div className={styles.card}>
            {obtainedAt ? (
              <Card card={card} faceUp glow eager />
            ) : (
              <div className={styles.missing}>
                <span className={cx(styles.number, 'tabular')}>{card.localId}</span>
                <span>Pas encore obtenue</span>
              </div>
            )}
          </div>
          <dl className={styles.facts}>
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
      )}
    </Sheet>
  )
}

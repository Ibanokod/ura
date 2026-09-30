import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cardById, cardImageUrl, getSet, setSymbolUrl, type CardData, type SetData } from '../../data/sets'
import { cx } from '../../lib/cx'
import { formatLitersShort } from '../../lib/day'
import { selectPendingReward } from '../../state/selectors'
import { useActions, useAppState } from '../../state/store'
import type { Reward } from '../../state/types'
import { Card } from '../Card/Card'
import { CardInfo } from '../CardInfo/CardInfo'
import { RarityBadge } from '../RarityBadge/RarityBadge'
import styles from './RevealOverlay.module.css'

/** Affiche la récompense en attente, s'il y en a une. Une clé par récompense = état local neuf. */
export function RevealOverlay() {
  const state = useAppState()
  const reward = selectPendingReward(state)
  if (!reward) return null
  return <Reveal key={reward.id} reward={reward} />
}

/**
 * Déroulé (comme dans le jeu) : le paquet s'ouvre, les cartes arrivent en pile face cachée,
 * un tap retourne toute la pile, puis chaque glissement sur le côté envoie la carte du
 * dessus et découvre la suivante. `reward.revealed` compte les cartes déjà glissées.
 */
function Reveal({ reward }: { reward: Reward }) {
  const state = useAppState()
  const actions = useActions()
  const set = getSet(state.settings.setId)
  const cards = useMemo(
    () => reward.cardIds.map((id) => cardById(set, id)).filter((c): c is CardData => c !== undefined),
    [reward.cardIds, set],
  )
  const total = cards.length
  const isBooster = reward.kind === 'booster'
  const remaining = total - reward.revealed

  const [opened, setOpened] = useState(!isBooster || reward.revealed > 0)
  const [flipped, setFlipped] = useState(reward.revealed > 0)

  // Précharger les images pour que le retournement montre les cartes tout de suite.
  useEffect(() => {
    for (const card of cards) {
      const img = new Image()
      img.src = cardImageUrl(card, 'high')
    }
  }, [cards])

  const title = isBooster ? (reward.rarePack ? 'Paquet rare !' : 'Booster !') : reward.kind === 'rare-card' ? 'Carte rare !' : 'Carte gagnée !'
  const subtitle = `Palier ${formatLitersShort(reward.thresholdMl)}`
  const close = () => actions.closeReward(reward.id)

  let content: React.ReactNode
  if (total === 0) {
    content = (
      <>
        <div className={styles.stage}>
          <div className={styles.stageInner}>
            <p className={styles.complete}>
              Collection complète ! Il n'y a plus de carte à gagner dans {set.name}. Une nouvelle extension arrivera dans les réglages.
            </p>
          </div>
        </div>
        <div className={styles.footer}>
          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={close}>
            Terminer
          </button>
        </div>
      </>
    )
  } else if (!opened) {
    content = <Pack set={set} onOpen={() => setOpened(true)} />
  } else if (reward.revealed >= total) {
    content = (
      <>
        <div className={styles.stage}>
          <div className={styles.stageInner}>
            <ul className={styles.summary}>
              {cards.map((card) => (
                <li key={card.id}>
                  <Card card={card} faceUp quality="low" eager />
                  <RarityBadge rarity={card.rarity} className={styles.summaryBadge} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={styles.footer}>
          <p className={styles.caption}>
            {total} {total > 1 ? 'nouvelles cartes' : 'nouvelle carte'} dans le Pokédex
          </p>
          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={close}>
            Terminer
          </button>
        </div>
      </>
    )
  } else {
    const current = cards[reward.revealed]
    content = (
      <>
        <div className={styles.stage}>
          <div className={styles.stageInner}>
            <Stack
              cards={cards}
              revealed={reward.revealed}
              flipped={flipped}
              swipeable={total > 1}
              onFlip={() => setFlipped(true)}
              onSwipe={() => actions.revealCard(reward.id)}
            />
            <div className={styles.caption} aria-live="polite">
              {flipped ? (
                <>
                  <strong>{current.name}</strong>
                  <RarityBadge rarity={current.rarity} withLabel />
                </>
              ) : (
                <span>{total > 1 ? 'Touche la pile pour retourner les cartes' : 'Touche la carte pour la retourner'}</span>
              )}
            </div>
            {total > 1 && (
              <ol className={styles.dots} aria-label={`Carte ${reward.revealed + 1} sur ${total}`}>
                {cards.map((card, i) => (
                  <li key={card.id} className={cx(styles.dot, i < reward.revealed && styles.dotDone, i === reward.revealed && styles.dotCurrent)} />
                ))}
              </ol>
            )}
            {flipped && (
              <div className={styles.details}>
                <CardInfo card={current} compact />
              </div>
            )}
          </div>
        </div>
        <div className={styles.footer}>
          {total === 1 && flipped && (
            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={close}>
              Ajouter au Pokédex
            </button>
          )}
          {total > 1 && flipped && (
            <p className={styles.hint}>
              Glisse la carte sur le côté pour voir la suivante · {remaining} {remaining > 1 ? 'restantes' : 'restante'}
            </p>
          )}
          {total > 1 && (
            <button type="button" className="btn btn-ghost btn-block" onClick={() => actions.revealAll(reward.id)}>
              Tout révéler
            </button>
          )}
        </div>
      </>
    )
  }

  return (
    <div className={cx(styles.overlay, reward.rarePack && styles.rare, reward.kind === 'rare-card' && styles.rare)} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>
        {content}
      </div>
    </div>
  )
}

/** Glissement minimal (px) pour envoyer la carte du dessus. */
const SWIPE_MIN = 70
/** Durée de la sortie de la carte (doit suivre la transition CSS `.stackLeaving`). */
const LEAVE_MS = 280

type StackProps = {
  cards: CardData[]
  /** Cartes déjà glissées : la carte du dessus est `cards[revealed]`. */
  revealed: number
  flipped: boolean
  swipeable: boolean
  onFlip: () => void
  onSwipe: () => void
}

/**
 * La pile : jusqu'à trois cartes visibles, légèrement décalées. Face cachée, un tap retourne
 * tout ; face visible, on glisse la carte du dessus (doigt, souris, ou touches ← →).
 */
function Stack({ cards, revealed, flipped, swipeable, onFlip, onSwipe }: StackProps) {
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null)
  const [leaving, setLeaving] = useState<-1 | 0 | 1>(0)
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const visible = cards.slice(revealed, revealed + 3)

  const finish = (direction: -1 | 1) => {
    if (leaving !== 0) return
    setDrag(null)
    setLeaving(direction)
    window.setTimeout(() => {
      setLeaving(0)
      onSwipe()
    }, LEAVE_MS)
  }

  useEffect(() => {
    if (!flipped || !swipeable) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'ArrowRight') finish(1)
      if (e.key === 'ArrowLeft') finish(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (leaving !== 0) return
    start.current = { x: e.clientX, y: e.clientY, moved: false }
    if (flipped && swipeable) e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current
    if (!s || !flipped || !swipeable) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) s.moved = true
    setDrag({ dx, dy })
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current
    start.current = null
    if (!s) return
    if (!flipped) {
      if (!s.moved) onFlip()
      return
    }
    if (!swipeable) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) >= SWIPE_MIN) finish(dx > 0 ? 1 : -1)
    else setDrag(null)
  }
  const onPointerCancel = () => {
    start.current = null
    setDrag(null)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!flipped && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onFlip()
    }
  }

  return (
    <div className={styles.stack}>
      {visible.map((card, i) => {
        const isTop = i === 0
        let transform = `translateY(${i * 10}px) scale(${1 - i * 0.04})`
        if (isTop && drag) transform = `translate(${drag.dx}px, ${drag.dy * 0.25}px) rotate(${drag.dx * 0.05}deg)`
        if (isTop && leaving !== 0) transform = `translateX(${leaving * 130}%) rotate(${leaving * 18}deg)`
        return (
          <div
            key={card.id}
            className={cx(styles.stackCard, isTop && drag && styles.stackDragging, isTop && leaving !== 0 && styles.stackLeaving)}
            style={{ transform, zIndex: 10 - i }}
            role={isTop ? 'button' : undefined}
            tabIndex={isTop ? 0 : undefined}
            aria-label={isTop ? (flipped ? `${card.name}, glisse pour voir la suivante` : 'Retourner les cartes') : undefined}
            onPointerDown={isTop ? onPointerDown : undefined}
            onPointerMove={isTop ? onPointerMove : undefined}
            onPointerUp={isTop ? onPointerUp : undefined}
            onPointerCancel={isTop ? onPointerCancel : undefined}
            onKeyDown={isTop ? onKeyDown : undefined}
          >
            <Card card={card} faceUp={flipped} glow={isTop && flipped} eager />
          </div>
        )
      })}
    </div>
  )
}

/** Le paquet fermé : touche ou glisse vers le haut pour le déchirer. Visuel maison. */
function Pack({ set, onOpen }: { set: SetData; onOpen: () => void }) {
  const [opening, setOpening] = useState(false)
  const startY = useRef<number | null>(null)
  const done = useRef(false)
  const symbol = setSymbolUrl(set)

  // Une seule sortie, quoi qu'il arrive : fin d'animation, ou filet de sécurité si
  // l'animation ne se joue pas (onglet en arrière-plan, mouvement réduit).
  const finish = () => {
    if (done.current) return
    done.current = true
    onOpen()
  }

  const begin = () => {
    if (opening) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }
    setOpening(true)
    window.setTimeout(finish, 1500)
  }

  return (
    <>
      <div className={styles.stage}>
        <div className={styles.stageInner}>
          <button
            type="button"
            className={cx(styles.pack, opening && styles.packOpening)}
            aria-label="Ouvrir le booster"
            onClick={begin}
            onPointerDown={(e) => {
              startY.current = e.clientY
            }}
            onPointerUp={(e) => {
              if (startY.current !== null && startY.current - e.clientY > 40) begin()
              startY.current = null
            }}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget && opening) finish()
            }}
          >
            <span className={styles.packTop} aria-hidden="true" />
            <span className={styles.packBody} aria-hidden="true">
              <img src={symbol} alt="" className={styles.packSymbol} draggable={false} width={64} height={64} />
              <span className={styles.packSeries}>Pokémon TCG Pocket</span>
              <span className={styles.packName}>{set.name}</span>
              <span className={styles.packBrand}>URA</span>
            </span>
          </button>
          <p className={styles.caption}>Touche ou glisse vers le haut pour ouvrir</p>
        </div>
      </div>
      <div className={styles.footer}>
        <button type="button" className="btn btn-primary btn-block btn-lg" onClick={begin}>
          Ouvrir le booster
        </button>
      </div>
    </>
  )
}

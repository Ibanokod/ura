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

/**
 * Bande scellée du paquet : bord cranté, stries de soudure, cadre dans la continuité du corps,
 * ligne de déchirure dorée. La variante « flap » (le morceau arraché) a le bas déchiqueté.
 */
function PackTopArt({ variant }: { variant: 'base' | 'flap' }) {
  const crimp: string[] = []
  for (let x = 0; x <= 630; x += 12) crimp.push(`${x} ${x % 24 === 0 ? 10 : 0}`)
  const ragged: string[] = []
  for (let x = 630; x >= 0; x -= 18) ragged.push(`${x} ${x % 36 === 0 ? 120 : 111}`)
  const outline = variant === 'flap' ? `M${crimp.join(' L')} L630 120 L${ragged.join(' L')} Z` : `M${crimp.join(' L')} L630 120 L0 120 Z`
  const gradientId = `ura-pack-top-${variant}`
  return (
    <svg className={styles.packArt} viewBox="0 0 630 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c63ad" />
          <stop offset="0.4" stopColor="#1c4d8f" />
          <stop offset="1" stopColor="#153a72" />
        </linearGradient>
        <clipPath id={`${gradientId}-clip`}>
          <path d={outline} />
        </clipPath>
      </defs>
      <path d={outline} fill={`url(#${gradientId})`} />
      <g clipPath={`url(#${gradientId}-clip)`}>
        {/* Stries de soudure à chaud, sous le bord cranté */}
        {[18, 26, 34, 42].map((y) => (
          <line key={y} x1="0" y1={y} x2="630" y2={y} stroke="#e9eef7" strokeOpacity="0.14" strokeWidth="2" />
        ))}
        {/* Cadre dans la continuité du corps */}
        <path d="M20 52V120M610 52V120" stroke="#3ec1f3" strokeOpacity="0.6" strokeWidth="3" />
        <path d="M34 60V120M596 60V120" stroke="#f2c14e" strokeOpacity="0.4" strokeWidth="1.5" />
        <path d="M20 52H610" stroke="#3ec1f3" strokeOpacity="0.35" strokeWidth="2" />
        {/* Ligne de déchirure */}
        <line x1="0" y1="106" x2="630" y2="106" stroke="#f2c14e" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="4 8" />
      </g>
      <path d={`M${crimp.join(' L')}`} fill="none" stroke="#7fd6f7" strokeOpacity="0.7" strokeWidth="2" />
    </svg>
  )
}

/** Corps du paquet : même vocabulaire que le dos de carte, le symbole de l'extension au centre. */
function PackBodyArt({ name, symbol }: { name: string; symbol: string }) {
  const dots = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2
    return { x: 315 + Math.cos(angle) * 190, y: 330 + Math.sin(angle) * 190 }
  })
  return (
    <svg className={styles.packArt} viewBox="0 0 630 850" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="ura-pack-bg" cx="50%" cy="40%" r="75%">
          <stop offset="0" stopColor="#1c4d8f" />
          <stop offset="0.55" stopColor="#0f2a57" />
          <stop offset="1" stopColor="#061127" />
        </radialGradient>
        <linearGradient id="ura-pack-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3ec1f3" />
          <stop offset="1" stopColor="#1b5fb3" />
        </linearGradient>
        <linearGradient id="ura-pack-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.3" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.09" />
          <stop offset="0.7" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <pattern id="ura-pack-waves" width="64" height="32" patternUnits="userSpaceOnUse">
          <path d="M0 16q16-14 32 0t32 0" fill="none" stroke="#3ec1f3" strokeOpacity="0.13" strokeWidth="2" />
        </pattern>
        <clipPath id="ura-pack-medal">
          <circle cx="315" cy="330" r="150" />
        </clipPath>
      </defs>

      <path d="M0 0H630V822a28 28 0 0 1-28 28H28a28 28 0 0 1-28-28Z" fill="url(#ura-pack-bg)" />
      <path d="M0 0H630V822a28 28 0 0 1-28 28H28a28 28 0 0 1-28-28Z" fill="url(#ura-pack-waves)" />

      <path d="M20 0V804a20 20 0 0 0 20 20h550a20 20 0 0 0 20-20V0" fill="none" stroke="#3ec1f3" strokeOpacity="0.6" strokeWidth="3" />
      <path d="M34 0V792a14 14 0 0 0 14 14h534a14 14 0 0 0 14-14V0" fill="none" stroke="#f2c14e" strokeOpacity="0.4" strokeWidth="1.5" />

      {[
        [572, 790, 3],
        [58, 790, 4],
      ].map(([x, y, q]) => (
        <g key={q} transform={`translate(${x} ${y}) rotate(${(q - 1) * 90})`}>
          <path d="M0 40 A40 40 0 0 1 40 0" fill="none" stroke="#f2c14e" strokeOpacity="0.55" strokeWidth="2" />
          <circle cx="0" cy="0" r="4" fill="#f2c14e" fillOpacity="0.7" />
        </g>
      ))}

      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={i % 5 === 0 ? 4 : 2.2} fill={i % 5 === 0 ? '#f2c14e' : '#3ec1f3'} fillOpacity="0.7" />
      ))}

      <circle cx="315" cy="330" r="170" fill="none" stroke="#3ec1f3" strokeOpacity="0.35" strokeWidth="2" />
      <circle cx="315" cy="330" r="158" fill="none" stroke="#f2c14e" strokeOpacity="0.55" strokeWidth="3" />
      <g clipPath="url(#ura-pack-medal)">
        <circle cx="315" cy="330" r="150" fill="#0a2148" />
        <path d="M160 346q39-28 78 0t78 0 78 0 78 0V500H160Z" fill="url(#ura-pack-water)" />
        <path d="M160 362q39-28 78 0t78 0 78 0 78 0V500H160Z" fill="#e9eef7" fillOpacity="0.08" />
      </g>
      <circle cx="315" cy="330" r="74" fill="#e9eef7" />
      <circle cx="315" cy="330" r="64" fill="#0b1220" />
      <image href={symbol} x="271" y="286" width="88" height="88" />

      <text x="315" y="560" textAnchor="middle" fontFamily="'Manrope Variable', system-ui, sans-serif" fontWeight="700" fontSize="18" letterSpacing="6" fill="#3ec1f3" fillOpacity="0.85">
        POKÉMON TCG POCKET
      </text>
      <text x="315" y="620" textAnchor="middle" fontFamily="'Manrope Variable', system-ui, sans-serif" fontWeight="800" fontSize="42" fill="#e9eef7">
        {name}
      </text>
      <text x="315" y="760" textAnchor="middle" fontFamily="'Manrope Variable', system-ui, sans-serif" fontWeight="800" fontSize="26" letterSpacing="12" fill="#e9eef7" fillOpacity="0.6">
        URA
      </text>

      <path d="M0 0H630V822a28 28 0 0 1-28 28H28a28 28 0 0 1-28-28Z" fill="url(#ura-pack-sheen)" />
    </svg>
  )
}

/** Part de la largeur du paquet à parcourir du doigt pour déchirer entièrement la bande. */
const TEAR_TRAVEL = 0.75
/** Progression à partir de laquelle la bande finit de s'arracher toute seule. */
const TEAR_DONE = 0.9

/**
 * Le paquet fermé, comme dans le jeu : on glisse le doigt le long du haut, la déchirure suit
 * le doigt, la bande se soulève, puis s'envole. Un tap ou le bouton jouent la même déchirure
 * automatiquement.
 */
function Pack({ set, onOpen }: { set: SetData; onOpen: () => void }) {
  const [tear, setTear] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [opening, setOpening] = useState(false)
  const tearRef = useRef(0)
  const phase = useRef<'idle' | 'auto' | 'open'>('idle')
  const start = useRef<{ x: number; width: number; moved: boolean } | null>(null)
  const done = useRef(false)
  const symbol = setSymbolUrl(set)

  const finish = () => {
    if (done.current) return
    done.current = true
    onOpen()
  }

  const progress = (value: number) => {
    tearRef.current = value
    setTear(value)
  }

  // La bande finit de s'arracher, le paquet s'efface, les cartes arrivent.
  const complete = () => {
    if (phase.current === 'open') return
    phase.current = 'open'
    progress(1)
    setDragging(false)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }
    setOpening(true)
    window.setTimeout(finish, 1100)
  }

  // Déchirure automatique (tap, bouton, clavier) : de la position actuelle jusqu'au bout.
  const autoTear = () => {
    if (phase.current !== 'idle') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      complete()
      return
    }
    phase.current = 'auto'
    const from = tearRef.current
    const t0 = performance.now()
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 550)
      progress(from + (1 - from) * (1 - Math.pow(1 - k, 3)))
      if (k < 1) requestAnimationFrame(step)
      else complete()
    }
    requestAnimationFrame(step)
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (phase.current !== 'idle') return
    start.current = { x: e.clientX, width: e.currentTarget.getBoundingClientRect().width, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current
    if (!s || phase.current !== 'idle') return
    const dx = Math.abs(e.clientX - s.x)
    if (dx > 4) s.moved = true
    const p = Math.min(1, dx / (s.width * TEAR_TRAVEL))
    if (p > tearRef.current) progress(p)
    if (p >= 1) {
      start.current = null
      complete()
    }
  }
  const onPointerUp = () => {
    const s = start.current
    start.current = null
    if (!s || phase.current !== 'idle') return
    setDragging(false)
    if (!s.moved) autoTear()
    else if (tearRef.current >= TEAR_DONE) complete()
    else progress(0)
  }
  const onPointerCancel = () => {
    start.current = null
    setDragging(false)
    if (phase.current === 'idle') progress(0)
  }

  const flapStyle = {
    clipPath: `inset(0 ${(1 - tear) * 100}% 0 0)`,
    transform: `translateY(${-8 * tear}px) rotate(${-4 * tear}deg)`,
  }
  const baseStyle = { clipPath: `inset(0 0 0 ${tear * 100}%)` }

  return (
    <>
      <div className={styles.stage}>
        <div className={styles.stageInner}>
          <div
            className={cx(styles.pack, dragging && styles.packDragging, opening && styles.packOpening)}
            role="button"
            tabIndex={0}
            aria-label="Déchirer le booster"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                autoTear()
              }
            }}
          >
            <span className={styles.packTop} aria-hidden="true">
              <span className={cx(styles.packLayer, styles.packBase)} style={baseStyle}>
                <PackTopArt variant="base" />
              </span>
              <span className={cx(styles.packLayer, styles.packFlap)} style={flapStyle}>
                <PackTopArt variant="flap" />
              </span>
              <span className={cx(styles.tearCursor, dragging && tear > 0 && tear < 1 && styles.tearCursorOn)} style={{ left: `${tear * 100}%` }} />
            </span>
            <span className={styles.packBody} aria-hidden="true">
              <PackBodyArt name={set.name} symbol={symbol} />
            </span>
          </div>
          <p className={styles.caption}>Glisse ton doigt le long du haut pour déchirer le paquet</p>
        </div>
      </div>
      <div className={styles.footer}>
        <button type="button" className="btn btn-primary btn-block btn-lg" onClick={autoTear}>
          Ouvrir le booster
        </button>
      </div>
    </>
  )
}

import { useState } from 'react'
import { cardImageUrl, type CardData, type ImageQuality } from '../../data/sets'
import { cx } from '../../lib/cx'
import { rarityFamily, raritySymbol } from '../../lib/rarity'
import styles from './Card.module.css'

type Props = {
  card: CardData
  faceUp: boolean
  /** Halo de la couleur de la rareté (révélation, détail). */
  glow?: boolean
  quality?: ImageQuality
  /** Charger l'image tout de suite (révélation) plutôt qu'à l'apparition (grilles). */
  eager?: boolean
  onClick?: () => void
  className?: string
}

const GLOW: Record<ReturnType<typeof rarityFamily>, string> = {
  diamond: styles.glowDiamond,
  star: styles.glowStar,
  shiny: styles.glowShiny,
  crown: styles.glowCrown,
}

/** Une carte à deux faces : dos maison, recto image TCGdex, retournement 3D en CSS. */
export function Card({ card, faceUp, glow = false, quality = 'high', eager = false, onClick, className }: Props) {
  // Si la grande image manque sur le CDN, on retombe sur la petite ; si elle manque aussi,
  // on affiche le nom et la rareté : la carte reste lisible hors ligne.
  const [effectiveQuality, setEffectiveQuality] = useState<ImageQuality>(quality)
  const [failed, setFailed] = useState(false)
  const family = rarityFamily(card.rarity)
  const sweep = glow && faceUp && family !== 'diamond'
  const onError = () => {
    if (effectiveQuality === 'high') setEffectiveQuality('low')
    else setFailed(true)
  }

  const inner = (
    <div className={cx(styles.inner, faceUp && styles.faceUp)}>
      <div className={cx(styles.face, styles.front, sweep && styles.sweep)}>
        {failed ? (
          <div className={styles.fallback}>
            <span>{card.name}</span>
            <span>{raritySymbol(card.rarity)}</span>
          </div>
        ) : (
          <img
            src={cardImageUrl(card, effectiveQuality)}
            alt={card.name}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            onError={onError}
          />
        )}
      </div>
      <div className={cx(styles.face, styles.back)} aria-hidden="true">
        <CardBack />
      </div>
    </div>
  )

  const classes = cx(styles.card, glow && faceUp && GLOW[family], className)

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} aria-label={faceUp ? card.name : 'Retourner la carte'}>
        {inner}
      </button>
    )
  }
  return <div className={classes}>{inner}</div>
}

/** Dos de carte dessiné maison : goutte d'eau, motif discret. Aucun asset du jeu. */
function CardBack() {
  return (
    <div className={styles.backArt}>
      <svg viewBox="0 0 64 64" width="42%" aria-hidden="true">
        <path d="M32 6c9 12 17 22 17 32a17 17 0 0 1-34 0C15 28 23 18 32 6z" fill="var(--water)" />
        <path d="M23 40a9 9 0 0 0 9 9" fill="none" stroke="rgba(233,238,247,.8)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className={styles.backWord}>URA</span>
    </div>
  )
}

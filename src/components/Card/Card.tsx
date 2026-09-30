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

/**
 * Dos de carte : illustration originale (aucun asset du jeu, dont le dos officiel, protégé).
 * Un médaillon partagé par une vague, la goutte au centre, un cadre double bleu et or, un
 * motif de vagues et un reflet diagonal. Dessiné en SVG pour rester net à toute taille.
 */
function CardBack() {
  const dots = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2
    return { x: 315 + Math.cos(angle) * 206, y: 420 + Math.sin(angle) * 206 }
  })
  return (
    <svg className={styles.backArt} viewBox="0 0 630 880" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="ura-back-bg" cx="50%" cy="46%" r="72%">
          <stop offset="0" stopColor="#1c4d8f" />
          <stop offset="0.55" stopColor="#0f2a57" />
          <stop offset="1" stopColor="#061127" />
        </radialGradient>
        <linearGradient id="ura-back-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.3" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.09" />
          <stop offset="0.7" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ura-back-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3ec1f3" />
          <stop offset="1" stopColor="#1b5fb3" />
        </linearGradient>
        <pattern id="ura-back-waves" width="64" height="32" patternUnits="userSpaceOnUse">
          <path d="M0 16q16-14 32 0t32 0" fill="none" stroke="#3ec1f3" strokeOpacity="0.13" strokeWidth="2" />
        </pattern>
        <clipPath id="ura-back-medal">
          <circle cx="315" cy="420" r="168" />
        </clipPath>
      </defs>

      <rect width="630" height="880" rx="30" fill="url(#ura-back-bg)" />
      <rect width="630" height="880" rx="30" fill="url(#ura-back-waves)" />

      {/* Cadre double : bleu eau à l'extérieur, or fin à l'intérieur */}
      <rect x="20" y="20" width="590" height="840" rx="22" fill="none" stroke="#3ec1f3" strokeOpacity="0.6" strokeWidth="3" />
      <rect x="34" y="34" width="562" height="812" rx="16" fill="none" stroke="#f2c14e" strokeOpacity="0.4" strokeWidth="1.5" />

      {/* Ornements d'angle */}
      {[
        [58, 58, 1],
        [572, 58, 2],
        [572, 822, 3],
        [58, 822, 4],
      ].map(([x, y, q]) => (
        <g key={q} transform={`translate(${x} ${y}) rotate(${(q - 1) * 90})`}>
          <path d="M0 40 A40 40 0 0 1 40 0" fill="none" stroke="#f2c14e" strokeOpacity="0.55" strokeWidth="2" />
          <circle cx="0" cy="0" r="4" fill="#f2c14e" fillOpacity="0.7" />
        </g>
      ))}

      {/* Couronne de points autour du médaillon */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={i % 6 === 0 ? 4 : 2.2} fill={i % 6 === 0 ? '#f2c14e' : '#3ec1f3'} fillOpacity="0.7" />
      ))}

      {/* Médaillon : ciel de nuit en haut, eau en bas, séparés par une vague */}
      <circle cx="315" cy="420" r="188" fill="none" stroke="#3ec1f3" strokeOpacity="0.35" strokeWidth="2" />
      <circle cx="315" cy="420" r="176" fill="none" stroke="#f2c14e" strokeOpacity="0.55" strokeWidth="3" />
      <g clipPath="url(#ura-back-medal)">
        <circle cx="315" cy="420" r="168" fill="#0a2148" />
        <path d="M140 438q44-30 88 0t88 0 88 0 88 0V600H140Z" fill="url(#ura-back-water)" />
        <path d="M140 456q44-30 88 0t88 0 88 0 88 0V600H140Z" fill="#e9eef7" fillOpacity="0.08" />
      </g>

      {/* Pastille centrale et goutte */}
      <circle cx="315" cy="420" r="66" fill="#e9eef7" />
      <circle cx="315" cy="420" r="55" fill="#0b1220" />
      <path d="M315 382c12 16 22 29 22 42a22 22 0 0 1-44 0c0-13 10-26 22-42z" fill="#3ec1f3" />
      <path d="M303 424a12 12 0 0 0 12 12" fill="none" stroke="#e9eef7" strokeOpacity="0.85" strokeWidth="4" strokeLinecap="round" />

      <text x="315" y="748" textAnchor="middle" fontFamily="'Manrope Variable', system-ui, sans-serif" fontWeight="800" fontSize="46" letterSpacing="16" fill="#e9eef7" fillOpacity="0.9">
        URA
      </text>
      <text x="315" y="786" textAnchor="middle" fontFamily="'Manrope Variable', system-ui, sans-serif" fontWeight="700" fontSize="17" letterSpacing="7" fill="#3ec1f3" fillOpacity="0.85">
        TRAQUEUR D'EAU
      </text>

      <rect width="630" height="880" rx="30" fill="url(#ura-back-sheen)" />
    </svg>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { cardById, cardImageUrl, getSet, setSymbolUrl, type CardData, type SetData } from '../../data/sets'
import { cx } from '../../lib/cx'
import { formatLitersShort } from '../../lib/day'
import { selectPendingReward } from '../../state/selectors'
import { useActions, useAppState } from '../../state/store'
import type { Reward } from '../../state/types'
import { Card } from '../Card/Card'
import { RarityBadge } from '../RarityBadge/RarityBadge'
import styles from './RevealOverlay.module.css'

/** Affiche la récompense en attente, s'il y en a une. Une clé par récompense = état local neuf. */
export function RevealOverlay() {
  const state = useAppState()
  const reward = selectPendingReward(state)
  if (!reward) return null
  return <Reveal key={reward.id} reward={reward} />
}

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

  // Étape locale : paquet encore fermé ? carte en cours ? bilan ?
  const [opened, setOpened] = useState(!isBooster || reward.revealed > 0)
  const [index, setIndex] = useState(Math.min(reward.revealed, total))

  // Précharger les images pour que le retournement montre la carte tout de suite.
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
          <p className={styles.complete}>
            Collection complète ! Il n'y a plus de carte à gagner dans {set.name}. Une nouvelle extension arrivera dans les réglages.
          </p>
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
  } else if (index >= total) {
    content = (
      <>
        <div className={styles.stage}>
          <ul className={styles.summary}>
            {cards.map((card) => (
              <li key={card.id}>
                <Card card={card} faceUp quality="low" eager />
                <RarityBadge rarity={card.rarity} className={styles.summaryBadge} />
              </li>
            ))}
          </ul>
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
    const current = cards[index]
    const faceUp = index < reward.revealed
    const last = index === total - 1
    const onTap = () => {
      if (!faceUp) actions.revealCard(reward.id)
      else if (total > 1) setIndex((i) => i + 1)
    }
    content = (
      <>
        <div className={styles.stage}>
          <div className={styles.cardHolder}>
            <Card card={current} faceUp={faceUp} glow eager onClick={onTap} />
          </div>
          <div className={styles.caption} aria-live="polite">
            {faceUp ? (
              <>
                <strong>{current.name}</strong>
                <RarityBadge rarity={current.rarity} withLabel />
              </>
            ) : (
              <span>Touche la carte pour la retourner</span>
            )}
          </div>
          {total > 1 && (
            <ol className={styles.dots} aria-label={`Carte ${index + 1} sur ${total}`}>
              {cards.map((card, i) => (
                <li key={card.id} className={cx(styles.dot, i < reward.revealed && styles.dotDone, i === index && styles.dotCurrent)} />
              ))}
            </ol>
          )}
        </div>
        <div className={styles.footer}>
          {total === 1 && faceUp && (
            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={close}>
              Ajouter au Pokédex
            </button>
          )}
          {total > 1 && faceUp && (
            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => setIndex((i) => i + 1)}>
              {last ? 'Voir le bilan' : 'Carte suivante'}
            </button>
          )}
          {total > 1 && reward.revealed < total && (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => {
                actions.revealAll(reward.id)
                setIndex(total)
              }}
            >
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
      <div className={styles.footer}>
        <button type="button" className="btn btn-primary btn-block btn-lg" onClick={begin}>
          Ouvrir le booster
        </button>
      </div>
    </>
  )
}

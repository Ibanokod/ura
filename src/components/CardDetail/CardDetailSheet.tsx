import { ImageIcon } from 'lucide-react'
import type { CardData } from '../../data/sets'
import { cx } from '../../lib/cx'
import { useActions, useAppState } from '../../state/store'
import { Card } from '../Card/Card'
import { CardInfo } from '../CardInfo/CardInfo'
import { RarityBadge } from '../RarityBadge/RarityBadge'
import { Sheet } from '../Sheet/Sheet'
import styles from './CardDetailSheet.module.css'

type Props = { card: CardData | null; onClose: () => void }

/**
 * Fiche complète d'une carte dans une feuille. Règle de l'appli : toute carte visible
 * (Pokédex, gagné aujourd'hui, historique, accueil) s'ouvre ici d'un tap.
 */
export function CardDetailSheet({ card, onClose }: Props) {
  const state = useAppState()
  const actions = useActions()
  const obtainedAt = card ? state.collection[card.id]?.at : undefined
  const isBackdrop = card !== null && state.settings.backdropCardId === card.id

  return (
    <Sheet open={card !== null} onClose={onClose} title={card ? (obtainedAt ? card.name : `Carte ${card.localId}`) : ''}>
      {card && (
        <div className={styles.detail}>
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

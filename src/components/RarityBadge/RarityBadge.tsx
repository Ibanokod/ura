import { cx } from '../../lib/cx'
import { type Rarity, rarityFamily, raritySymbol } from '../../lib/rarity'
import styles from './RarityBadge.module.css'

type Props = { rarity: Rarity; withLabel?: boolean; className?: string }

/** Symbole de rareté (◊◊, ☆, ♛...) dans la couleur de sa famille, avec ou sans libellé. */
export function RarityBadge({ rarity, withLabel = false, className }: Props) {
  return (
    <span className={cx(styles.badge, styles[rarityFamily(rarity)], className)} title={rarity}>
      <span className={styles.symbol} aria-hidden={withLabel ? 'true' : undefined}>
        {raritySymbol(rarity)}
      </span>
      {withLabel ? <span className={styles.label}>{rarity}</span> : <span className="visually-hidden">{rarity}</span>}
    </span>
  )
}

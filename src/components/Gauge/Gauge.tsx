import { cx } from '../../lib/cx'
import { formatLiters, formatLitersShort } from '../../lib/day'
import { STEP_ML } from '../../lib/rewards'
import styles from './Gauge.module.css'

type Props = { totalMl: number; goalMl: number }

/** Jauge d'eau : un cylindre qui se remplit jusqu'à l'objectif, avec les paliers de récompense. */
export function Gauge({ totalMl, goalMl }: Props) {
  const ratio = Math.min(1, totalMl / goalMl)
  const reached = totalMl >= goalMl
  const over = Math.max(0, totalMl - goalMl)

  // Paliers intermédiaires (0,5 L, 1 L) : de petits traits sur le cylindre.
  const ticks: number[] = []
  for (let ml = STEP_ML; ml < goalMl; ml += STEP_ML) ticks.push(ml)

  return (
    <div className={styles.wrap}>
      <div className={styles.cylinder} role="img" aria-label={`${formatLiters(totalMl)} sur ${formatLitersShort(goalMl)}`}>
        <div className={cx(styles.fill, reached && styles.reached)} style={{ height: `${ratio * 100}%` }} />
        {ticks.map((ml) => (
          <div key={ml} className={styles.tick} style={{ bottom: `${(ml / goalMl) * 100}%` }}>
            <span>{formatLitersShort(ml)}</span>
          </div>
        ))}
      </div>
      <div className={styles.numbers}>
        <div className={cx(styles.total, 'tabular')}>{formatLiters(totalMl)}</div>
        <div className={cx(styles.sub, reached && styles.subReached)}>
          {reached ? 'Objectif atteint' : `sur ${formatLitersShort(goalMl)}`}
        </div>
        {over > 0 && <div className={cx(styles.over, 'tabular')}>+ {formatLitersShort(over)}</div>}
      </div>
    </div>
  )
}

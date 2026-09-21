import type { CardData } from '../../data/sets'
import { cx } from '../../lib/cx'
import { type Energy, energyByName, parseEffect } from '../../lib/energy'
import styles from './CardInfo.module.css'

type Props = { card: CardData; compact?: boolean }

/** Fiche détaillée d'une carte, comme dans le jeu : PV, type, stade, talents, attaques, faiblesse, retraite. */
export function CardInfo({ card, compact = false }: Props) {
  return (
    <section className={cx(styles.info, compact && styles.compact)} aria-label={`Détails de ${card.name}`}>
      {card.category === 'Dresseur' ? <TrainerInfo card={card} /> : <PokemonInfo card={card} />}
      <footer className={styles.footer}>
        {card.description && <p className={styles.description}>{card.description}</p>}
        <p className={styles.meta}>
          {card.illustrator && <span>Illustration : {card.illustrator}</span>}
          {card.boosters.length > 0 && <span>Paquet{card.boosters.length > 1 ? 's' : ''} : {card.boosters.join(', ')}</span>}
        </p>
      </footer>
    </section>
  )
}

function PokemonInfo({ card }: { card: CardData }) {
  const stage = card.stage ?? 'Base'
  return (
    <>
      <header className={styles.head}>
        <div className={styles.stage}>
          <span>{stage}</span>
          {card.evolveFrom && <span className={styles.muted}>évolue de {card.evolveFrom}</span>}
        </div>
        <div className={styles.hp}>
          <span className={cx(styles.hpValue, 'tabular')}>{card.hp}</span>
          <span className={styles.hpLabel}>PV</span>
          {card.types.map((t) => (
            <EnergyDot key={t} energy={energyByName(t)} size="md" />
          ))}
        </div>
      </header>

      {card.abilities.map((ability) => (
        <div key={ability.name} className={styles.ability}>
          <div className={styles.row}>
            <span className={styles.abilityTag}>{ability.type}</span>
            <span className={styles.name}>{ability.name}</span>
          </div>
          <p className={styles.effect}>
            <Effect text={ability.effect} />
          </p>
        </div>
      ))}

      {card.attacks.map((attack) => (
        <div key={attack.name} className={styles.attack}>
          <div className={styles.row}>
            <span className={styles.cost} aria-label={`Coût : ${attack.cost.join(', ') || 'aucun'}`}>
              {attack.cost.map((c, i) => (
                <EnergyDot key={`${c}-${i}`} energy={energyByName(c)} />
              ))}
            </span>
            <span className={styles.name}>{attack.name}</span>
            {attack.damage && <span className={cx(styles.damage, 'tabular')}>{attack.damage}</span>}
          </div>
          {attack.effect && (
            <p className={styles.effect}>
              <Effect text={attack.effect} />
            </p>
          )}
        </div>
      ))}

      <div className={styles.stats}>
        <div>
          <span className={styles.statLabel}>Faiblesse</span>
          {card.weaknesses.length === 0 ? (
            <span className={styles.muted}>aucune</span>
          ) : (
            card.weaknesses.map((w) => (
              <span key={w.type} className={styles.statValue}>
                <EnergyDot energy={energyByName(w.type)} /> {w.value}
              </span>
            ))
          )}
        </div>
        <div>
          <span className={styles.statLabel}>Retraite</span>
          <span className={styles.statValue} aria-label={`${card.retreat ?? 0} énergie(s)`}>
            {card.retreat === null || card.retreat === 0 ? (
              <span className={styles.muted}>gratuite</span>
            ) : (
              Array.from({ length: card.retreat }, (_, i) => <EnergyDot key={i} energy={energyByName('Incolore')} />)
            )}
          </span>
        </div>
      </div>
    </>
  )
}

function TrainerInfo({ card }: { card: CardData }) {
  return (
    <>
      <header className={styles.head}>
        <div className={styles.stage}>
          <span>Dresseur</span>
          {card.trainerType && <span className={styles.muted}>{card.trainerType}</span>}
        </div>
      </header>
      {card.effect && (
        <p className={cx(styles.effect, styles.trainerEffect)}>
          <Effect text={card.effect} />
        </p>
      )}
    </>
  )
}

/** Texte d'effet avec les énergies {G}, {R}... rendues en pastilles. */
function Effect({ text }: { text: string }) {
  return (
    <>
      {parseEffect(text).map((part, i) =>
        part.kind === 'text' ? <span key={i}>{part.text}</span> : <EnergyDot key={i} energy={part.energy} inline />,
      )}
    </>
  )
}

function EnergyDot({ energy, size = 'sm', inline = false }: { energy: Energy; size?: 'sm' | 'md'; inline?: boolean }) {
  return (
    <span
      className={cx(styles.energy, size === 'md' && styles.energyMd, inline && styles.energyInline)}
      style={{ background: `var(${energy.cssVar})` }}
      title={energy.name}
    >
      <span className="visually-hidden">{energy.name}</span>
    </span>
  )
}

import { describe, expect, it } from 'vitest'
import { dueThresholds, kindForThreshold, nextReward, reachedThresholds } from './rewards'

describe('seuils de récompense', () => {
  it('compte les seuils franchis par tranche de 500 mL', () => {
    expect(reachedThresholds(0)).toBe(0)
    expect(reachedThresholds(490)).toBe(0)
    expect(reachedThresholds(500)).toBe(1)
    expect(reachedThresholds(1499)).toBe(2)
    expect(reachedThresholds(1500)).toBe(3)
    expect(reachedThresholds(2000)).toBe(4)
  })

  it('donne une carte à 500 et 1000, un booster à 1500, des cartes rares au-delà', () => {
    expect(kindForThreshold(500)).toBe('card')
    expect(kindForThreshold(1000)).toBe('card')
    expect(kindForThreshold(1500)).toBe('booster')
    expect(kindForThreshold(2000)).toBe('rare-card')
    expect(kindForThreshold(3500)).toBe('rare-card')
  })

  it('ne doit rien sous 500 mL', () => {
    expect(dueThresholds(490, 0)).toEqual([])
  })

  it('doit une carte à 500 mL puis plus rien une fois créée', () => {
    expect(dueThresholds(500, 0)).toEqual([500])
    expect(dueThresholds(500, 1)).toEqual([])
  })

  it('doit deux récompenses quand 1 L arrive d’un coup', () => {
    expect(dueThresholds(1000, 0)).toEqual([500, 1000])
  })

  it('doit le booster à 1,5 L après deux cartes', () => {
    expect(dueThresholds(1500, 2)).toEqual([1500])
  })

  it('ne redonne rien si une prise est supprimée puis remise', () => {
    // 2 L atteints, 4 récompenses créées ; on retombe à 1,8 L puis on revient à 2 L.
    expect(dueThresholds(1800, 4)).toEqual([])
    expect(dueThresholds(2000, 4)).toEqual([])
    // Il faut vraiment dépasser le seuil suivant pour gagner à nouveau.
    expect(dueThresholds(2500, 4)).toEqual([2500])
  })
})

describe('prochaine récompense', () => {
  it('annonce la carte suivante et ce qu’il reste à boire', () => {
    expect(nextReward(300, 0)).toEqual({ thresholdMl: 500, remainingMl: 200, kind: 'card' })
    expect(nextReward(1200, 2)).toEqual({ thresholdMl: 1500, remainingMl: 300, kind: 'booster' })
    expect(nextReward(1500, 3)).toEqual({ thresholdMl: 2000, remainingMl: 500, kind: 'rare-card' })
  })

  it('tient compte des récompenses déjà créées même si le total est redescendu', () => {
    expect(nextReward(1800, 4)).toEqual({ thresholdMl: 2500, remainingMl: 700, kind: 'rare-card' })
  })
})

// Règles de récompense (PRODUCT.md) : un seuil tous les 500 mL ; à 1 500 mL un booster
// remplace la carte ; au-delà, des cartes garanties rares. Ces fonctions ne connaissent ni
// l'écran ni le stockage : elles reçoivent des nombres et rendent des nombres.

export const STEP_ML = 500
export const BOOSTER_ML = 1500

export type RewardKind = 'card' | 'booster' | 'rare-card'

export function kindForThreshold(thresholdMl: number): RewardKind {
  if (thresholdMl === BOOSTER_ML) return 'booster'
  if (thresholdMl > BOOSTER_ML) return 'rare-card'
  return 'card'
}

/** Nombre de seuils franchis par un total (0,49 L -> 0 ; 0,5 L -> 1 ; 1,5 L -> 3). */
export function reachedThresholds(totalMl: number): number {
  return Math.floor(totalMl / STEP_ML)
}

/**
 * Seuils à récompenser maintenant, dans l'ordre. `alreadyCreated` = récompenses déjà
 * créées ce jour : c'est lui qui empêche de récompenser deux fois le même seuil, même si
 * une prise a été supprimée puis remise.
 */
export function dueThresholds(totalMl: number, alreadyCreated: number): number[] {
  const reached = reachedThresholds(totalMl)
  const due: number[] = []
  for (let k = alreadyCreated + 1; k <= reached; k++) due.push(k * STEP_ML)
  return due
}

export type NextReward = { thresholdMl: number; remainingMl: number; kind: RewardKind }

/** Prochaine récompense à venir et ce qu'il reste à boire pour l'atteindre. */
export function nextReward(totalMl: number, alreadyCreated: number): NextReward {
  const k = Math.max(alreadyCreated, reachedThresholds(totalMl)) + 1
  const thresholdMl = k * STEP_ML
  return { thresholdMl, remainingMl: Math.max(0, thresholdMl - totalMl), kind: kindForThreshold(thresholdMl) }
}

export function rewardLabel(kind: RewardKind): string {
  switch (kind) {
    case 'card':
      return 'Carte'
    case 'booster':
      return 'Booster'
    case 'rare-card':
      return 'Carte rare'
  }
}

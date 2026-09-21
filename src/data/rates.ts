// Tables de probabilités des boosters, en pourcentages (chiffres publiés par le jeu).
// Une « table » associe une rareté à son poids ; les poids sont normalisés au tirage,
// une somme à 99,99 ne pose donc aucun problème.

import type { Rarity } from '../lib/rarity'

export type RarityTable = Partial<Record<Rarity, number>>

export type RateSet = {
  /** 4e carte d'un booster (sert aussi à la carte seule des 0,5 L et 1 L). */
  slot4: RarityTable
  /** 5e carte d'un booster. */
  slot5: RarityTable
  /** Chaque carte d'un paquet rare (sert aussi aux cartes garanties au-delà de 1,5 L). */
  rarePack: RarityTable
  /** Probabilité qu'un booster soit un paquet rare, en %. */
  rarePackChance: number
}

/** Extensions sans rareté chromatique : Puissance Génétique et les suivantes jusqu'à Lumière Triomphale. */
export const RATES_CLASSIC: RateSet = {
  slot4: {
    'Deux Diamants': 90,
    'Trois Diamants': 5,
    'Quatre Diamants': 1.666,
    'Une Étoile': 2.572,
    'Deux Étoiles': 0.5,
    'Trois Étoiles': 0.222,
    Couronne: 0.04,
  },
  slot5: {
    'Deux Diamants': 60,
    'Trois Diamants': 20,
    'Quatre Diamants': 6.664,
    'Une Étoile': 10.288,
    'Deux Étoiles': 2,
    'Trois Étoiles': 0.888,
    Couronne: 0.16,
  },
  rarePack: {
    'Une Étoile': 40,
    'Deux Étoiles': 50,
    'Trois Étoiles': 5,
    Couronne: 5,
  },
  rarePackChance: 0.05,
}

/** Extensions avec chromatiques ✧ (à partir de Réjouissances Rayonnantes). Prêt pour plus tard. */
export const RATES_WITH_SHINY: RateSet = {
  slot4: {
    'Deux Diamants': 89,
    'Trois Diamants': 4.952,
    'Quatre Diamants': 1.666,
    'Une Étoile': 2.572,
    'Deux Étoiles': 0.5,
    'Trois Étoiles': 0.222,
    'Un Chromatique': 0.714,
    'Deux Chromatiques': 0.333,
    Couronne: 0.04,
  },
  slot5: {
    'Deux Diamants': 56.756,
    'Trois Diamants': 19.041,
    'Quatre Diamants': 6.664,
    'Une Étoile': 10.288,
    'Deux Étoiles': 2,
    'Trois Étoiles': 0.888,
    'Un Chromatique': 2.857,
    'Deux Chromatiques': 1.333,
    Couronne: 0.16,
  },
  rarePack: {
    'Une Étoile': 38,
    'Deux Étoiles': 47,
    'Trois Étoiles': 5,
    'Un Chromatique': 5,
    'Deux Chromatiques': 2,
    Couronne: 3,
  },
  rarePackChance: 0.05,
}

const SETS_WITHOUT_SHINY = new Set(['A1', 'A1a', 'A2', 'A2a'])

export function ratesForSet(setId: string): RateSet {
  return SETS_WITHOUT_SHINY.has(setId) ? RATES_CLASSIC : RATES_WITH_SHINY
}

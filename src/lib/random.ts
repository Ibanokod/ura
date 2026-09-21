// Hasard injectable : l'appli passe Math.random, les tests passent un générateur à graine
// pour obtenir toujours la même suite de nombres (résultats reproductibles).

/** Renvoie un nombre dans [0, 1). */
export type Rng = () => number

export const defaultRng: Rng = () => Math.random()

/** Générateur déterministe (algorithme mulberry32), réservé aux tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Tire une clé selon son poids (les poids n'ont pas besoin de sommer à 100). */
export function pickWeighted<K extends string>(table: Partial<Record<K, number>>, rng: Rng): K {
  const entries = Object.entries(table) as [K, number][]
  if (entries.length === 0) throw new Error('Table de tirage vide')
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let r = rng() * total
  for (const [key, weight] of entries) {
    r -= weight
    if (r < 0) return key
  }
  return entries[entries.length - 1][0]
}

/** Tire un élément au hasard, chances égales. */
export function pickOne<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('Liste vide')
  return items[Math.floor(rng() * items.length)]
}

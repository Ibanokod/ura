import { describe, expect, it } from 'vitest'
import { cardImageUrl, getSet, validateSet } from './index'

describe('extension Puissance Génétique (A1)', () => {
  const set = getSet('A1')

  it('contient 286 cartes valides, ordonnées, avec une rareté connue', () => {
    expect(set.id).toBe('A1')
    expect(set.cards).toHaveLength(286)
    expect(validateSet(set)).toEqual([])
  })

  it('a bien ses 3 couronnes et ses 3 paquets', () => {
    expect(set.cards.filter((c) => c.rarity === 'Couronne').map((c) => c.id)).toEqual(['A1-284', 'A1-285', 'A1-286'])
    expect(set.boosters).toHaveLength(3)
  })

  it('construit les URL d’images TCGdex', () => {
    expect(cardImageUrl(set.cards[0], 'low')).toBe('https://assets.tcgdex.net/fr/tcgp/A1/001/low.webp')
    expect(cardImageUrl(set.cards[0], 'high')).toBe('https://assets.tcgdex.net/fr/tcgp/A1/001/high.webp')
  })
})

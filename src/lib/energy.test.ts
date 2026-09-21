import { describe, expect, it } from 'vitest'
import { energyByName, parseEffect } from './energy'

describe('énergies', () => {
  it('retrouve une énergie par son nom français', () => {
    expect(energyByName('Feu').letter).toBe('R')
    expect(energyByName('Inconnu').cssVar).toBe('--type-incolore')
  })

  it('découpe un effet en texte et énergies', () => {
    const parts = parseEffect("Soignez 50 dégâts d'un de vos Pokémon {G}.")
    expect(parts).toEqual([
      { kind: 'text', text: "Soignez 50 dégâts d'un de vos Pokémon " },
      { kind: 'energy', energy: energyByName('Plante') },
      { kind: 'text', text: '.' },
    ])
  })

  it('laisse tel quel un texte sans énergie ou une lettre inconnue', () => {
    expect(parseEffect('Piochez une carte.')).toEqual([{ kind: 'text', text: 'Piochez une carte.' }])
    expect(parseEffect('{X}')).toEqual([{ kind: 'text', text: '{X}' }])
  })
})

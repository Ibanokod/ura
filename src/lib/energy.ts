// Types d'énergie de Pokémon TCG Pocket : nom français (tel que TCGdex les écrit), lettre
// utilisée dans les textes d'effet ({G}, {R}...), et variable CSS de couleur (tokens.css).

export type Energy = {
  name: string
  letter: string
  cssVar: string
}

export const ENERGIES: Energy[] = [
  { name: 'Plante', letter: 'G', cssVar: '--type-plante' },
  { name: 'Feu', letter: 'R', cssVar: '--type-feu' },
  { name: 'Eau', letter: 'W', cssVar: '--type-eau' },
  { name: 'Électrique', letter: 'L', cssVar: '--type-electrique' },
  { name: 'Psy', letter: 'P', cssVar: '--type-psy' },
  { name: 'Combat', letter: 'F', cssVar: '--type-combat' },
  { name: 'Obscurité', letter: 'D', cssVar: '--type-obscurite' },
  { name: 'Métal', letter: 'M', cssVar: '--type-metal' },
  { name: 'Dragon', letter: 'N', cssVar: '--type-dragon' },
  { name: 'Incolore', letter: 'C', cssVar: '--type-incolore' },
]

const byName = new Map(ENERGIES.map((e) => [e.name, e]))
const byLetter = new Map(ENERGIES.map((e) => [e.letter, e]))

export function energyByName(name: string): Energy {
  return byName.get(name) ?? { name, letter: '?', cssVar: '--type-incolore' }
}

export function energyByLetter(letter: string): Energy | undefined {
  return byLetter.get(letter)
}

export type EffectPart = { kind: 'text'; text: string } | { kind: 'energy'; energy: Energy }

/** Découpe un texte d'effet en morceaux : texte brut et énergies ({G}, {R}...). */
export function parseEffect(text: string): EffectPart[] {
  const parts: EffectPart[] = []
  const re = /\{([A-Z])\}/g
  let last = 0
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    if (m.index > last) parts.push({ kind: 'text', text: text.slice(last, m.index) })
    const energy = energyByLetter(m[1])
    if (energy) parts.push({ kind: 'energy', energy })
    else parts.push({ kind: 'text', text: m[0] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) })
  return parts
}

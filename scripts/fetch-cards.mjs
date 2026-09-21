// Récupère les cartes d'une extension Pokémon TCG Pocket depuis l'API TCGdex (français)
// et écrit src/data/sets/<ID>.json avec le détail complet de chaque carte (PV, type, stade,
// talents, attaques, faiblesse, retraite, description, illustrateur ; effet pour les
// Dresseurs). Node seul, aucune dépendance.
//
// Usage : node scripts/fetch-cards.mjs [A1]
//
// Une requête par carte (286 pour A1), six en parallèle : une dizaine de secondes.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const API = 'https://api.tcgdex.net/v2/fr'
const CONCURRENCY = 6
const RARITIES = [
  'Un Diamant',
  'Deux Diamants',
  'Trois Diamants',
  'Quatre Diamants',
  'Une Étoile',
  'Deux Étoiles',
  'Trois Étoiles',
  'Un Chromatique',
  'Deux Chromatiques',
  'Couronne',
]

// Trous de données TCGdex constatés le 21/09/2026 : ces cartes sont marquées « Sans Rareté »
// alors que toutes leurs voisines (A1-262 à A1-279) sont des Deux Étoiles. On corrige ici,
// de façon visible, plutôt que de laisser deux cartes hors du jeu.
const OVERRIDES = {
  'A1-265': 'Deux Étoiles', // Grodoudou-ex
  'A1-279': 'Deux Étoiles', // Grodoudou-ex
}

const setId = process.argv[2] ?? 'A1'
const here = dirname(fileURLToPath(import.meta.url))
const outFile = resolve(here, '../src/data/sets', `${setId}.json`)

async function getJson(url, attempt = 1) {
  const res = await fetch(url)
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 3) throw new Error(`HTTP ${res.status} pour ${url} après ${attempt} essais`)
    await new Promise((r) => setTimeout(r, 800 * attempt))
    return getJson(url, attempt + 1)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} pour ${url}`)
  return res.json()
}

/** Applique fn à chaque élément, au plus `limit` à la fois, en gardant l'ordre. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      out[index] = await fn(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

const set = await getJson(`${API}/sets/${encodeURIComponent(setId)}`)
console.log(`${set.name} (${set.id}) : ${set.cards.length} cartes à détailler...`)

const unresolved = []
const cards = await mapLimit(set.cards, CONCURRENCY, async (brief) => {
  const d = await getJson(`${API}/cards/${encodeURIComponent(brief.id)}`)
  let rarity = RARITIES.includes(d.rarity) ? d.rarity : OVERRIDES[d.id]
  if (!rarity) {
    unresolved.push(`${d.id} (${d.rarity})`)
    rarity = null
  }
  return {
    id: d.id,
    localId: d.localId,
    name: d.name,
    image: d.image,
    rarity,
    category: d.category ?? 'Pokémon',
    illustrator: d.illustrator ?? null,
    dexId: d.dexId ?? [],
    hp: d.hp ?? null,
    types: d.types ?? [],
    stage: d.stage ?? null,
    evolveFrom: d.evolveFrom ?? null,
    suffix: d.suffix ?? null,
    abilities: (d.abilities ?? []).map((a) => ({ type: a.type ?? 'Talent', name: a.name, effect: a.effect ?? '' })),
    attacks: (d.attacks ?? []).map((a) => ({ name: a.name, cost: a.cost ?? [], damage: a.damage ?? null, effect: a.effect ?? null })),
    weaknesses: (d.weaknesses ?? []).map((w) => ({ type: w.type, value: w.value })),
    retreat: d.retreat ?? null,
    description: d.description ?? null,
    trainerType: d.trainerType ?? null,
    effect: d.effect ?? null,
    boosters: (d.boosters ?? []).map((b) => b.name),
  }
})

if (unresolved.length > 0) {
  console.error(`Cartes sans rareté connue : ${unresolved.join(', ')}. Vérifier chez TCGdex et compléter OVERRIDES.`)
  process.exit(1)
}

cards.sort((a, b) => Number(a.localId) - Number(b.localId))

const ids = new Set(cards.map((c) => c.id))
if (ids.size !== cards.length) {
  console.error(`Ids en double détectés (${cards.length - ids.size}). Abandon.`)
  process.exit(1)
}

const expected = set.cardCount?.total
if (expected !== undefined && cards.length !== expected) {
  console.error(`Attendu ${expected} cartes d'après TCGdex, obtenu ${cards.length}.`)
  process.exit(1)
}

const out = {
  id: set.id,
  name: set.name,
  releaseDate: set.releaseDate ?? null,
  symbol: set.symbol ?? null,
  cardCount: set.cardCount ?? null,
  boosters: set.boosters ?? [],
  fetchedAt: new Date().toISOString(),
  cards,
}

await mkdir(dirname(outFile), { recursive: true })
await writeFile(outFile, JSON.stringify(out, null, 2) + '\n', 'utf8')

const byRarity = {}
for (const c of cards) byRarity[c.rarity] = (byRarity[c.rarity] ?? 0) + 1
const trainers = cards.filter((c) => c.category === 'Dresseur').length
console.log(`${cards.length} cartes (${cards.length - trainers} Pokémon, ${trainers} Dresseurs) -> ${outFile}`)
for (const r of RARITIES) {
  if (byRarity[r]) console.log(`  ${r.padEnd(18)} ${String(byRarity[r]).padStart(4)}`)
}

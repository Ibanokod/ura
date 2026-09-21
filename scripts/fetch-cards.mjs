// Récupère les cartes d'une extension Pokémon TCG Pocket depuis l'API TCGdex (français)
// et écrit src/data/sets/<ID>.json. Node seul, aucune dépendance.
//
// Usage : node scripts/fetch-cards.mjs [A1]
//
// Pourquoi une requête par rareté : l'endpoint « set » ne donne pas la rareté des cartes,
// et l'endpoint « cards » filtré la donne implicitement (on sait ce qu'on a demandé).
// Piège vérifié le 21/09/2026 : le filtre set.id est un « contient » (A1 attrape aussi
// A1a), d'où le contrôle strict sur le préfixe de l'id.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const API = 'https://api.tcgdex.net/v2/fr'
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

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} pour ${url}`)
  return res.json()
}

const set = await getJson(`${API}/sets/${encodeURIComponent(setId)}`)

const cards = []
for (const rarity of RARITIES) {
  const url = `${API}/cards?set.id=${encodeURIComponent(setId)}&rarity=${encodeURIComponent(rarity)}`
  const list = await getJson(url)
  for (const c of list) {
    if (!c.id.startsWith(`${setId}-`)) continue
    cards.push({ id: c.id, localId: c.localId, name: c.name, image: c.image, rarity })
  }
}
// Cartes de l'extension absentes du tirage par rareté : corrigées si prévues, sinon signalées.
const seen = new Set(cards.map((c) => c.id))
const unresolved = []
for (const c of set.cards) {
  if (seen.has(c.id)) continue
  const rarity = OVERRIDES[c.id]
  if (rarity) cards.push({ id: c.id, localId: c.localId, name: c.name, image: c.image, rarity })
  else unresolved.push(c.id)
}
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
  console.error(`Attendu ${expected} cartes d'après TCGdex, obtenu ${cards.length}. Vérifier la liste des raretés.`)
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
console.log(`${set.name} (${set.id}) : ${cards.length} cartes -> ${outFile}`)
for (const r of RARITIES) {
  if (byRarity[r]) console.log(`  ${r.padEnd(18)} ${String(byRarity[r]).padStart(4)}`)
}

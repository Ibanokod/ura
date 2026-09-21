// Tout ce qui touche à la notion de « journée » : la journée change à minuit, heure locale
// de l'appareil. Une clé de jour est une chaîne AAAA-MM-JJ, facile à comparer et à trier.

import type { Entry } from '../state/types'

const pad = (n: number) => String(n).padStart(2, '0')

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function dayKeyOf(iso: string): string {
  return dayKey(new Date(iso))
}

export function todayKey(now: Date = new Date()): string {
  return dayKey(now)
}

export function entriesForDay(entries: readonly Entry[], day: string): Entry[] {
  return entries.filter((e) => dayKeyOf(e.at) === day)
}

export function totalForDay(entries: readonly Entry[], day: string): number {
  let total = 0
  for (const e of entries) if (dayKeyOf(e.at) === day) total += e.ml
  return total
}

/** Les n derniers jours, du plus ancien au plus récent, aujourd'hui inclus. */
export function lastDays(n: number, now: Date = new Date()): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(dayKey(d))
  }
  return days
}

/** « 0,75 L », toujours deux décimales : la largeur du chiffre ne bouge pas à l'écran. */
export function formatLiters(ml: number): string {
  return `${(ml / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`
}

/** « 0,15 L », « 1,5 L », « 2 L » : forme courte pour les boutons et les indications. */
export function formatLitersShort(ml: number): string {
  return `${(ml / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L`
}

/** « 08:15 » */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/** « Aujourd'hui », « Hier », sinon « lun. 15 sept. ». */
export function dayLabel(day: string, now: Date = new Date()): string {
  if (day === dayKey(now)) return "Aujourd'hui"
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (day === dayKey(yesterday)) return 'Hier'
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

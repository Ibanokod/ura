import { describe, expect, it } from 'vitest'
import { dayKey, dayKeyOf, dayLabel, formatLiters, formatLitersShort, lastDays, totalForDay } from './day'

describe('clé de jour', () => {
  it('change à minuit heure locale', () => {
    const before = new Date(2026, 8, 21, 23, 59)
    const after = new Date(2026, 8, 22, 0, 1)
    expect(dayKey(before)).toBe('2026-09-21')
    expect(dayKey(after)).toBe('2026-09-22')
    expect(dayKeyOf(before.toISOString())).toBe('2026-09-21')
    expect(dayKeyOf(after.toISOString())).toBe('2026-09-22')
  })

  it('additionne uniquement les prises du jour demandé', () => {
    const entries = [
      { id: 'a', at: new Date(2026, 8, 21, 8).toISOString(), ml: 150 },
      { id: 'b', at: new Date(2026, 8, 21, 23, 59).toISOString(), ml: 350 },
      { id: 'c', at: new Date(2026, 8, 22, 0, 1).toISOString(), ml: 150 },
    ]
    expect(totalForDay(entries, '2026-09-21')).toBe(500)
    expect(totalForDay(entries, '2026-09-22')).toBe(150)
    expect(totalForDay(entries, '2026-09-20')).toBe(0)
  })

  it('liste les 7 derniers jours du plus ancien au plus récent', () => {
    const days = lastDays(7, new Date(2026, 8, 21, 12))
    expect(days).toHaveLength(7)
    expect(days[0]).toBe('2026-09-15')
    expect(days[6]).toBe('2026-09-21')
  })
})

describe('formats', () => {
  it('affiche les litres en français', () => {
    expect(formatLiters(750)).toBe('0,75 L')
    expect(formatLiters(1500)).toBe('1,50 L')
    expect(formatLitersShort(150)).toBe('0,15 L')
    expect(formatLitersShort(1500)).toBe('1,5 L')
    expect(formatLitersShort(2000)).toBe('2 L')
  })

  it('nomme aujourd’hui et hier', () => {
    const now = new Date(2026, 8, 21, 12)
    expect(dayLabel('2026-09-21', now)).toBe("Aujourd'hui")
    expect(dayLabel('2026-09-20', now)).toBe('Hier')
    expect(dayLabel('2026-09-15', now)).toMatch(/15/)
  })
})

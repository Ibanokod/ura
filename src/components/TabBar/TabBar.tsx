import { Droplets, History, LayoutGrid, type LucideIcon } from 'lucide-react'
import { cx } from '../../lib/cx'
import styles from './TabBar.module.css'

export type Tab = 'today' | 'dex' | 'history'

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'today', label: "Aujourd'hui", Icon: Droplets },
  { id: 'dex', label: 'Pokédex', Icon: LayoutGrid },
  { id: 'history', label: 'Historique', Icon: History },
]

export function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className={styles.bar} aria-label="Navigation principale">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = id === active
        return (
          <button
            key={id}
            type="button"
            className={cx(styles.tab, isActive && styles.active)}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <Icon size={24} strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

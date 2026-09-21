import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import styles from './Sheet.module.css'

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode }

/** Feuille qui glisse depuis le bas (réglages, détail d'une carte). Échap ou fond = fermer. */
export function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} aria-hidden="true" />
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}

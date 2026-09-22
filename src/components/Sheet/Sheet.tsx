import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import styles from './Sheet.module.css'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** Pied de fenêtre ; par défaut un bouton « Fermer » plein largeur, à portée du pouce. */
  footer?: ReactNode
  children: ReactNode
}

/**
 * Fenêtre centrée (réglages, fiche de carte). Trois sorties : « Fermer » en bas, la croix
 * en haut, un tap à côté ; Échap au clavier. Le contenu défile à l'intérieur, en-tête et
 * pied restent visibles.
 */
export function Sheet({ open, onClose, title, subtitle, footer, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.titles}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        <footer className={styles.footer}>
          {footer ?? (
            <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
              Fermer
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

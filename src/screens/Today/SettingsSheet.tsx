import { Download, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Sheet } from '../../components/Sheet/Sheet'
import { getSet } from '../../data/sets'
import { formatLitersShort, todayKey } from '../../lib/day'
import { exportJson, parseImport } from '../../state/persistence'
import { useActions, useAppState } from '../../state/store'
import styles from './SettingsSheet.module.css'

type Props = { open: boolean; onClose: () => void }

/** Réglages réduits au strict nécessaire : exporter, importer, réinitialiser. */
export function SettingsSheet({ open, onClose }: Props) {
  const state = useAppState()
  const actions = useActions()
  const set = getSet(state.settings.setId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const onExport = () => {
    const blob = new Blob([exportJson(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ura-export-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Export téléchargé.')
  }

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const imported = parseImport(await file.text())
    if (!imported) {
      setMessage("Ce fichier n'est pas un export Ura.")
      return
    }
    if (window.confirm('Remplacer toutes les données actuelles par celles de ce fichier ?')) {
      actions.importState(imported)
      setMessage('Import terminé.')
    }
  }

  const close = () => {
    setConfirmReset(false)
    setMessage(null)
    onClose()
  }

  return (
    <Sheet open={open} onClose={close} title="Réglages">
      <dl className={styles.facts}>
        <div>
          <dt>Extension</dt>
          <dd>
            {set.name} · {set.cards.length} cartes
          </dd>
        </div>
        <div>
          <dt>Objectif</dt>
          <dd>{formatLitersShort(state.settings.goalMl)} par jour</dd>
        </div>
        <div>
          <dt>Verre</dt>
          <dd>{formatLitersShort(state.settings.quickAddMl)}</dd>
        </div>
        <div>
          <dt>Prises enregistrées</dt>
          <dd>{state.entries.length}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <button type="button" className="btn btn-secondary btn-block" onClick={onExport}>
          <Download size={18} aria-hidden="true" /> Exporter mes données (JSON)
        </button>
        <button type="button" className="btn btn-secondary btn-block" onClick={() => fileRef.current?.click()}>
          <Upload size={18} aria-hidden="true" /> Importer un export
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="visually-hidden" onChange={onImport} />
      </div>

      {message && <p className={styles.message}>{message}</p>}

      <div className={styles.danger}>
        {confirmReset ? (
          <>
            <p>Tout effacer : prises, récompenses et collection. Irréversible.</p>
            <div className={styles.dangerRow}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  actions.reset()
                  close()
                }}
              >
                Oui, tout effacer
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                Annuler
              </button>
            </div>
          </>
        ) : (
          <button type="button" className={styles.resetLink} onClick={() => setConfirmReset(true)}>
            Réinitialiser l'application
          </button>
        )}
      </div>

      <p className={styles.note}>
        Les données restent dans ce navigateur. Pense à exporter avant de changer d'appareil. Cartes et images : TCGdex, usage personnel.
      </p>
    </Sheet>
  )
}

import { useEffect, useRef, useState } from 'react'
import styles from './App.module.css'
import { RevealOverlay } from './components/Reveal/RevealOverlay'
import { TabBar, type Tab } from './components/TabBar/TabBar'
import { DexScreen } from './screens/Dex/DexScreen'
import { HistoryScreen } from './screens/History/HistoryScreen'
import { TodayScreen } from './screens/Today/TodayScreen'
import { StoreProvider } from './state/store'

/**
 * Coquille « appli » : une colonne de la hauteur de l'écran, le contenu défile dans <main>,
 * la barre du bas reste toujours visible (elle n'est pas dans le flux qui défile).
 */
export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const mainRef = useRef<HTMLElement>(null)

  // Chaque onglet s'ouvre en haut de page.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [tab])

  return (
    <StoreProvider>
      <div className={styles.app}>
        <main ref={mainRef} className={styles.main}>
          {tab === 'today' && <TodayScreen />}
          {tab === 'dex' && <DexScreen />}
          {tab === 'history' && <HistoryScreen />}
        </main>
        <TabBar active={tab} onChange={setTab} />
        <RevealOverlay />
      </div>
    </StoreProvider>
  )
}

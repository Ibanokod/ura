import { useState } from 'react'
import styles from './App.module.css'
import { RevealOverlay } from './components/Reveal/RevealOverlay'
import { TabBar, type Tab } from './components/TabBar/TabBar'
import { DexScreen } from './screens/Dex/DexScreen'
import { HistoryScreen } from './screens/History/HistoryScreen'
import { TodayScreen } from './screens/Today/TodayScreen'
import { StoreProvider } from './state/store'

export default function App() {
  const [tab, setTab] = useState<Tab>('today')

  return (
    <StoreProvider>
      <div className={styles.app}>
        <main className={styles.main}>
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

import { HashRouter, Route, Routes } from 'react-router-dom'
import { CommandK } from './shell/CommandK'
import { Sidebar } from './shell/Sidebar'
import { Topbar } from './shell/Topbar'
import { AppProvider, useApp } from './store'
import { Btn } from './ui'

import Home from './pages/Home'
import TimeOff from './pages/TimeOff'
import InboxPage from './pages/Inbox'
import People from './pages/People'
import Rules from './pages/Rules'
import Documents from './pages/Documents'
import Companies from './pages/Companies'
import AddCompany from './pages/AddCompany'
import Reports from './pages/Reports'

function Toasts() {
  const { toasts, dismissToast } = useApp()
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex animate-slide-up items-center gap-3 rounded-full bg-ink py-2.5 pl-5 pr-2.5 text-[13px] font-semibold text-card shadow-pop"
        >
          {t.msg}
          {t.undo && (
            <Btn
              size="sm"
              variant="amber"
              onClick={() => {
                t.undo?.()
                dismissToast(t.id)
              }}
            >
              Undo
            </Btn>
          )}
          {!t.undo && (
            <button onClick={() => dismissToast(t.id)} className="rounded-full px-2 py-0.5 text-card/60 hover:text-card">
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function Shell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-8 pb-10 pt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/time-off" element={<TimeOff />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/people" element={<People />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/new" element={<AddCompany />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
      <CommandK />
      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AppProvider>
  )
}

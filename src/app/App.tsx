import { useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock3, QrCode, Settings as SettingsIcon } from 'lucide-react'
import { Scanner } from '@/pages/Scanner'
import { History } from '@/pages/History'
import { Settings } from '@/pages/Settings'
import { Toast } from '@/components/ui/Toast'

const tabs = [
  { to: '/scanner', label: 'Scanner', Icon: QrCode },
  { to: '/history', label: 'History', Icon: Clock3 },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
]

export function App() {
  const [toast, setToast] = useState<string | null>(null)
  const location = useLocation()
  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2300)
  }

  return (
    <main className="app-shell">
      <div className="app-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="absolute inset-0 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.16 }}
          >
            <Routes location={location}>
              <Route path="/scanner" element={<Scanner onToast={showToast} />} />
              <Route path="/history" element={<History onToast={showToast} />} />
              <Route path="/settings" element={<Settings onToast={showToast} />} />
              <Route path="*" element={<Navigate to="/scanner" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
      <nav className="tab-bar" aria-label="Main navigation">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
            <Icon size={19} strokeWidth={2.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <Toast message={toast} />
    </main>
  )
}

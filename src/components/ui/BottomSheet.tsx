import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function BottomSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss scan result"
            className="absolute inset-0 z-30 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="ios-blur absolute inset-x-0 bottom-0 z-40 flex max-h-[90%] flex-col overflow-y-auto rounded-t-[36px] border-t border-white/20 bg-ios-glass p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl ios-scroll"
            aria-label="Scan result"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 h-1 w-10 shrink-0 self-center rounded-full bg-white/30" />
            {children}
          </motion.section>
        </>
      )}
    </AnimatePresence>
  )
}

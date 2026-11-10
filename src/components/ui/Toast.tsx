import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -24, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -24, x: '-50%' }}
          className="ios-blur fixed left-1/2 top-[max(1.5rem,env(safe-area-inset-top))] z-[70] flex items-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-slate-900/90 px-4 py-2.5 text-xs font-medium text-white shadow-2xl"
          role="status"
        >
          <CheckCircle2 size={15} className="text-ios-safe" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

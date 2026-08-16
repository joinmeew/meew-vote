import { motion } from 'framer-motion'

export default function MeewLogo({ compact = false, animated = true }) {
  return (
    <div className={`meew-logo ${compact ? 'compact' : ''}`} aria-label="MEEW">
      <motion.span initial={animated ? { opacity: 0, x: -8 } : false} animate={{ opacity: 1, x: 0 }}>M</motion.span>
      <motion.span className="left-e" initial={animated ? { opacity: 0, x: -14 } : false} animate={{ opacity: 1, x: 0 }}>E</motion.span>
      <motion.i initial={animated ? { opacity: 0, scale: 0 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .4, type: 'spring' }} />
      <motion.span className="right-e" initial={animated ? { opacity: 0, x: 14 } : false} animate={{ opacity: 1, x: 0 }}>Ǝ</motion.span>
      <motion.span initial={animated ? { opacity: 0, x: 8 } : false} animate={{ opacity: 1, x: 0 }}>W</motion.span>
    </div>
  )
}

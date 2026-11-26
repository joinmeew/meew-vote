import { motion } from 'framer-motion'

export default function MeewLogo({ compact = false, animated = true }) {
  const letter = (offset) => ({
    initial: animated ? { opacity: 0, x: offset } : false,
    animate: { opacity: 1, x: 0 },
  })
  return (
    <div className={`meew-logo ${compact ? 'compact' : ''}`} role="img" aria-label="MEEW">
      <motion.span className="outer-letter" {...letter(-8)} aria-hidden="true">M</motion.span>
      <motion.span className="glyph-wrap left-e" {...letter(-14)} aria-hidden="true">
        <svg className="brand-e" viewBox="0 0 48 64"><path d="M40 8 H8 V56 H40 M8 32 H35" /></svg>
      </motion.span>
      <motion.span className="glyph-wrap right-e" {...letter(14)} aria-hidden="true">
        <svg className="brand-e" viewBox="0 0 48 64"><path d="M8 8 H40 V56 H8 M40 32 H13" /></svg>
      </motion.span>
      <motion.span className="outer-letter" {...letter(8)} aria-hidden="true">W</motion.span>
    </div>
  )
}

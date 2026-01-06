"use client"

import { motion, useAnimation } from "framer-motion"
import { useEffect } from "react"
import type { ReactNode } from "react"
import { useInView } from "react-intersection-observer"

interface ScaleInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export default function ScaleIn({ children, delay = 0, duration = 0.5, className = "" }: ScaleInProps) {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const initial = { opacity: 0, scale: 0.9 }

  useEffect(() => {
    // Reset animation when component mounts
    controls.set(initial)

    if (inView) {
      controls.start({ opacity: 1, scale: 1 })
    }

    // Listen for page change events
    const handlePageChange = () => {
      // Reset animation state when navigating to a new page
      controls.set(initial)

      // Restart animations with a small delay
      setTimeout(() => {
        if (inView) {
          controls.start({ opacity: 1, scale: 1 })
        }
      }, 100)
    }

    window.addEventListener("page-changed", handlePageChange)
    return () => window.removeEventListener("page-changed", handlePageChange)
  }, [controls, inView, initial])

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={controls}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}


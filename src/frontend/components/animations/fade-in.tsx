"use client"

import { motion, useAnimation } from "framer-motion"
import { useEffect } from "react"
import type { ReactNode } from "react"
import { useInView } from "react-intersection-observer"

interface FadeInProps {
  children: ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  duration?: number
  className?: string
  once?: boolean
}

export default function FadeIn({
  children,
  delay = 0,
  direction = "up",
  duration = 0.5,
  className = "",
  once = true,
}: FadeInProps) {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    triggerOnce: once,
    threshold: 0.1,
  })

  const directionOffset = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
    none: { x: 0, y: 0 },
  }

  const initial = {
    opacity: 0,
    ...directionOffset[direction],
  }

  useEffect(() => {
    // Reset animation when component mounts
    controls.set(initial)

    if (inView) {
      controls.start({ opacity: 1, x: 0, y: 0 })
    }

    // Listen for page change events
    const handlePageChange = () => {
      // Reset animation state when navigating to a new page
      controls.set(initial)

      // Restart animations with a small delay
      setTimeout(() => {
        if (inView) {
          controls.start({ opacity: 1, x: 0, y: 0 })
        }
      }, 100)
    }

    window.addEventListener("page-changed", handlePageChange)
    return () => window.removeEventListener("page-changed", handlePageChange)
  }, [controls, inView])

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...directionOffset[direction],
      }}
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


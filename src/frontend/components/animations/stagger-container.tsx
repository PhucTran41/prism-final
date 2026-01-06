"use client"

import { motion, useAnimation } from "framer-motion"
import { useEffect } from "react"
import type { ReactNode } from "react"
import { useInView } from "react-intersection-observer"

interface StaggerContainerProps {
  children: ReactNode
  delay?: number
  className?: string
  staggerChildren?: number
}

export default function StaggerContainer({
  children,
  delay = 0,
  className = "",
  staggerChildren = 0.1,
}: StaggerContainerProps) {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  const variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren,
      },
    },
  }

  useEffect(() => {
    if (inView) {
      controls.start("show")
    } else {
      controls.set("hidden")
    }
  }, [controls, inView])

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}


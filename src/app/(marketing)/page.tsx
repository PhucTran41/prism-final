"use client"

import { useEffect } from "react"
import { motion, useAnimation, type Variants } from "framer-motion"
import { useInView } from "react-intersection-observer"
import HeroSection from "@/app/(marketing)/components/HeroSection"
import AboutSection from "@/app/(marketing)/components/AboutSection"
import SolutionsSection from "@/app/(marketing)/components/SolutionSection"
import TestimonialsSection from "@/app/(marketing)/components/TestimonialsSection"
import ContactSection from "@/app/(marketing)/components/ContactSection"
import ServicesSection from "@/app/(marketing)/components/ServiceSection"

export default function MarketingPage() {

  // 4. Animation controls
  const servicesControls = useAnimation()
  const aboutControls = useAnimation()
  const solutionsControls = useAnimation()
  const testimonialsControls = useAnimation()
  const contactControls = useAnimation()

  // 5. Intersection observer hooks
  const [servicesRef, servicesInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [aboutRef, aboutInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [solutionsRef, solutionsInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [testimonialsRef, testimonialsInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [contactRef, contactInView] = useInView({ threshold: 0.1, triggerOnce: true })

  // 7. Animation effects
  useEffect(() => {
    if (servicesInView) servicesControls.start("visible")
    if (aboutInView) aboutControls.start("visible")
    if (solutionsInView) solutionsControls.start("visible")
    if (testimonialsInView) testimonialsControls.start("visible")
    if (contactInView) contactControls.start("visible")
  }, [
    servicesInView, servicesControls,
    aboutInView, aboutControls,
    solutionsInView, solutionsControls,
    testimonialsInView, testimonialsControls,
    contactInView, contactControls,
  ])

  // Animation variants
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  }

  return (
    <>
      <main className="min-h-screen bg-background text-foreground">
        <HeroSection />

        <motion.div ref={servicesRef} initial="hidden" animate={servicesControls} variants={sectionVariants}>
          <ServicesSection />
        </motion.div>

        <motion.div ref={aboutRef} initial="hidden" animate={aboutControls} variants={sectionVariants}>
          <AboutSection />
        </motion.div>

        <motion.div ref={solutionsRef} initial="hidden" animate={solutionsControls} variants={sectionVariants}>
          <SolutionsSection />
        </motion.div>

        <motion.div ref={testimonialsRef} initial="hidden" animate={testimonialsControls} variants={sectionVariants}>
          <TestimonialsSection />
        </motion.div>

        <motion.div ref={contactRef} initial="hidden" animate={contactControls} variants={sectionVariants}>
          <ContactSection />
        </motion.div>

      </main>
    </>
  )
}


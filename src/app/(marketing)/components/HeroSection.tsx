"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, useAnimation, type Variants } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import Link from "next/link";
import { InfiniteGridBackground } from "@/src/frontend/components/ui/infinite-grid";

export default function HeroSection() {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const controls = useAnimation();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }

    // Simulate content loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [controls, inView]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeInOut" },
    },
  };

  const statsVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 1.2,
      },
    },
  };

  const statItemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background z-0" />
      <InfiniteGridBackground interactive />

      <div
        className="container relative z-10 px-4 py-32 md:py-40 lg:py-48 max-w-6xl mx-auto"
        ref={ref}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
          >
            <motion.div variants={itemVariants} className="inline-block">
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm">
                <span className="text-primary font-medium">
                  From idea to executable specs
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            >
              Turn ideas into production-ready documentation with{" "}
              <span className="text-primary">Prism</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground max-w-xl"
            >
              Prism is an AI-driven platform that centralizes documentation, version control, and collaboration to keep teams aligned on scope, requirements, and delivery from day one.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/signin">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white group"
                >
                  <span>Create your first project</span>
                  <motion.div
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.5,
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </Button>
              </Link>
              <Link href="#solutions">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/20 hover:bg-primary/10"
                >
                  Explore the workflow
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={statsVariants}
              className="flex items-center gap-8 pt-4"
            >
              <motion.div variants={statItemVariants}>
                <motion.p
                  className="text-3xl font-bold text-primary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.8 }}
                >
                  5×
                </motion.p>
                <p className="text-sm text-muted-foreground">
                  Faster project definition
                </p>
              </motion.div>

              <motion.div variants={statItemVariants}>
                <motion.p
                  className="text-3xl font-bold text-primary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6, duration: 0.8 }}
                >
                  Zero drift
                </motion.p>
                <p className="text-sm text-muted-foreground">
                  Single source of truth
                </p>
              </motion.div>

              <motion.div variants={statItemVariants}>
                <motion.p
                  className="text-3xl font-bold text-primary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8, duration: 0.8 }}
                >
                  One flow
                </motion.p>
                <p className="text-sm text-muted-foreground">Brief → roadmap</p>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {" "}
            <motion.div
              className="absolute -left-20 -top-20 w-64 h-64 bg-primary/20 rounded-full filter blur-3xl"
              animate={{ opacity: [0.5, 0.7, 0.5], scale: [1, 1.1, 1] }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />{" "}
            <motion.div
              className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/20 rounded-full filter blur-3xl"
              animate={{ opacity: [0.7, 0.5, 0.7], scale: [1, 1.1, 1] }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                delay: 1,
              }}
            />{" "}
            <motion.div
              className="relative bg-card/40 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-xl"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {" "}
              <div className="aspect-square w-full relative">
                {" "}
                {/* Rotating Rectangles Layer */}{" "}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 60,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                >
                  {" "}
                  <div className="w-3/4 h-3/4 relative">
                    {" "}
                    <motion.div
                      className="w-full h-full border-[3px] border-primary rotate-45 absolute"
                      animate={{ rotate: [45, 225, 45] }}
                      transition={{
                        duration: 20,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    />{" "}
                    <motion.div
                      className="w-full h-full border-[3px] border-primary/50 rotate-[30deg] absolute"
                      animate={{ rotate: [30, 210, 30] }}
                      transition={{
                        duration: 25,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    />{" "}
                    <motion.div
                      className="w-full h-full border-[3px] border-primary/30 rotate-[15deg] absolute"
                      animate={{ rotate: [15, 195, 15] }}
                      transition={{
                        duration: 30,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    />{" "}
                  </div>{" "}
                </motion.div>{" "}
                {/* Logo Layer */}{" "}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  {" "}
                  <motion.div
                    className="w-1/3 h-1/3"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  >
                    {" "}
                    <Image
                      src="/logos/prism.svg"
                      alt="Prism Logo"
                      width={100}
                      height={100}
                      className="w-full h-full object-contain"
                    />{" "}
                  </motion.div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="mt-6 space-y-4">
                {" "}
                <motion.div
                  className="h-2 w-full bg-gradient-to-r from-primary to-primary/20 rounded-full"
                  animate={{ width: ["0%", "100%"] }}
                  transition={{ duration: 1.5, delay: 1 }}
                />{" "}
                <motion.div
                  className="h-2 w-3/4 bg-gradient-to-r from-primary/80 to-primary/10 rounded-full"
                  animate={{ width: ["0%", "75%"] }}
                  transition={{ duration: 1.5, delay: 1.3 }}
                />{" "}
                <motion.div
                  className="h-2 w-1/2 bg-gradient-to-r from-primary/60 to-primary/5 rounded-full"
                  animate={{ width: ["0%", "50%"] }}
                  transition={{ duration: 1.5, delay: 1.6 }}
                />{" "}
              </div>{" "}
            </motion.div>{" "}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

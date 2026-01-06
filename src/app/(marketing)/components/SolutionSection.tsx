"use client"

import Image from "next/image"
import { Button } from "@/src/frontend/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/frontend/components/ui/tabs"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "@/src/frontend/components/common/icon"

export default function SolutionsSection() {

  return (
    <section id="solutions" className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Solutions tailored to your workflow</h2>
          <div className="h-1 w-16 sm:w-20 bg-primary mx-auto mb-4 sm:mb-6"></div>
          <p className="text-base sm:text-lg text-muted-foreground">Pick the entry point that matches where you are today.</p>
        </div>

        <Tabs defaultValue="brief-first" className="w-full">
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 justify-items-center bg-transparent mb-6 sm:mb-8 gap-3 sm:gap-4 h-auto">
            <TabsTrigger
              value="brief-first"
              className="group w-28 sm:w-32 rounded-lg border border-transparent px-3 py-4 flex flex-col items-center gap-1.5 hover:bg-muted/30 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/40 data-[state=active]:text-primary"
            >
              <Icon name="FileText" className="h-5 w-5 text-muted-foreground group-data-[state=active]:text-primary" />
              <span className="text-sm truncate text-muted-foreground group-data-[state=active]:text-primary">Brief-first</span>
            </TabsTrigger>
            <TabsTrigger
              value="scope-first"
              className="group w-28 sm:w-32 rounded-lg border border-transparent px-3 py-4 flex flex-col items-center gap-1.5 hover:bg-muted/30 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/40 data-[state=active]:text-primary"
            >
              <Icon name="ListChecks" className="h-5 w-5 text-muted-foreground group-data-[state=active]:text-primary" />
              <span className="text-sm truncate text-muted-foreground group-data-[state=active]:text-primary">Scope-first</span>
            </TabsTrigger>
            <TabsTrigger
              value="backlog-first"
              className="group w-28 sm:w-32 rounded-lg border border-transparent px-3 py-4 flex flex-col items-center gap-1.5 hover:bg-muted/30 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/40 data-[state=active]:text-primary"
            >
              <Icon name="Kanban" className="h-5 w-5 text-muted-foreground group-data-[state=active]:text-primary" />
              <span className="text-sm truncate text-muted-foreground group-data-[state=active]:text-primary">Backlog</span>
            </TabsTrigger>
            <TabsTrigger
              value="roadmap-first"
              className="group w-28 sm:w-32 rounded-lg border border-transparent px-3 py-4 flex flex-col items-center gap-1.5 hover:bg-muted/30 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/40 data-[state=active]:text-primary"
            >
              <Icon name="Calendar" className="h-5 w-5 text-muted-foreground group-data-[state=active]:text-primary" />
              <span className="text-sm truncate text-muted-foreground group-data-[state=active]:text-primary">Roadmap</span>
            </TabsTrigger>
            <TabsTrigger
              value="export"
              className="group w-28 sm:w-32 rounded-lg border border-transparent px-3 py-4 flex flex-col items-center gap-1.5 hover:bg-muted/30 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/40 data-[state=active]:text-primary"
            >
              <Icon name="Download" className="h-5 w-5 text-muted-foreground group-data-[state=active]:text-primary" />
              <span className="text-sm truncate text-muted-foreground group-data-[state=active]:text-primary">Export</span>
            </TabsTrigger>
              <TabsTrigger
              value="governance"
              className="group w-28 sm:w-32 rounded-lg border border-transparent px-3 py-4 flex flex-col items-center gap-1.5 hover:bg-muted/30 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/40 data-[state=active]:text-primary"
            >
              <Icon name="ShieldCheck" className="h-5 w-5 text-muted-foreground group-data-[state=active]:text-primary" />
              <span className="text-sm truncate text-muted-foreground group-data-[state=active]:text-primary">Governance</span>
              </TabsTrigger>
          </TabsList>

          <TabsContent value="brief-first">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start lg:items-center"
                >
                  <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Start with a Project Brief</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Clarify problem, audience, goals, and constraints to align stakeholders before scoping.</p>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {["Concise narrative", "Stakeholder-ready", "Editable and exportable"].map((feature, index) => (
                      <motion.div key={feature} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="flex items-center space-x-2">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></div>
                        <span className="text-sm sm:text-base text-muted-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/signin">
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white mt-4">
                      Explore Solutions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }} className="relative mt-6 lg:mt-0 w-full max-w-[400px] mx-auto">
                  <div className="absolute -inset-4 bg-primary/10 rounded-xl filter blur-lg opacity-70"></div>
                  <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden p-4 h-[400px]">
                    <Image src="/images/marketing/brief.png" alt="Project Brief" width={300} height={300} className="w-full h-full object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                      <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs">
                        <span className="text-primary font-medium">Brief-first Solutions</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="scope-first">
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start lg:items-center">
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Define Scope & Features</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Generate MoSCoW features with clear rationale and evolve them into epics and stories.</p>
                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {["MoSCoW prioritization", "Clear acceptance", "Export to docs"].map((feature, index) => (
                      <motion.div key={feature} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="flex items-center space-x-2">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></div>
                          <span className="text-sm sm:text-base text-muted-foreground">{feature}</span>
                        </motion.div>
                      ))}
                  </div>
                  <Link href="/signin">
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white mt-4">
                      Explore Solutions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }} className="relative mt-6 lg:mt-0 w-full max-w-[400px] mx-auto">
                  <div className="absolute -inset-4 bg-primary/10 rounded-xl filter blur-lg opacity-70"></div>
                  <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden p-4 h-[400px]">
                    <Image src="/images/marketing/scope.png" alt="Scope & Features" width={300} height={300} className="w-full h-full object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                      <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs">
                        <span className="text-primary font-medium">Scope-first Solutions</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="backlog-first">
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start lg:items-center">
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Shape Epics & Stories</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Use a Jira-like backlog with expandable epics and deduplicated stories. Auto-save every change.</p>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {["Generate per epic/all", "Search and filter", "Acceptance criteria toggle"].map((feature, index) => (
                      <motion.div key={feature} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="flex items-center space-x-2">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></div>
                        <span className="text-sm sm:text-base text-muted-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/signin">
                      <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white mt-4">
                        Explore Solutions
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }} className="relative mt-6 lg:mt-0 w-full max-w-[400px] mx-auto">
                    <div className="absolute -inset-4 bg-primary/10 rounded-xl filter blur-lg opacity-70"></div>
                    <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden p-4 h-[400px]">
                    <Image src="/images/marketing/epics-stories.png" alt="Epics & Stories" width={300} height={300} className="w-full h-full object-cover" priority />
                      <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/50 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs">
                        <span className="text-primary font-medium">Backlog Solutions</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="roadmap-first">
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start lg:items-center">
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Plan the Roadmap</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Create an editable Gantt with milestones from cadence, dates, velocity, holidays, and releases.</p>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {["Milestones", "Team capacity inputs", "Date consistency checks"].map((feature, index) => (
                      <motion.div key={feature} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="flex items-center space-x-2">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></div>
                        <span className="text-sm sm:text-base text-muted-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/signin">
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white mt-4">
                      Explore Solutions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                        </div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }} className="relative mt-6 lg:mt-0 w-full max-w-[400px] mx-auto">
                  <div className="absolute -inset-4 bg-primary/10 rounded-xl filter blur-lg opacity-70"></div>
                  <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden p-4 h-[400px]">
                    <Image src="/images/marketing/roadmap.png" alt="Roadmap" width={300} height={300} className="w-full h-full object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                      <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs">
                        <span className="text-primary font-medium">Roadmap Solutions</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="export">
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start lg:items-center">
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Export & Share</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Export briefs and scopes as Markdown, PDF, or DOCX to share with your team or investors.</p>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {["Markdown", "PDF", "DOCX"].map((feature, index) => (
                      <motion.div key={feature} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="flex items-center space-x-2">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></div>
                        <span className="text-sm sm:text-base text-muted-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/signin">
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white mt-4">
                      Explore Solutions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }} className="relative mt-6 lg:mt-0 w-full max-w-[400px] mx-auto">
                  <div className="absolute -inset-4 bg-primary/10 rounded-xl filter blur-lg opacity-70"></div>
                  <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden p-4 h-[400px]">
                    <Image src="/images/marketing/export.png" alt="Export" width={300} height={300} className="w-full h-full object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                      <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs">
                        <span className="text-primary font-medium">Export Solutions</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

          <TabsContent value="governance">
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start lg:items-center">
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Secure & Governed</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Role-based access via NextAuth and strict ownership checks. Prisma-backed data consistency.</p>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {["NextAuth", "Prisma 7", "Zod-validated APIs"].map((feature, index) => (
                      <motion.div key={feature} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="flex items-center space-x-2">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></div>
                        <span className="text-sm sm:text-base text-muted-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/signin">
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white mt-4">
                      Explore Solutions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }} className="relative mt-6 lg:mt-0 w-full max-w-[400px] mx-auto">
                  <div className="absolute -inset-4 bg-primary/10 rounded-xl filter blur-lg opacity-70"></div>
                  <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden p-4 h-[400px]">
                    <Image src="/images/marketing/security.png" alt="Governance" width={300} height={300} className="w-full h-full object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                      <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs">
                        <span className="text-primary font-medium">Governance Solutions</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}


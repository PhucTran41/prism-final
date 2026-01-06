"use client"

import { InfiniteMovingCards } from "@/src/frontend/components/ui/infinite-moving-card"

export default function TestimonialsSection() {

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-background/95 to-background overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Loved by product leaders</h2>
          <div className="h-1 w-16 sm:w-20 bg-primary mx-auto mb-4 sm:mb-6"></div>
          <p className="text-base sm:text-lg text-muted-foreground">Prism accelerates planning without sacrificing clarity. Here’s what teams are saying.</p>
        </div>

        <div className="relative">
          <InfiniteMovingCards
            items={[
              { quote: "We aligned in a day instead of weeks.", name: "Lan P.", title: "Head of Product" },
              { quote: "Roadmaps actually reflect capacity now.", name: "Khai N.", title: "Eng Manager" },
              { quote: "Great exports for investors.", name: "Minh T.", title: "Founder" },
            ]}
            direction="left"
            speed="slow"
            className="py-4"
          />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background to-transparent" />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>
    </section>
  )
}


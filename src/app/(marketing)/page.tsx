import { Header } from "@/src/frontend/components/common/Header";
import { Footer } from "@/src/frontend/components/common/Footer";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-primary">
              Ship project docs with AI, fast.
            </h1>
            <p className="mt-4 text-muted-foreground">
              Prism helps you generate and refine Project Briefs, Scope, Epics, Stories, and Roadmaps with versioning and commit control.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-primary-foreground transition hover:opacity-90"
              >
                Get started
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-primary px-5 text-primary transition hover:bg-primary/10"
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}



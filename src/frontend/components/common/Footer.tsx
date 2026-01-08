"use client";

import Link from "next/link";
import { PrismLogo } from "@/src/frontend/components/common/PrismLogo";

export function Footer() {
  
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="mx-auto w-full px-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <Link href="/" className="flex items-center text-primary" aria-label="Prism Home">
            <PrismLogo size={32} withWordmark wordmarkClassName="text-lg font-semibold tracking-tight"/>
          </Link>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; 2025 Prism. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
            Privacy Policy
          </Link>
          <Link href="/contact" className="text-sm text-muted-foreground hover:underline">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
} 
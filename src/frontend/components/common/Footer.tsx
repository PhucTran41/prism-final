"use client";

import Link from "next/link";

export function Footer() {
  
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="mx-auto w-full px-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <Link href="/" className="text-lg font-medium flex items-center gap-2" aria-label="Prism Home">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 3L3 19h18L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M12 3v16M3 19l9-5m9 5l-9-5" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" />
            </svg>
            <span>Prism</span>
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
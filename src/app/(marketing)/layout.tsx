import { Header } from "@/src/frontend/components/common/Header";
import { Footer } from "@/src/frontend/components/common/Footer";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Prism - AI Planning that Actually Ships",
  description: "Turn ideas into shippable plans with AI—fast, clear, and consistent.",
  generator: 'Prism'
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}



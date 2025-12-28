import { Header } from "@/src/frontend/components/common/Header";
import { Footer } from "@/src/frontend/components/common/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}



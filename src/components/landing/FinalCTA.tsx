import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";

export const FinalCTA = () => (
  <section className="container-page py-24 md:py-32">
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-background to-background p-10 md:p-16 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%)]" />
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl mx-auto">
        Start saving better today
      </h2>
      <p className="text-muted-foreground mt-4 text-lg max-w-xl mx-auto">
        Join a new way to manage money using stablecoin-powered finance.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <Button asChild size="lg" className="rounded-full px-6 h-12 text-base">
          <a href="https://app.uniquehub.xyz">
            Launch App <ArrowRight className="ml-1" />
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-6 h-12 text-base">
          <a href="https://docs.uniquehub.xyz">
            <FileText /> View Docs
          </a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-6">Built on Base and Celo ecosystems</p>
    </div>
  </section>
);

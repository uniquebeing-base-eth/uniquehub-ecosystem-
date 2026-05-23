import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, ArrowUpRight, TrendingUp, Wallet, Send } from "lucide-react";

export const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
    <div className="container-page pt-16 pb-20 md:pt-24 md:pb-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <div className="fade-in-up space-y-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Stablecoin financial infrastructure
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-foreground">
          Save, send, and grow your money with stablecoins.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
          UniqueHub helps you store USDC and cUSD, send money instantly across borders,
          and earn yield through secure DeFi infrastructure — without complexity.
        </p>
        <div className="flex flex-wrap items-center gap-3">
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
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Non-custodial optional architecture</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Stablecoin powered</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Built for real-world finance</li>
        </ul>
      </div>

      <DashboardVisual />
    </div>
  </section>
);

const DashboardVisual = () => (
  <div className="fade-in-up relative">
    <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-2xl" />
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-10 border-b border-border bg-secondary/40">
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <span className="ml-3 text-xs text-muted-foreground">app.uniquehub.xyz</span>
      </div>
      <div className="p-6 space-y-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total balance</p>
            <p className="text-3xl font-semibold mt-1">$12,480.32</p>
          </div>
          <span className="text-sm text-emerald-600 dark:text-emerald-500 font-medium inline-flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> +4.82%
          </span>
        </div>

        <SparkChart />

        <div className="grid grid-cols-2 gap-3">
          <BalancePill symbol="USDC" amount="8,420.00" />
          <BalancePill symbol="cUSD" amount="4,060.32" />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <ActionTile icon={<Send className="h-4 w-4" />} label="Send" />
          <ActionTile icon={<Wallet className="h-4 w-4" />} label="Save" />
          <ActionTile icon={<ArrowUpRight className="h-4 w-4" />} label="Earn" />
        </div>
      </div>
    </div>
  </div>
);

const SparkChart = () => (
  <div className="h-24 rounded-xl border border-border bg-secondary/30 p-3">
    <svg viewBox="0 0 300 80" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,60 C30,55 50,40 80,42 C110,44 130,30 160,26 C190,22 210,32 240,22 C270,12 285,18 300,10 L300,80 L0,80 Z"
        fill="url(#g)"
      />
      <path
        d="M0,60 C30,55 50,40 80,42 C110,44 130,30 160,26 C190,22 210,32 240,22 C270,12 285,18 300,10"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
      />
    </svg>
  </div>
);

const BalancePill = ({ symbol, amount }: { symbol: string; amount: string }) => (
  <div className="rounded-xl border border-border bg-background p-3">
    <p className="text-xs text-muted-foreground">{symbol}</p>
    <p className="text-base font-medium mt-1">{amount}</p>
  </div>
);

const ActionTile = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="rounded-xl border border-border bg-background p-3 flex flex-col items-center justify-center gap-1.5">
    <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</span>
    <span className="text-xs font-medium">{label}</span>
  </div>
);

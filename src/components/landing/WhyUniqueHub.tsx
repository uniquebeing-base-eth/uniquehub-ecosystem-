import { Check, X } from "lucide-react";

const traditional = [
  "Slow settlement",
  "High friction",
  "Limited global access",
  "Hidden fees",
];

const uniquehub = [
  "Stablecoin-based savings",
  "Instant global transfers",
  "Transparent on-chain finance",
  "Automated yield generation",
  "User-controlled funds",
];

export const WhyUniqueHub = () => (
  <section className="bg-secondary/40 border-y border-border">
    <div className="container-page py-20 md:py-28">
      <div className="max-w-2xl mb-14">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Built for modern financial freedom
        </h2>
        <p className="text-muted-foreground mt-3 text-lg">
          Traditional finance was built for a different era. UniqueHub is built for now.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-7">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Traditional systems</p>
          <ul className="mt-5 space-y-3">
            {traditional.map((t) => (
              <li key={t} className="flex items-start gap-3 text-foreground/80">
                <X className="h-5 w-5 mt-0.5 text-muted-foreground" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-card p-7 shadow-[var(--shadow-card)]">
          <p className="text-sm uppercase tracking-wide text-primary font-medium">UniqueHub</p>
          <ul className="mt-5 space-y-3">
            {uniquehub.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <Check className="h-5 w-5 mt-0.5 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

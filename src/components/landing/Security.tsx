import { ShieldCheck, Lock, FileSearch, Eye } from "lucide-react";

const items = [
  { icon: Lock, title: "Non-custodial design options", body: "Stay in control of your funds with optional self-custody." },
  { icon: ShieldCheck, title: "Stablecoin-backed balances", body: "Funds held in USDC and cUSD — not volatile assets." },
  { icon: FileSearch, title: "Audited DeFi protocols", body: "Yield powered by established, audited infrastructure." },
  { icon: Eye, title: "On-chain verifiability", body: "Every transaction is publicly verifiable on-chain." },
];

export const Security = () => (
  <section className="bg-secondary/40 border-y border-border">
    <div className="container-page py-20 md:py-28">
      <div className="max-w-2xl mb-14">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Built with transparency in mind
        </h2>
        <p className="text-muted-foreground mt-3 text-lg">
          Security and transparency are foundational, not features.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {items.map((i) => (
          <div key={i.title} className="rounded-2xl border border-border bg-card p-7 flex gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <i.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold">{i.title}</h3>
              <p className="text-muted-foreground mt-1.5 leading-relaxed">{i.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

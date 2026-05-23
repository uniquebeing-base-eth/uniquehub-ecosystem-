const items = [
  "Stablecoin based savings",
  "DeFi-powered yield",
  "Instant global transfers",
  "Transparent financial system",
];

export const TrustStrip = () => (
  <section className="border-y border-border bg-secondary/30">
    <div className="container-page py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((t) => (
        <div key={t} className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {t}
        </div>
      ))}
    </div>
  </section>
);

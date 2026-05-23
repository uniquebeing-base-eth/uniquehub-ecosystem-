import { PiggyBank, Globe2, LineChart } from "lucide-react";

const features = [
  {
    icon: PiggyBank,
    title: "Save",
    body: "Store stablecoins in flexible or locked savings vaults designed for real financial goals.",
  },
  {
    icon: Globe2,
    title: "Send",
    body: "Transfer stablecoins instantly across borders with low fees and fast settlement.",
  },
  {
    icon: LineChart,
    title: "Earn",
    body: "Earn yield automatically through trusted DeFi protocols like Aave and Moonwell.",
  },
];

export const Features = () => (
  <section id="product" className="container-page py-20 md:py-28">
    <div className="max-w-2xl mb-14">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">What UniqueHub does</h2>
      <p className="text-muted-foreground mt-3 text-lg">
        Three core financial primitives, built on stablecoin rails.
      </p>
    </div>
    <div className="grid md:grid-cols-3 gap-6">
      {features.map((f) => (
        <div
          key={f.title}
          className="rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-shadow"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <f.icon className="h-5 w-5" />
          </span>
          <h3 className="text-xl font-semibold mt-5">{f.title}</h3>
          <p className="text-muted-foreground mt-2 leading-relaxed">{f.body}</p>
        </div>
      ))}
    </div>
  </section>
);

const steps = [
  { n: "01", title: "Create an account", body: "Sign up to UniqueHub in seconds." },
  { n: "02", title: "Deposit stablecoins", body: "Fund your account with USDC or cUSD." },
  { n: "03", title: "Save, send, or lock", body: "Move funds, set goals, or commit to vaults." },
  { n: "04", title: "Earn yield automatically", body: "Idle balances generate yield via audited protocols." },
  { n: "05", title: "Withdraw anytime", body: "Spend or withdraw whenever you need to." },
];

export const HowItWorks = () => (
  <section className="container-page py-20 md:py-28">
    <div className="max-w-2xl mb-14">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">How it works</h2>
      <p className="text-muted-foreground mt-3 text-lg">
        From deposit to yield in a few clear steps.
      </p>
    </div>
    <ol className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
      {steps.map((s) => (
        <li key={s.n} className="rounded-2xl border border-border bg-card p-6">
          <span className="text-xs font-mono text-primary">{s.n}</span>
          <h3 className="font-semibold mt-2">{s.title}</h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.body}</p>
        </li>
      ))}
    </ol>
  </section>
);

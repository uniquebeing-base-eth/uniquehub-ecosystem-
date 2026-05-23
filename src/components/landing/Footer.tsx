export const Footer = () => (
  <footer className="border-t border-border">
    <div className="container-page py-12 grid gap-8 md:grid-cols-2 items-start">
      <div>
        <div className="flex items-center gap-2 font-semibold tracking-tight text-lg">
          <span className="inline-block h-6 w-6 rounded-md bg-primary" aria-hidden />
          UniqueHub
        </div>
        <p className="text-sm text-muted-foreground mt-3 max-w-md">
          A stablecoin-based financial system for saving, sending, and earning yield globally.
        </p>
      </div>
      <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm md:justify-end">
        <a href="https://app.uniquehub.xyz" className="text-muted-foreground hover:text-foreground">App</a>
        <a href="https://docs.uniquehub.xyz" className="text-muted-foreground hover:text-foreground">Docs</a>
        <a href="/terms" className="text-muted-foreground hover:text-foreground">Terms</a>
        <a href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</a>
      </nav>
    </div>
    <div className="border-t border-border">
      <div className="container-page py-6 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} UniqueHub. All rights reserved.</p>
        <p>UniqueHub provides access to DeFi protocols. Not a bank.</p>
      </div>
    </div>
  </footer>
);

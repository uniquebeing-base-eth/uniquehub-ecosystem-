import { Link } from "react-router-dom";

const DOCS = "https://docs.uniquehub.xyz";

const cols: { title: string; links: [string, string][] }[] = [
  { title: "Solutions", links: [["AI & Automation", "/#capabilities"], ["Software & Product", "/#capabilities"], ["Infrastructure", "/#capabilities"], ["Security", "/#capabilities"]] },
  { title: "Advisory", links: [["Consultation", DOCS], ["Technology Assessment", DOCS], ["Strategy", DOCS], ["Implementation Planning", DOCS]] },
  { title: "Products", links: [["Savings & Investment", "/products/savings"]] },
  { title: "Resources", links: [["Docs", DOCS], ["Research", DOCS], ["Insights", DOCS], ["Blog", DOCS], ["Case Studies", "/#proof"]] },
  { title: "Company", links: [["About", DOCS], ["Careers", "mailto:team@uniquehub.xyz"], ["Community", DOCS], ["Contact", "/#contact"]] },
];

const FLink = ({ href, label }: { href: string; label: string }) =>
  href.startsWith("/") && !href.includes("#") ? (
    <Link to={href} className="text-muted-foreground hover:text-foreground">{label}</Link>
  ) : (
    <a href={href} className="text-muted-foreground hover:text-foreground">{label}</a>
  );

export const Footer = () => (
  <footer className="border-t border-border">
    <div className="container-page py-14 grid gap-10 lg:grid-cols-[1.4fr_repeat(6,1fr)]">
      <div className="sm:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-2 font-semibold tracking-tight text-lg">
          <span className="inline-block h-6 w-6 rounded-md bg-primary" aria-hidden />
          UniqueHub
        </div>
        <p className="text-sm font-medium mt-3">Technology Innovation & Implementation</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          Helping companies and startups stay ahead with technology.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:contents">
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-medium">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([l, h]) => <li key={l}><FLink href={h} label={l} /></li>)}
            </ul>
          </div>
        ))}
        <div>
          <p className="text-sm font-medium">Contact</p>
          <ul className="mt-3 space-y-2 text-sm">
            {["team", "support", "info"].map((e) => (
              <li key={e}><a href={`mailto:${e}@uniquehub.xyz`} className="text-muted-foreground hover:text-foreground break-all">{e}@uniquehub.xyz</a></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container-page py-6 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} UniqueHub. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="/privacy" className="hover:text-foreground">Privacy Policy</a>
          <a href="/terms" className="hover:text-foreground">Terms</a>
        </div>
      </div>
    </div>
  </footer>
);

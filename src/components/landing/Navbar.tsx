import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DOCS = "https://docs.uniquehub.xyz";

type Item = { label: string; href: string };
type Group = { label: string; items?: Item[]; href?: string };

const nav: Group[] = [
  {
    label: "Solutions",
    items: [
      { label: "AI & Automation", href: "/#capabilities" },
      { label: "Software & Product", href: "/#capabilities" },
      { label: "Infrastructure", href: "/#capabilities" },
      { label: "Security", href: "/#capabilities" },
    ],
  },
  {
    label: "Advisory",
    items: [
      { label: "Technology Consultation", href: DOCS },
      { label: "Technology Assessment", href: DOCS },
      { label: "Idea Formation", href: DOCS },
      { label: "Technology Strategy", href: DOCS },
      { label: "Implementation Planning", href: DOCS },
      { label: "Technical Due Diligence", href: DOCS },
      { label: "Build vs Buy", href: DOCS },
    ],
  },
  { label: "Products", items: [{ label: "Savings & Investment", href: "/products/savings" }] },
  {
    label: "Research",
    items: [
      { label: "Research", href: DOCS },
      { label: "Technology Reports", href: DOCS },
      { label: "Engineering", href: DOCS },
      { label: "Insights", href: DOCS },
      { label: "Blog", href: DOCS },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "About", href: DOCS },
      { label: "How We Work", href: DOCS },
      { label: "Case Studies", href: "/#proof" },
      { label: "Careers", href: "mailto:team@uniquehub.xyz" },
      { label: "Community", href: DOCS },
      { label: "Contact", href: "/#contact" },
    ],
  },
];

const NavLink = ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) =>
  href.startsWith("/") && !href.includes("#") ? (
    <Link to={href} className={className}>{children}</Link>
  ) : (
    <a href={href} className={className}>{children}</a>
  );

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all",
        scrolled || open ? "bg-background/90 backdrop-blur-md border-b border-border" : "bg-transparent"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-lg">
          <span className="inline-block h-6 w-6 rounded-md bg-primary" aria-hidden />
          UniqueHub
        </Link>
        <nav className="hidden lg:flex items-center gap-6 text-sm text-muted-foreground">
          {nav.map((g) => (
            <div key={g.label} className="relative group">
              <button className="inline-flex items-center gap-1 py-5 hover:text-foreground transition-colors">
                {g.label} <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-0 top-full min-w-56 rounded-xl border border-border bg-popover p-2 shadow-[var(--shadow-card)]">
                {g.items!.map((i) => (
                  <NavLink key={i.label} href={i.href} className="block rounded-lg px-3 py-2 text-foreground/80 hover:bg-secondary hover:text-foreground">
                    {i.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          <a href={DOCS} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            Docs <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="rounded-full px-5 hidden sm:inline-flex">
            <a href="/#contact">Contact</a>
          </Button>
          <button className="lg:hidden p-2" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background max-h-[75vh] overflow-y-auto">
          <div className="container-page py-4 space-y-5">
            {nav.map((g) => (
              <div key={g.label}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{g.label}</p>
                <div className="grid grid-cols-2 gap-1">
                  {g.items!.map((i) => (
                    <NavLink key={i.label} href={i.href} className="text-sm py-1.5">{i.label}</NavLink>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-4 pt-2 border-t border-border text-sm">
              <a href={DOCS} className="py-2 font-medium">Docs ↗</a>
              <a href="/#contact" className="py-2 font-medium" onClick={() => setOpen(false)}>Contact</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

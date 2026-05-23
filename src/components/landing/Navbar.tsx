import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

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
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight text-lg">
          <span className="inline-block h-6 w-6 rounded-md bg-primary" aria-hidden />
          UniqueHub
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#product" className="hover:text-foreground transition-colors">Product</a>
          <a href="https://docs.uniquehub.xyz" className="hover:text-foreground transition-colors">Docs</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="rounded-full px-5">
            <a href="https://app.uniquehub.xyz">Launch App</a>
          </Button>
        </div>
      </div>
    </header>
  );
};

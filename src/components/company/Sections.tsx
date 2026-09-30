import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight, Compass, Bot, Code2, Hammer, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const DOCS = "https://docs.uniquehub.xyz";

export const CompanyHero = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.07),transparent_60%)]" />
    <div className="container-page pt-20 pb-20 md:pt-32 md:pb-28">
      <div className="fade-in-up max-w-3xl space-y-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Technology Innovation & Implementation
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight leading-[1.03]">
          Stay ahead of technology.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          UniqueHub helps companies and startups identify, adopt and implement technology that creates real business value.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="rounded-full px-6 h-12 text-base">
            <a href="#contact">Talk to UniqueHub <ArrowRight className="ml-1" /></a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-6 h-12 text-base">
            <a href="#capabilities">Explore capabilities</a>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export const Intro = () => (
  <section className="border-y border-border bg-secondary/30">
    <div className="container-page py-20 md:py-24 grid md:grid-cols-2 gap-10">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
        Technology moves fast. Businesses shouldn’t have to figure everything out alone.
      </h2>
      <div className="space-y-5">
        <p className="text-lg text-muted-foreground leading-relaxed">
          UniqueHub helps companies understand new technologies, determine whether they are actually useful, and turn the right ideas into working systems.
        </p>
        <a href={DOCS} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          Explore the UniqueHub Docs <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  </section>
);

const caps = [
  { icon: Compass, title: "Advisory", body: "Technology consultation, assessment, strategy, idea formation and implementation planning." },
  { icon: Bot, title: "AI & Automation", body: "AI integration, agents, workflow automation and intelligent business systems." },
  { icon: Code2, title: "Software & Technology", body: "Product development, applications, APIs, integrations and infrastructure." },
  { icon: Hammer, title: "Implementation", body: "Turning validated technology strategies into working systems." },
];

export const Capabilities = () => (
  <section id="capabilities" className="container-page py-20 md:py-28 scroll-mt-20">
    <div className="max-w-2xl mb-14">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Capabilities</h2>
      <p className="text-muted-foreground mt-3 text-lg">From first question to working system.</p>
    </div>
    <div className="grid sm:grid-cols-2 gap-6">
      {caps.map((c) => (
        <div key={c.title} className="rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-shadow flex flex-col">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <c.icon className="h-5 w-5" />
          </span>
          <h3 className="text-xl font-semibold mt-5">{c.title}</h3>
          <p className="text-muted-foreground mt-2 leading-relaxed flex-1">{c.body}</p>
          <a href={DOCS} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Learn more <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      ))}
    </div>
  </section>
);

const options = ["Build", "Buy", "Integrate", "Improve", "Don’t Build"];

export const Philosophy = () => (
  <section className="bg-secondary/40 border-y border-border">
    <div className="container-page py-20 md:py-28">
      <p className="text-sm uppercase tracking-wide text-primary font-medium">Our philosophy</p>
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mt-3 max-w-3xl">Technology should solve a problem.</h2>
      <p className="text-muted-foreground mt-5 text-lg max-w-2xl leading-relaxed">
        UniqueHub does not recommend technology simply because it is new or popular. We help companies determine whether they should:
      </p>
      <div className="flex flex-wrap gap-3 mt-8">
        {options.map((o, i) => (
          <span
            key={o}
            className={
              i === options.length - 1
                ? "rounded-full border border-primary/40 bg-primary/10 text-primary px-5 py-2 font-medium"
                : "rounded-full border border-border bg-card px-5 py-2 font-medium"
            }
          >
            {o}
          </span>
        ))}
      </div>
      <a href={DOCS} className="mt-8 inline-flex items-center gap-1 font-medium text-primary hover:underline">
        View our methodology <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  </section>
);

export const OpenProof = () => (
  <section id="proof" className="container-page py-20 md:py-28 scroll-mt-20">
    <div className="grid md:grid-cols-2 gap-10 items-start">
      <div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Show the work.</h2>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
          We document what we build, what we learn and the outcomes we create.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-border p-7">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> In progress
        </div>
        <p className="text-lg font-medium mt-3">Our first projects are underway.</p>
        <p className="text-muted-foreground mt-2">Case studies will be published here as they are completed.</p>
      </div>
    </div>
  </section>
);

export const ProductsTeaser = () => (
  <section className="container-page pb-20 md:pb-28">
    <div className="flex items-end justify-between gap-6 mb-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Products</p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-2">Built by UniqueHub</h2>
      </div>
    </div>
    <Link to="/products/savings" className="group block rounded-2xl border border-border bg-card p-7 hover:shadow-[var(--shadow-card)] transition-shadow">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h3 className="text-xl font-semibold">Savings & Investment</h3>
          <p className="text-muted-foreground mt-2 max-w-xl">Save, send and earn yield with stablecoins like USDC and cUSD.</p>
        </div>
        <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">Explore product <ArrowRight className="h-4 w-4" /></span>
    </Link>
  </section>
);

export const ContactCTA = () => (
  <section id="contact" className="container-page pb-24 md:pb-32 scroll-mt-20">
    <div className="rounded-3xl border border-border bg-secondary/40 p-10 md:p-16 text-center">
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl mx-auto">Have a technology question?</h2>
      <p className="text-muted-foreground mt-4 text-lg max-w-xl mx-auto">
        Tell us what you’re trying to solve. We’ll help you work out what’s worth building.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <Button asChild size="lg" className="rounded-full px-6 h-12 text-base">
          <a href="mailto:team@uniquehub.xyz"><Mail /> team@uniquehub.xyz</a>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-6 h-12 text-base">
          <a href={DOCS}>Explore the docs <ArrowUpRight /></a>
        </Button>
      </div>
    </div>
  </section>
);

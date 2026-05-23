import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { Features } from "@/components/landing/Features";
import { WhyUniqueHub } from "@/components/landing/WhyUniqueHub";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Security } from "@/components/landing/Security";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const Landing = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "UniqueHub",
    url: "https://uniquehub.xyz",
    description:
      "UniqueHub is a stablecoin-based financial platform that enables users to save, send, and earn yield using USDC and cUSD powered by DeFi infrastructure.",
  };

  return (
    <>
      <Helmet>
        <title>UniqueHub — Stablecoin Financial System for Saving and Yield</title>
        <meta
          name="description"
          content="UniqueHub is a stablecoin-based financial platform that enables users to save, send, and earn yield using USDC and cUSD powered by DeFi infrastructure."
        />
        <link rel="canonical" href="https://uniquehub.xyz" />
        <meta property="og:title" content="UniqueHub — Stablecoin Financial System for Saving and Yield" />
        <meta
          property="og:description"
          content="Save, send, and grow your money with stablecoins. Powered by audited DeFi infrastructure."
        />
        <meta property="og:url" content="https://uniquehub.xyz" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <TrustStrip />
          <Features />
          <WhyUniqueHub />
          <HowItWorks />
          <Security />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Landing;

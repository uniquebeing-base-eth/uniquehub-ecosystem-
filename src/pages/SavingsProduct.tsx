import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/landing/Navbar";
import { SavingsHero } from "@/components/landing/SavingsHero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { Features } from "@/components/landing/Features";
import { WhyUniqueHub } from "@/components/landing/WhyUniqueHub";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Security } from "@/components/landing/Security";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const SavingsProduct = () => {
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
        <title>UniqueHub Savings & Investment — Stablecoin Savings and Yield</title>
        <meta
          name="description"
          content="UniqueHub is a stablecoin-based financial platform that enables users to save, send, and earn yield using USDC and cUSD powered by DeFi infrastructure."
        />
        <link rel="canonical" href="https://uniquehub.xyz/products/savings" />
        <meta property="og:title" content="UniqueHub Savings & Investment — Stablecoin Savings and Yield" />
        <meta
          property="og:description"
          content="Save, send, and grow your money with stablecoins. Powered by audited DeFi infrastructure."
        />
        <meta property="og:url" content="https://uniquehub.xyz/products/savings" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1">
          <SavingsHero />
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

export default SavingsProduct;

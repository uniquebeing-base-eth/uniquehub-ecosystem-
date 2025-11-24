import { MarketplaceSection } from "@/components/sections/MarketplaceSection";
import { Helmet } from "react-helmet-async";

const Marketplace = () => {
  return (
    <>
      <Helmet>
        <title>Marketplace - UniqueHub</title>
        <meta name="description" content="Buy and sell unique digital items on UniqueHub's decentralized marketplace" />
        <meta property="og:title" content="Marketplace - UniqueHub" />
        <meta property="og:description" content="Buy and sell unique digital items on UniqueHub's decentralized marketplace" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/marketplace" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Open Marketplace" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/marketplace" />
      </Helmet>
      <MarketplaceSection />
    </>
  );
};

export default Marketplace;

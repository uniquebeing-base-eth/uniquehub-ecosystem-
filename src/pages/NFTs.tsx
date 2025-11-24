import { NFTSection } from "@/components/sections/NFTSection";
import { Helmet } from "react-helmet-async";

const NFTs = () => {
  return (
    <>
      <Helmet>
        <title>Unique NFTs - UniqueHub</title>
        <meta name="description" content="Generate your own unique Avatar NFT on UniqueHub" />
        <meta property="og:title" content="Unique NFTs - UniqueHub" />
        <meta property="og:description" content="Generate your own unique Avatar NFT on UniqueHub" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/nft" />
      </Helmet>
      
      <NFTSection />
    </>
  );
};

export default NFTs;

import { WalletSection } from "@/components/sections/WalletSection";
import { Helmet } from "react-helmet-async";

const Wallet = () => {
  return (
    <>
      <Helmet>
        <title>Wallet - UniqueHub</title>
        <meta name="description" content="Connect your wallet and manage your crypto assets on UniqueHub" />
        <meta property="og:title" content="Wallet - UniqueHub" />
        <meta property="og:description" content="Connect your wallet and manage your crypto assets on UniqueHub" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/wallet" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Open Wallet" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/wallet" />
      </Helmet>
      <WalletSection />
    </>
  );
};

export default Wallet;

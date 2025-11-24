import { EarnSection } from "@/components/sections/EarnSection";
import { Helmet } from "react-helmet-async";

const Earn = () => {
  return (
    <>
      <Helmet>
        <title>Earn Rewards - UniqueHub</title>
        <meta name="description" content="Earn points and rewards through daily activities, learning and trading on UniqueHub" />
        <meta property="og:title" content="Earn Rewards - UniqueHub" />
        <meta property="og:description" content="Earn points and rewards through daily activities, learning and trading on UniqueHub" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/earn" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Start Earning" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/earn" />
      </Helmet>
      <EarnSection />
    </>
  );
};

export default Earn;

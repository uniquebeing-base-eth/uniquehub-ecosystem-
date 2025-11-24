import { QuestSection } from "@/components/sections/QuestSection";
import { Helmet } from "react-helmet-async";

const Quest = () => {
  return (
    <>
      <Helmet>
        <title>Quest Learning - UniqueHub</title>
        <meta name="description" content="Join quest-based learning pools, compete and earn rewards on UniqueHub" />
        <meta property="og:title" content="Quest Learning - UniqueHub" />
        <meta property="og:description" content="Join quest-based learning pools, compete and earn rewards on UniqueHub" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/quest" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Start Quest" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/quest" />
      </Helmet>
      <QuestSection />
    </>
  );
};

export default Quest;

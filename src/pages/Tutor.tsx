import { TutorSection } from "@/components/sections/TutorSection";
import { Helmet } from "react-helmet-async";

const Tutor = () => {
  return (
    <>
      <Helmet>
        <title>Become a Tutor - UniqueHub</title>
        <meta name="description" content="Become a tutor on UniqueHub and earn by teaching Web3 skills" />
        <meta property="og:title" content="Become a Tutor - UniqueHub" />
        <meta property="og:description" content="Become a tutor on UniqueHub and earn by teaching Web3 skills" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/tutor" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Become Tutor" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/tutor" />
      </Helmet>
      <TutorSection />
    </>
  );
};

export default Tutor;

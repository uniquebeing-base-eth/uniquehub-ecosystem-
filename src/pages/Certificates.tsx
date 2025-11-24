import { CertificatesSection } from "@/components/sections/CertificatesSection";
import { Helmet } from "react-helmet-async";

const Certificates = () => {
  return (
    <>
      <Helmet>
        <title>Certificates - UniqueHub</title>
        <meta name="description" content="View and claim your course completion certificates as NFTs on UniqueHub" />
        <meta property="og:title" content="Certificates - UniqueHub" />
        <meta property="og:description" content="View and claim your course completion certificates as NFTs on UniqueHub" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/certificates" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="View Certificates" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/certificates" />
      </Helmet>
      <CertificatesSection />
    </>
  );
};

export default Certificates;

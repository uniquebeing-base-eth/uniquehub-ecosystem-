import { UploadSection } from "@/components/sections/UploadSection";
import { Helmet } from "react-helmet-async";

const Upload = () => {
  return (
    <>
      <Helmet>
        <title>Upload Course - UniqueHub</title>
        <meta name="description" content="Upload and share your courses on UniqueHub. Teach and earn from your knowledge" />
        <meta property="og:title" content="Upload Course - UniqueHub" />
        <meta property="og:description" content="Upload and share your courses on UniqueHub. Teach and earn from your knowledge" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/upload" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Upload Course" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/upload" />
      </Helmet>
      <UploadSection />
    </>
  );
};

export default Upload;

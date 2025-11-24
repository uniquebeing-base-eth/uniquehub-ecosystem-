import { CoursesSection } from "@/components/sections/CoursesSection";
import { Helmet } from "react-helmet-async";

const Courses = () => {
  return (
    <>
      <Helmet>
        <title>Courses - UniqueHub</title>
        <meta name="description" content="Explore and enroll in Web3 courses on UniqueHub. Learn blockchain, NFTs, DeFi and more" />
        <meta property="og:title" content="Courses - UniqueHub" />
        <meta property="og:description" content="Explore and enroll in Web3 courses on UniqueHub. Learn blockchain, NFTs, DeFi and more" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/courses" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Browse Courses" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/courses" />
      </Helmet>
      <CoursesSection />
    </>
  );
};

export default Courses;

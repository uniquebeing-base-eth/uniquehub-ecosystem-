import { ProfileSection } from "@/components/sections/ProfileSection";
import { Helmet } from "react-helmet-async";

const Profile = () => {
  return (
    <>
      <Helmet>
        <title>Profile - UniqueHub</title>
        <meta name="description" content="View and manage your UniqueHub profile, achievements and learning progress" />
        <meta property="og:title" content="Profile - UniqueHub" />
        <meta property="og:description" content="View and manage your UniqueHub profile, achievements and learning progress" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/profile" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="View Profile" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/profile" />
      </Helmet>
      <ProfileSection />
    </>
  );
};

export default Profile;

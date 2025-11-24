import { HomeSection } from "@/components/sections/HomeSection";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet-async";

const Home = () => {
  const { user } = useAuth();
  return (
    <>
      <Helmet>
        <title>UniqueHub - Web3 Learning & Trading Platform</title>
        <meta name="description" content="Learn Web3, earn rewards, trade NFTs and discover unique digital experiences on UniqueHub" />
        <meta property="og:title" content="UniqueHub - Web3 Learning & Trading Platform" />
        <meta property="og:description" content="Learn Web3, earn rewards, trade NFTs and discover unique digital experiences" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="Open UniqueHub" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/" />
      </Helmet>
      <HomeSection userName={user?.user_metadata?.display_name || user?.user_metadata?.username || 'Uniquebeing'} />
    </>
  );
};

export default Home;

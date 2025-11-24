import { Leaderboard } from "@/components/Leaderboard";
import { Helmet } from "react-helmet-async";

const LeaderboardPage = () => {
  return (
    <>
      <Helmet>
        <title>Leaderboard - UniqueHub</title>
        <meta name="description" content="Top performers on UniqueHub. See who's leading in learning and earning" />
        <meta property="og:title" content="Leaderboard - UniqueHub" />
        <meta property="og:description" content="Top performers on UniqueHub. See who's leading in learning and earning" />
        <meta property="og:image" content="https://uniqueehub.vercel.app/opengraph-image.png" />
        <meta property="og:url" content="https://uniqueehub.vercel.app/leaderboard" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:button:1" content="View Leaderboard" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://uniqueehub.vercel.app/leaderboard" />
      </Helmet>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Top performers on UniqueHub</p>
        </div>
        <Leaderboard />
      </div>
    </>
  );
};

export default LeaderboardPage;

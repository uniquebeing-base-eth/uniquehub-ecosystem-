import { Leaderboard } from "@/components/Leaderboard";

const LeaderboardPage = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">Top performers on UniqueHub</p>
      </div>
      <Leaderboard />
    </div>
  );
};

export default LeaderboardPage;

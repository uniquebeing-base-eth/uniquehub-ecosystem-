

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Users, Flame } from "lucide-react";
import { CreatorLeaderboard } from "@/components/CreatorLeaderboard";
import { LearnerLeaderboard } from "@/components/LearnerLeaderboard";
import animeEarnBg from "@/assets/anime-earn-bg.jpg";


export const Leaderboard = () => {
  const [activeView, setActiveView] = useState<"creators" | "learners">("learners");

  return (
    <Card className="p-5 bg-card border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Leaderboards</h3>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Creators Card */}
        <div
          onClick={() => setActiveView("creators")}
          className={`relative p-4 rounded-xl cursor-pointer transition-all overflow-hidden ${
            activeView === "creators" ? "ring-2 ring-primary scale-105" : "hover:scale-105"
          }`}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${animeEarnBg})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-br transition-all ${
            activeView === "creators" 
              ? "from-primary/95 to-primary/80" 
              : "from-primary/90 to-primary/70"
          }`} />
          
          <div className="relative z-10 text-center">
            <Users className="w-8 h-8 text-white mx-auto mb-2" />
            <h4 className="font-bold text-white text-sm mb-1">Creators</h4>
            <p className="text-xs text-white/80">Top content creators</p>
          </div>
        </div>

        {/* Learners Card */}
        <div
          onClick={() => setActiveView("learners")}
          className={`relative p-4 rounded-xl cursor-pointer transition-all overflow-hidden ${
            activeView === "learners" ? "ring-2 ring-orange-500 scale-105" : "hover:scale-105"
          }`}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${animeEarnBg})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-br transition-all ${
            activeView === "learners"
              ? "from-orange-600/95 to-orange-500/80"
              : "from-orange-600/90 to-orange-500/70"
          }`} />
          
          <div className="relative z-10 text-center">
            <Flame className="w-8 h-8 text-white mx-auto mb-2" />
            <h4 className="font-bold text-white text-sm mb-1">Learners</h4>
            <p className="text-xs text-white/80">Top learners</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="max-h-[50vh] overflow-y-auto pb-4">
        {activeView === "creators" ? <CreatorLeaderboard /> : <LearnerLeaderboard />}
      </div>
    </Card>
  );
};

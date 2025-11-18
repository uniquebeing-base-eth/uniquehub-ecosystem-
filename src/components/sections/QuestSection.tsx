import { useState } from "react";
import { Trophy, BookOpen, Target } from "lucide-react";
import { LearningHub } from "@/components/quest/LearningHub";
import { LearningPool } from "@/components/quest/LearningPool";

export const QuestSection = () => {
  const [activeHub, setActiveHub] = useState<'learning' | 'pool' | null>(null);

  if (activeHub === 'learning') {
    return <LearningHub onBack={() => setActiveHub(null)} />;
  }

  if (activeHub === 'pool') {
    return <LearningPool onBack={() => setActiveHub(null)} />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <Trophy className="w-20 h-20 mx-auto mb-4 text-primary animate-pulse" />
          <h1 className="text-4xl font-bold mb-3 text-primary">Quest Hub</h1>
          <p className="text-lg text-muted-foreground">
            Choose your learning adventure
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Learning Hub Card */}
          <button
            onClick={() => setActiveHub('learning')}
            className="group relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-glow"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative z-10">
              <BookOpen className="w-16 h-16 mb-4 text-primary group-hover:scale-110 transition-transform" />
              <h2 className="text-2xl font-bold mb-3 text-foreground">Learning Hub</h2>
              <p className="text-muted-foreground mb-4">
                Daily learning streaks, unlock modules, and earn UP points
              </p>
              <div className="flex items-center gap-2 text-sm text-primary">
                <Target className="w-4 h-4" />
                <span className="font-medium">Build your streak</span>
              </div>
            </div>
          </button>

          {/* Learning Pool Card */}
          <button
            onClick={() => setActiveHub('pool')}
            className="group relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-accent/20 to-primary/20 border-2 border-accent/30 hover:border-accent transition-all duration-300 hover:scale-105 hover:shadow-glow"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative z-10">
              <Trophy className="w-16 h-16 mb-4 text-accent group-hover:scale-110 transition-transform" />
              <h2 className="text-2xl font-bold mb-3 text-foreground">Learning Pool</h2>
              <p className="text-muted-foreground mb-4">
                Compete in special campaigns for rewards and prizes
              </p>
              <div className="flex items-center gap-2 text-sm text-accent">
                <Trophy className="w-4 h-4" />
                <span className="font-medium">Win rewards</span>
              </div>
            </div>
          </button>
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid md:grid-cols-2 gap-4 animate-fade-in">
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              Keep Your Streak
            </h3>
            <p className="text-sm text-muted-foreground">
              Complete at least one module daily to maintain your learning streak
            </p>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              Earn UP Points
            </h3>
            <p className="text-sm text-muted-foreground">
              Every module completion rewards you with UP points
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

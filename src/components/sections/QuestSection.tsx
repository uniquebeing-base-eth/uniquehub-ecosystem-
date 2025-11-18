import { useState } from "react";
import { Trophy, BookOpen, Target } from "lucide-react";
import { LearningHub } from "@/components/quest/LearningHub";
import { LearningPool } from "@/components/quest/LearningPool";
import { InitializeCourses } from "@/components/quest/InitializeCourses";

export const QuestSection = () => {
  const [activeHub, setActiveHub] = useState<'learning' | 'pool' | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (!initialized) {
    return <InitializeCourses onComplete={() => setInitialized(true)} />;
  }

  if (activeHub === 'learning') {
    return <LearningHub onBack={() => setActiveHub(null)} />;
  }

  if (activeHub === 'pool') {
    return <LearningPool onBack={() => setActiveHub(null)} />;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 animate-fade-in">
          <Trophy className="w-16 h-16 mx-auto mb-3 text-primary animate-pulse" />
          <h1 className="text-3xl font-bold mb-2 text-primary">Quest Hub</h1>
          <p className="text-sm text-muted-foreground">
            Choose your learning adventure
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          {/* Learning Hub Card */}
          <button
            onClick={() => setActiveHub('learning')}
            className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 hover:border-primary transition-all duration-300 hover:shadow-glow"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(/src/assets/anime-bg-learn.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="relative z-10 flex items-center gap-4">
              <BookOpen className="w-12 h-12 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
              <div className="text-left flex-1">
                <h2 className="text-xl font-bold mb-1 text-foreground">Learning Hub</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Daily learning streaks, unlock modules, and earn UP points
                </p>
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Target className="w-3 h-3" />
                  <span className="font-medium">Build your streak</span>
                </div>
              </div>
            </div>
          </button>

          {/* Learning Pool Card */}
          <button
            onClick={() => setActiveHub('pool')}
            className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-accent/20 to-primary/20 border-2 border-accent/30 hover:border-accent transition-all duration-300 hover:shadow-glow"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(/src/assets/anime-earn-bg.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="relative z-10 flex items-center gap-4">
              <Trophy className="w-12 h-12 text-accent group-hover:scale-110 transition-transform flex-shrink-0" />
              <div className="text-left flex-1">
                <h2 className="text-xl font-bold mb-1 text-foreground">Learning Pool</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Compete in special campaigns for rewards and prizes
                </p>
                <div className="flex items-center gap-2 text-xs text-accent">
                  <Trophy className="w-3 h-3" />
                  <span className="font-medium">Win rewards</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <div className="p-4 rounded-lg bg-card border border-border">
            <h3 className="font-semibold mb-1 flex items-center gap-1 text-sm">
              <span className="text-lg">🔥</span>
              Keep Your Streak
            </h3>
            <p className="text-xs text-muted-foreground">
              Complete at least one module daily
            </p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <h3 className="font-semibold mb-1 flex items-center gap-1 text-sm">
              <span className="text-lg">⭐</span>
              Earn UP Points
            </h3>
            <p className="text-xs text-muted-foreground">
              Every module completion rewards you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

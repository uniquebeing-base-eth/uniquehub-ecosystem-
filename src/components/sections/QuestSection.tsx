import { Trophy } from "lucide-react";
import { LearningHub } from "@/components/quest/LearningHub";
import { useAuth } from "@/hooks/useAuth";

export const QuestSection = () => {
  const { user } = useAuth();
  
  // Only show for authenticated users with wallet (you can test)
  // Remove this check later when ready to launch
  const canViewQuest = user?.id;

  if (!canViewQuest) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24 relative overflow-hidden">
        {/* Background with anime aesthetic */}
        <div 
          className="absolute inset-0 opacity-20 blur-sm"
          style={{
            backgroundImage: `url(/src/assets/anime-bg-learn.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
          <div className="text-center animate-fade-in backdrop-blur-md bg-card/50 p-8 rounded-2xl border-2 border-primary/30">
            <Trophy className="w-20 h-20 mx-auto mb-4 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold mb-3 text-primary">Quest Hub</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Epic learning adventures await
            </p>
            <div className="inline-block px-6 py-3 rounded-full bg-primary/20 border border-primary/50">
              <span className="text-xl font-bold text-primary">Coming Soon</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 max-w-md">
              We're crafting an amazing learning experience with daily streaks, rewards, and competitions. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <LearningHub onBack={() => {}} />;
};

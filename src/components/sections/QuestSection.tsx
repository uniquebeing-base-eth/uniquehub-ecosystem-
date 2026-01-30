

import { useState } from "react";
import { LearningHub } from "@/components/quest/LearningHub";
import { LearningPool } from "@/components/quest/LearningPool";
import learningHubBg from "@/assets/quest-learning-hub-bg-blue.jpg";
import learningPoolBg from "@/assets/quest-learning-pool-bg-blue.jpg";

export const QuestSection = () => {
  const [activeView, setActiveView] = useState<"menu" | "learning-hub" | "learning-pool">("menu");

  if (activeView === "learning-hub") {
    return <LearningHub onBack={() => setActiveView("menu")} />;
  }

  if (activeView === "learning-pool") {
    return <LearningPool onBack={() => setActiveView("menu")} />;
  }

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
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 text-primary">Quest Hub</h1>
          <p className="text-lg text-muted-foreground">
            Choose your learning adventure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => setActiveView("learning-hub")} 
            className="cursor-pointer rounded-xl overflow-hidden shadow-card border border-border hover:border-primary/50 transition-all duration-300 group animate-fade-in"
          >
            <div 
              className="relative h-48 flex items-center justify-center"
              style={{
                backgroundImage: `url(${learningHubBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-background/20 group-hover:from-background/95 transition-all duration-300" />
              <div className="relative z-10 text-center px-4">
                <h3 className="text-2xl font-bold text-foreground drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">Learning Hub</h3>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => setActiveView("learning-pool")} 
            className="cursor-pointer rounded-xl overflow-hidden shadow-card border border-border hover:border-primary/50 transition-all duration-300 group animate-fade-in"
          >
            <div 
              className="relative h-48 flex items-center justify-center"
              style={{
                backgroundImage: `url(${learningPoolBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-background/20 group-hover:from-background/95 transition-all duration-300" />
              <div className="relative z-10 text-center px-4">
                <h3 className="text-2xl font-bold text-foreground drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">Learning Pool</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

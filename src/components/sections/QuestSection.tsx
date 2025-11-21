import { useState } from "react";
import { BookOpen, Trophy } from "lucide-react";
import { LearningHub } from "@/components/quest/LearningHub";
import { LearningPool } from "@/components/quest/LearningPool";
import { CourseCard } from "@/components/CourseCard";

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
          <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-3 text-primary">Quest Hub</h1>
          <p className="text-lg text-muted-foreground">
            Choose your learning adventure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div onClick={() => setActiveView("learning-hub")} className="cursor-pointer">
            <CourseCard
              title="Learning Hub"
              icon={<BookOpen className="w-full h-full" />}
            />
          </div>
          <div onClick={() => setActiveView("learning-pool")} className="cursor-pointer">
            <CourseCard
              title="Learning Pool"
              icon={<Trophy className="w-full h-full" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

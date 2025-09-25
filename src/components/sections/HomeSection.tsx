import { EarningCard } from "@/components/EarningCard";
import { TutorInfo } from "@/components/TutorInfo";
import { BookOpen, DollarSign, Users, Trophy, GraduationCap, Coins } from "lucide-react";
import heroImage from "@/assets/uniquehub-hero.jpg";

export const HomeSection = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section with Anime Background */}
      <div 
        className="relative rounded-2xl overflow-hidden bg-cover bg-center min-h-[300px] flex items-center justify-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="text-4xl font-bold mb-4">
            UniqueHub
          </h1>
          <p className="text-xl">
            Learn. Earn. Trade.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <h2 className="text-2xl font-bold text-foreground">Start Your Journey</h2>
        
        <div className="grid gap-4">
          <EarningCard
            title="Learn & Earn"
            description="Complete courses and tasks to earn crypto rewards"
            icon={<BookOpen className="w-8 h-8" />}
            buttonText="START LEARNING"
          />
          
          <EarningCard
            title="Trade Assets"
            description="Buy and sell NFTs and digital collectibles"
            icon={<Coins className="w-8 h-8" />}
            buttonText="EXPLORE MARKETPLACE"
          />
          
          <EarningCard
            title="Become a Tutor"
            description="Create courses and earn from teaching others"
            icon={<GraduationCap className="w-8 h-8" />}
            buttonText="START TEACHING"
          />
        </div>

        <div className="bg-gradient-card rounded-xl p-6 border border-border mt-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Why UniqueHub?</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">Earn Rewards</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">Join Community</span>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">Learn Web3</span>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">Make Money</span>
            </div>
          </div>
        </div>

        <TutorInfo />
      </div>
    </div>
  );
};
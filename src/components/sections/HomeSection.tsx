import { Navigation } from "@/components/Navigation";
import { UserProfile } from "@/components/UserProfile";
import { WalletCard } from "@/components/WalletCard";
import { NFTCard } from "@/components/NFTCard";
import { CourseCard } from "@/components/CourseCard";
import { EarningCard } from "@/components/EarningCard";
import { BookOpen, Rocket, DollarSign, Hexagon, Diamond } from "lucide-react";
import penguinAvatar from "@/assets/penguin-avatar.png";

export const HomeSection = () => {
  return (
    <div className="space-y-8">
      {/* User Profile Section with Penguin */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img 
              src={penguinAvatar} 
              alt="Penguin Avatar" 
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">UNIQUEBEING</h1>
          </div>
        </div>
      </div>

      {/* Wallet Balances */}
      <div className="grid grid-cols-3 gap-4">
        <WalletCard type="usdc" amount="30.00" symbol="USDC" />
        <WalletCard type="eth" amount="0.00" symbol="ETH" />
        <WalletCard type="points" amount="0" symbol="POINTS" />
      </div>

      {/* Courses Section */}
      <div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <CourseCard
            title="Intro to Web3"
            icon={<div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-2xl font-bold text-primary">W3</div>}
          />
          <CourseCard
            title="How to Earn with Tasks"
            icon={<Rocket className="w-8 h-8 text-primary" />}
          />
        </div>
      </div>

      {/* Earning Opportunities */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Courses</h2>
        <div className="grid grid-cols-1 gap-4">
          <EarningCard
            title="Promote a Web3 Tool"
            description="Earn commissions by helping to sell Web3-based tools."
            icon={<Hexagon className="w-8 h-8 text-primary" />}
          />
          <EarningCard
            title="Promote Hybrid-Mar"
            description="Earn commissions by helping to sell digital and physical products."
            icon={<div className="w-8 h-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary rotate-45"></div>
              <div className="w-6 h-6 border-2 border-success -ml-3 -rotate-45"></div>
            </div>}
          />
        </div>
      </div>

      {/* Marketplace Preview */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Marketplace</h2>
        <div className="grid grid-cols-2 gap-4">
          <NFTCard
            title="Web3 Design Tool"
            price="0.01"
            currency="ETH"
            gradient="bg-gradient-to-br from-primary to-primary-glow"
            icon={<Hexagon className="w-8 h-8 text-primary" />}
          />
          <NFTCard
            title="Crypto Artwork"
            price="10"
            currency="USDC"
            gradient="bg-gradient-to-br from-success to-primary"
            icon={<div className="w-8 h-8 rounded-full border-2 border-success flex items-center justify-center">
              <div className="w-4 h-4 bg-success rounded-full"></div>
            </div>}
          />
        </div>
      </div>
    </div>
  );
};
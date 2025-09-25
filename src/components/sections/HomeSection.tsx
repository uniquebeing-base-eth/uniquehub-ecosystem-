import { Navigation } from "@/components/Navigation";
import { UserProfile } from "@/components/UserProfile";
import { WalletCard } from "@/components/WalletCard";
import { NFTCard } from "@/components/NFTCard";
import { CourseCard } from "@/components/CourseCard";
import { EarningCard } from "@/components/EarningCard";
import { BookOpen, Rocket, DollarSign, Hexagon } from "lucide-react";

interface HomeSectionProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const HomeSection = ({ activeTab, onTabChange }: HomeSectionProps) => {
  return (
    <div className="space-y-8">
      {/* User Profile Section */}
      <UserProfile username="UNIQUEBEING" />

      {/* Navigation */}
      <div className="flex gap-4">
        <Navigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Wallet Balances */}
      <div className="grid grid-cols-3 gap-4">
        <WalletCard type="usdc" amount="30.00" symbol="USDC" />
        <WalletCard type="eth" amount="0.00" symbol="ETH" />
        <WalletCard type="points" amount="0" symbol="POINTS" />
      </div>

      {/* Courses Section */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Courses</h2>
        <div className="grid grid-cols-2 gap-4">
          <CourseCard
            title="Intro to Web3"
            icon={<BookOpen className="w-8 h-8" />}
          />
          <CourseCard
            title="How to Earn with Tasks"
            icon={<Rocket className="w-8 h-8" />}
          />
        </div>
      </div>

      {/* Earning Opportunities */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Earning</h2>
        <div className="grid grid-cols-1 gap-4">
          <EarningCard
            title="Promote a Web3 Tool"
            description="Earn commissions by helping to sell Web3-based tools."
            icon={<Hexagon className="w-8 h-8" />}
          />
          <EarningCard
            title="Promote Hybrid-Mar"
            description="Earn commissions by helping to sell digital and physical products."
            icon={<DollarSign className="w-8 h-8" />}
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
          />
          <NFTCard
            title="Crypto Artwork"
            price="10"
            currency="USDC"
            gradient="bg-gradient-to-br from-success to-primary"
          />
        </div>
      </div>
    </div>
  );
};
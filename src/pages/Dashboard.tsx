import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { WalletCard } from "@/components/WalletCard";
import { NFTCard } from "@/components/NFTCard";
import { CourseCard } from "@/components/CourseCard";
import { EarningCard } from "@/components/EarningCard";
import { Menu, Rocket, DollarSign, BookOpen, Hexagon } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="space-y-8">
            {/* User Profile Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-foreground rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-primary rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">UNIQUEBEING</h1>
                  <div className="flex gap-4 mt-2">
                    <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
                  </div>
                </div>
              </div>
              <Menu className="w-6 h-6 text-primary cursor-pointer" />
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
              <h2 className="text-xl font-bold text-foreground mb-4">Courses</h2>
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

      case "marketplace":
        return (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
            <div className="grid grid-cols-2 gap-6">
              <NFTCard
                title="Penguin Avatar"
                price="5.00"
                currency="USDC"
                gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              />
              <NFTCard
                title="Digital Coin"
                price="10.00"
                currency="USDC"
                gradient="bg-gradient-to-br from-primary to-primary-glow"
              />
              <NFTCard
                title="Abstract Art"
                price="3.50"
                currency="USDC"
                gradient="bg-gradient-to-br from-success to-primary"
              />
              <NFTCard
                title="Rocket"
                price="7.00"
                currency="USDC"
                gradient="bg-gradient-to-br from-blue-600 to-purple-600"
              />
            </div>
          </div>
        );

      case "courses":
        return (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold text-foreground">Courses</h1>
            <div className="grid grid-cols-2 gap-6">
              <CourseCard
                title="Intro to Web3"
                icon={<BookOpen className="w-8 h-8" />}
              />
              <CourseCard
                title="How to Earn with Tasks"
                icon={<Rocket className="w-8 h-8" />}
              />
              <CourseCard
                title="NFT Trading Basics"
                icon={<Hexagon className="w-8 h-8" />}
              />
              <CourseCard
                title="DeFi Fundamentals"
                icon={<DollarSign className="w-8 h-8" />}
              />
            </div>
          </div>
        );

      case "earning":
        return (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold text-foreground">Earning</h1>
            
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Courses</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
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

            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Products</h2>
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

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">UniqueHub</h1>
          <Menu className="w-6 h-6 text-primary cursor-pointer" />
        </div>

        {/* Navigation */}
        {activeTab !== "home" && (
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
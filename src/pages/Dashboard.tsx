import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { HomeSection } from "@/components/sections/HomeSection";
import { MarketplaceSection } from "@/components/sections/MarketplaceSection";
import { CoursesSection } from "@/components/sections/CoursesSection";
import { EarningSection } from "@/components/sections/EarningSection";
import { WalletConnector } from "@/components/WalletConnector";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeSection 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
          />
        );
      case "marketplace":
        return <MarketplaceSection />;
      case "courses":
        return <CoursesSection />;
      case "earning":
        return <EarningSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 container mx-auto px-6 py-8">
        {/* Content */}
        {renderContent()}
      </div>
      
      {/* Wallet Connector at bottom */}
      <WalletConnector />
    </div>
  );
};

export default Dashboard;
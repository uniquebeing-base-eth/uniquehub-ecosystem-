import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { HomeSection } from "@/components/sections/HomeSection";
import { MarketplaceSection } from "@/components/sections/MarketplaceSection";
import { CoursesSection } from "@/components/sections/CoursesSection";
import { EarningSection } from "@/components/sections/EarningSection";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { TutorSection } from "@/components/sections/TutorSection";
import { WalletConnector } from "@/components/WalletConnector";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeSection />;
      case "marketplace":
        return <MarketplaceSection />;
      case "courses":
        return <CoursesSection />;
      case "earning":
        return <EarningSection />;
      case "profile":
        return <ProfileSection />;
      case "tutor":
        return <TutorSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-2xl font-bold text-primary">UniqueHub</h1>
        </div>

        {/* Navigation - Always visible */}
        <div className="flex justify-center mb-8">
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content */}
        {renderContent()}
      </div>
      
      {/* Wallet Connector at bottom */}
      <WalletConnector />
    </div>
  );
};

export default Dashboard;
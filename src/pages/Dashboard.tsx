import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { HomeSection } from "@/components/sections/HomeSection";
import { MarketplaceSection } from "@/components/sections/MarketplaceSection";
import { CoursesSection } from "@/components/sections/CoursesSection";
import { EarningSection } from "@/components/sections/EarningSection";
import { Menu } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home");

  const handleMenuClick = () => {
    // Handle mobile menu toggle or navigation
    console.log("Menu clicked");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeSection 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onMenuClick={handleMenuClick}
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
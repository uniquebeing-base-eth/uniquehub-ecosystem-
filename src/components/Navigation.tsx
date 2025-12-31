

import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Home" },
  { id: "earning", label: "Earn" },
  { id: "marketplace", label: "Market" },
  { id: "courses", label: "Courses" },
  { id: "quest", label: "Quest" },
  { id: "nft", label: "Unique NFTs" },
  { id: "profile", label: "Profile" },
  { id: "tutor", label: "Tutor" },
];

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  return (
    <nav className="flex gap-0.5 bg-secondary rounded-lg p-1 mb-6 w-full max-w-4xl mx-auto overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 px-3 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 min-w-0 whitespace-nowrap",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-glow"
              : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

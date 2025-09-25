import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Home" },
  { id: "earning", label: "Earning" },
  { id: "marketplace", label: "Marketplace" },
  { id: "courses", label: "Courses" },
  { id: "profile", label: "Profile" },
  { id: "tutor", label: "Tutor" },
];

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  return (
    <nav className="flex gap-1 bg-secondary rounded-lg p-1 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-6 py-2 rounded-md text-sm font-medium transition-all duration-200",
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
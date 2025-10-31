import { Home, BookOpen, Box, ShoppingBag, User, Wallet, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "courses", icon: BookOpen, label: "Courses" },
  { id: "earn", icon: DollarSign, label: "Earn" },
  { id: "upload", icon: Box, label: "Upload" },
  { id: "wallet", icon: Wallet, label: "Wallet" },
  { id: "marketplace", icon: ShoppingBag, label: "Market" },
  { id: "profile", icon: User, label: "Profile" },
];

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-end justify-around px-1 py-1.5 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isUpload = item.id === "upload";
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 transition-all min-w-0 flex-1",
                isUpload && "relative -top-3"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-2xl transition-all",
                  isUpload
                    ? "w-10 h-10 bg-gradient-primary shadow-glow"
                    : "w-7 h-7",
                  isActive && !isUpload && "text-primary"
                )}
              >
                <Icon className={cn(
                  "transition-all",
                  isUpload ? "w-4 h-4 text-white" : "w-3.5 h-3.5"
                )} />
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium transition-colors truncate w-full text-center",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

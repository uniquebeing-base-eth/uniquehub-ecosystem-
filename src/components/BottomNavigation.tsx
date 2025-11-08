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
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/98 to-card/95 backdrop-blur-md border-t border-primary/20 z-50 shadow-[0_-10px_40px_-10px_hsl(var(--primary)/0.3)]">
      <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isUpload = item.id === "upload";
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              className={cn(
                "relative flex items-center justify-center transition-all duration-300 group",
                isUpload && "relative -top-4"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-300",
                  isUpload
                    ? "w-16 h-16 bg-gradient-primary shadow-[0_0_30px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.8)] hover:scale-110"
                    : "w-12 h-12",
                  isActive && !isUpload && "bg-gradient-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)] scale-110",
                  !isActive && !isUpload && "hover:bg-primary/10 hover:scale-105 active:scale-95"
                )}
              >
                <Icon 
                  className={cn(
                    "transition-all duration-300",
                    isUpload ? "w-7 h-7 text-white" : "w-6 h-6",
                    isActive && !isUpload ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "text-muted-foreground group-hover:text-primary"
                  )} 
                  strokeWidth={isActive || isUpload ? 2.5 : 2} 
                />
              </div>
              
              {isActive && !isUpload && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

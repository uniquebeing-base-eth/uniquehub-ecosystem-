
import { Home, Compass, PlusCircle, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "discover", icon: Compass, label: "Discover" },
  { id: "create", icon: PlusCircle, label: "Create" },
  { id: "marketplace", icon: ShoppingBag, label: "Market" },
  { id: "profile", icon: User, label: "Profile" },
];

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/98 backdrop-blur-md border-t border-border z-50 shadow-lg">
      <div className="flex items-center justify-around px-1 py-2 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              className="relative flex flex-col items-center justify-center transition-all duration-200 group flex-1 py-1"
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-xl transition-all duration-200 w-10 h-10 relative",
                  isActive && "bg-primary shadow-md",
                  !isActive && "hover:bg-muted"
                )}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </div>
              
              <span className={cn(
                "text-[10px] mt-0.5 font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

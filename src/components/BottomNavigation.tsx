
import { Home, Target, Coins, Lock, User, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  missionsCompleted?: number;
}

const navItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "missions", icon: Target, label: "Missions" },
  { id: "earn", icon: Coins, label: "Earn" },
  { id: "creator", icon: User, label: "Creator", locked: true, requiredMissions: 2 },
  { id: "marketplace", icon: ShoppingBag, label: "Market" },
];

export const BottomNavigation = ({ activeTab, onTabChange, missionsCompleted = 0 }: BottomNavigationProps) => {
  const [showLockedDialog, setShowLockedDialog] = useState(false);
  const [lockedMessage, setLockedMessage] = useState("");

  const handleTabClick = (item: typeof navItems[0]) => {
    if (item.locked && missionsCompleted < (item.requiredMissions || 0)) {
      setLockedMessage(`Complete ${item.requiredMissions} missions to unlock ${item.label} tools`);
      setShowLockedDialog(true);
      return;
    }
    onTabChange(item.id);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/98 backdrop-blur-md border-t border-border z-50 shadow-lg">
        <div className="flex items-center justify-around px-1 py-2 max-w-2xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isLocked = item.locked && missionsCompleted < (item.requiredMissions || 0);
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item)}
                aria-label={item.label}
                className={cn(
                  "relative flex flex-col items-center justify-center transition-all duration-200 group flex-1 py-1",
                  isLocked && "opacity-60"
                )}
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
                  {isLocked && (
                    <Lock className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-muted-foreground" />
                  )}
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

      <Dialog open={showLockedDialog} onOpenChange={setShowLockedDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Locked Feature
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              {lockedMessage}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => {
            setShowLockedDialog(false);
            onTabChange("missions");
          }} className="w-full">
            Go to Missions
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

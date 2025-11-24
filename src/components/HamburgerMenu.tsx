import { useState } from "react";
import { Menu, GraduationCap, Info, Mail, BookOpen, Trophy, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { path: "/wallet", icon: Wallet, label: "Wallet" },
    { path: "/nft", icon: GraduationCap, label: "Unique NFTs" },
    { path: "/certificates", icon: GraduationCap, label: "Certificates" },
    { path: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { path: "/tutor", icon: GraduationCap, label: "Tutor Dashboard" },
    { path: "/blog", icon: BookOpen, label: "Blog" },
    { path: "/about", icon: Info, label: "About" },
    { path: "/contact", icon: Mail, label: "Contact Us" },
  ];

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="p-2 hover:bg-card rounded-lg transition-colors">
          <Menu className="w-6 h-6 text-primary" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <div className="flex flex-col gap-2 mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleMenuItemClick(item.path)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card-hover transition-colors text-left"
              >
                <Icon className="w-5 h-5 text-primary" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

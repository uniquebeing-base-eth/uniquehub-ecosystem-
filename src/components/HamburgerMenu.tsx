import { useState } from "react";
import { Menu, GraduationCap, Info, Mail, BookOpen, Trophy } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface HamburgerMenuProps {
  onNavigate: (section: string) => void;
}

export const HamburgerMenu = ({ onNavigate }: HamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "quest", icon: Trophy, label: "Quest" },
    { id: "nft", icon: GraduationCap, label: "Unique NFTs" },
    { id: "certificates", icon: GraduationCap, label: "Certificates" },
    { id: "leaderboard", icon: Trophy, label: "Leaderboard" },
    { id: "tutor", icon: GraduationCap, label: "Tutor Dashboard" },
    { id: "blog", icon: BookOpen, label: "Blog" },
    { id: "about", icon: Info, label: "About" },
    { id: "contact", icon: Mail, label: "Contact Us" },
  ];

  const handleMenuItemClick = (sectionId: string) => {
    onNavigate(sectionId);
    setIsOpen(false); // Close the menu after navigation
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
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
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

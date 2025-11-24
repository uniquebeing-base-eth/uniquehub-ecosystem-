import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "home", path: "/", label: "Home" },
  { id: "earn", path: "/earn", label: "Earn" },
  { id: "marketplace", path: "/marketplace", label: "Market" },
  { id: "courses", path: "/courses", label: "Courses" },
  { id: "quest", path: "/quest", label: "Quest" },
  { id: "nft", path: "/nft", label: "Unique NFTs" },
  { id: "profile", path: "/profile", label: "Profile" },
  { id: "tutor", path: "/tutor", label: "Tutor" },
];

export const Navigation = () => {
  const location = useLocation();
  return (
    <nav className="flex gap-0.5 bg-secondary rounded-lg p-1 mb-6 w-full max-w-4xl mx-auto overflow-x-auto">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          to={tab.path}
          className={cn(
            "flex-1 px-3 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 min-w-0 whitespace-nowrap",
            location.pathname === tab.path
              ? "bg-primary text-primary-foreground shadow-glow"
              : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
};
import { Menu } from "lucide-react";

interface UserProfileProps {
  username: string;
  onMenuClick: () => void;
}

export const UserProfile = ({ username, onMenuClick }: UserProfileProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
          <div className="w-12 h-12 bg-foreground rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-primary rounded-full"></div>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{username}</h1>
        </div>
      </div>
      <Menu className="w-6 h-6 text-primary cursor-pointer" onClick={onMenuClick} />
    </div>
  );
};
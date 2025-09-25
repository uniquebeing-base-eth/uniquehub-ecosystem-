import { Button } from "@/components/ui/button";

interface CourseCardProps {
  title: string;
  icon: React.ReactNode;
  buttonText?: string;
  onAction?: () => void;
}

export const CourseCard = ({ title, icon, buttonText = "START", onAction }: CourseCardProps) => {
  return (
    <div className="bg-gradient-card rounded-xl p-6 shadow-card border border-border hover:border-primary/50 transition-all duration-300">
      <div className="mb-4 flex justify-center">
        <div className="w-16 h-16 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground text-center">{title}</h3>
    </div>
  );
};
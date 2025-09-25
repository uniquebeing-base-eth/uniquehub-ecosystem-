import { Button } from "@/components/ui/button";

interface EarningCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText?: string;
  onAction?: () => void;
}

export const EarningCard = ({ title, description, icon, buttonText = "START", onAction }: EarningCardProps) => {
  return (
    <div className="bg-gradient-card rounded-xl p-6 shadow-card border border-border hover:border-primary/50 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        </div>
      </div>
      <Button 
        className="w-full bg-primary hover:bg-primary-glow text-primary-foreground font-semibold"
        onClick={onAction}
      >
        {buttonText}
      </Button>
    </div>
  );
};
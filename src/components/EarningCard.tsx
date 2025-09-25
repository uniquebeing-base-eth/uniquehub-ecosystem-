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
    <div className="bg-gradient-card rounded-xl p-6 shadow-card border border-border hover:border-primary/50 transition-all duration-300 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button 
        className="w-full bg-success hover:bg-success/90 text-background font-bold py-3"
        onClick={onAction}
      >
        {buttonText}
      </Button>
    </div>
  );
};
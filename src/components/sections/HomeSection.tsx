import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface HomeSectionProps {
  onNavigate?: (tab: string) => void;
  userName?: string;
}

export const HomeSection = ({ onNavigate, userName }: HomeSectionProps) => {

  return (
    <div className="space-y-4 pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-primary rounded-2xl p-5 text-white space-y-3">
        <h2 className="text-base font-semibold">
          Hi {userName}
        </h2>
        <h1 className="text-lg font-bold leading-snug">
          Welcome to UniqueHub your super app for learning, earning and trading.
        </h1>
        <Button 
          variant="secondary" 
          className="bg-card text-foreground hover:bg-card-hover font-semibold rounded-full px-5 py-2 h-auto text-sm"
        >
          Get started
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="p-4 cursor-pointer hover:border-primary transition-all group bg-gradient-card"
          onClick={() => onNavigate?.('marketplace')}
        >
          <div className="space-y-2">
            <div className="text-xl">🎨</div>
            <h3 className="font-semibold text-sm text-white">Discover NFTs</h3>
          </div>
        </Card>
        <Card 
          className="p-4 cursor-pointer hover:border-primary transition-all group bg-gradient-card"
          onClick={() => onNavigate?.('courses')}
        >
          <div className="space-y-2">
            <div className="text-xl">💰</div>
            <h3 className="font-semibold text-sm text-white">Start earning</h3>
          </div>
        </Card>
      </div>

      {/* Featured Course Card */}
      <Card className="p-5 bg-gradient-primary text-white rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold mb-2">Learn Web3.0</h3>
            <Button 
              variant="secondary"
              className="bg-card text-foreground hover:bg-card-hover rounded-full px-5 py-2 h-auto text-sm mt-1"
              onClick={() => onNavigate?.('courses')}
            >
              Start Now
            </Button>
          </div>
          <div className="text-4xl opacity-80">🔗</div>
        </div>
        <div className="flex gap-1.5 mt-3">
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
        </div>
      </Card>
    </div>
  );
};

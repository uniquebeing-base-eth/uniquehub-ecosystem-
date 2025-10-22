import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface HomeSectionProps {
  onNavigate?: (tab: string) => void;
}

export const HomeSection = ({ onNavigate }: HomeSectionProps) => {

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-primary rounded-3xl p-6 text-white space-y-4">
        <h1 className="text-xl font-bold">
          Welcome to UniqueHub your super app for learning, earning and trading.
        </h1>
        <Button 
          variant="secondary" 
          className="bg-card text-foreground hover:bg-card-hover font-semibold rounded-full px-6"
        >
          Get started
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className="p-6 cursor-pointer hover:border-primary transition-all group bg-gradient-card"
          onClick={() => onNavigate?.('marketplace')}
        >
          <div className="space-y-3">
            <div className="text-2xl">🎨</div>
            <h3 className="font-bold text-white">Discover NFTs</h3>
          </div>
        </Card>
        <Card 
          className="p-6 cursor-pointer hover:border-primary transition-all group bg-gradient-card"
          onClick={() => onNavigate?.('courses')}
        >
          <div className="space-y-3">
            <div className="text-2xl">💰</div>
            <h3 className="font-bold text-white">Start earning</h3>
          </div>
        </Card>
      </div>

      {/* Featured Course Card */}
      <Card className="p-6 bg-gradient-primary text-white rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">Learn Web3.0</h3>
            <Button 
              variant="secondary"
              className="bg-card text-foreground hover:bg-card-hover rounded-full px-6 mt-2"
              onClick={() => onNavigate?.('courses')}
            >
              Start Now
            </Button>
          </div>
          <div className="text-6xl opacity-80">🔗</div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
        </div>
      </Card>
    </div>
  );
};

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Wallet } from 'lucide-react';

interface HomeSectionProps {
  onNavigate?: (tab: string) => void;
  userName?: string;
}

export const HomeSection = ({ onNavigate, userName }: HomeSectionProps) => {

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Hero Section */}
      <div className="bg-gradient-primary rounded-2xl p-5 space-y-3 relative overflow-hidden" style={{ backgroundSize: '200% 200%', animation: 'gradient-shift 6s ease infinite' }}>
        <div className="relative z-10">
          <h2 className="text-base font-semibold text-white">
            Hi {userName}
          </h2>
          <h1 className="text-lg font-bold leading-snug text-white">
            Welcome to UniqueHub your super app for learning, earning and trading.
          </h1>
          <Button 
            variant="secondary" 
            className="bg-white/90 text-primary hover:bg-white hover:shadow-lg font-semibold rounded-2xl px-6 py-2 h-auto text-sm transition-all duration-300 hover:scale-105"
            onClick={() => onNavigate?.('courses')}
          >
            Get started
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="p-4 cursor-pointer hover:border-primary hover:shadow-glow transition-all duration-300 group bg-gradient-to-br from-card to-card-hover rounded-2xl hover:scale-105"
          onClick={() => onNavigate?.('marketplace')}
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Discover NFTs</h3>
            <p className="text-xs text-muted-foreground">Explore digital art</p>
          </div>
        </Card>
        <Card 
          className="p-4 cursor-pointer hover:border-primary hover:shadow-glow transition-all duration-300 group bg-gradient-to-br from-card to-card-hover rounded-2xl hover:scale-105"
          onClick={() => onNavigate?.('earn')}
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Start Earning</h3>
            <p className="text-xs text-muted-foreground">Complete tasks & earn</p>
          </div>
        </Card>
      </div>

      {/* Featured Course Card */}
      <Card className="p-5 bg-gradient-primary text-white rounded-2xl overflow-hidden relative" style={{ backgroundSize: '200% 200%', animation: 'gradient-shift 6s ease infinite' }}>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5" />
              <h3 className="text-lg font-bold">Learn Web3.0</h3>
            </div>
            <p className="text-sm text-white/80 mb-3">Master blockchain & decentralized apps</p>
            <Button 
              variant="secondary"
              className="bg-white/90 text-primary hover:bg-white hover:shadow-lg rounded-2xl px-5 py-2 h-auto text-sm transition-all duration-300 hover:scale-105"
              onClick={() => onNavigate?.('courses')}
            >
              Start Now
            </Button>
          </div>
          <div className="text-4xl opacity-80">🔗</div>
        </div>
        <div className="flex gap-1.5 mt-3 relative z-10">
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
        </div>
      </Card>
    </div>
  );
};

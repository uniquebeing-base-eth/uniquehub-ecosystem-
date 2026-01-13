
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Wallet, BookOpen, ShoppingBag, Coins, User, Sparkles, TrendingUp } from 'lucide-react';
import cubeLogo from '@/assets/uniquehub-cube.png';

interface OnboardingTutorialProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tutorialSteps = [
  {
    icon: 'logo',
    title: 'Welcome to UniqueHub',
    subtitle: 'Learn, Earn & Grow',
    description: 'The onchain learning ecosystem where knowledge meets value. Every course, every creator, every interaction builds real value.',
    features: [
      { icon: Wallet, text: '$10,000 USDC sandbox balance' },
      { icon: Coins, text: '5 ETH test balance' },
      { icon: Sparkles, text: 'Zero risk exploration' },
    ],
    gradient: 'from-primary via-primary to-primary/80',
  },
  {
    icon: 'discover',
    title: 'Discover & Learn',
    subtitle: 'Video-first education',
    description: 'Explore curated video courses from top creators. Each course is backed by creator economics.',
    features: [
      { icon: BookOpen, text: 'Premium video courses' },
      { icon: User, text: 'Follow top creators' },
      { icon: TrendingUp, text: 'Track your progress' },
    ],
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
  },
  {
    icon: 'coins',
    title: 'Creator Economy',
    subtitle: 'Own what you learn',
    description: 'When you buy a course, you receive course tokens. As demand grows, so does value. Support creators directly.',
    features: [
      { icon: Coins, text: 'Earn course tokens' },
      { icon: TrendingUp, text: 'Real-time price charts' },
      { icon: Wallet, text: 'Trade tokens anytime' },
    ],
    gradient: 'from-amber-500 via-orange-500 to-red-500',
  },
  {
    icon: 'shop',
    title: 'Marketplace',
    subtitle: 'Digital assets & NFTs',
    description: 'Trade creator-related digital assets. Simple, clean, and fully integrated into the ecosystem.',
    features: [
      { icon: ShoppingBag, text: 'Buy & sell NFTs' },
      { icon: Coins, text: 'Use sandbox USDC' },
      { icon: Sparkles, text: 'Instant transactions' },
    ],
    gradient: 'from-purple-500 via-violet-500 to-fuchsia-500',
  },
  {
    icon: 'wallet',
    title: 'Your Wallet',
    subtitle: 'All your assets in one place',
    description: 'View balances, track tokens, send to friends, and see transaction history. Create your own creator coin when ready!',
    features: [
      { icon: Wallet, text: 'Full wallet overview' },
      { icon: TrendingUp, text: 'Tap tokens for charts' },
      { icon: User, text: 'Create your creator coin' },
    ],
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
];

const getStepIcon = (iconType: string, isActive: boolean) => {
  const iconClass = `w-8 h-8 ${isActive ? 'text-white' : 'text-primary'}`;
  switch (iconType) {
    case 'discover': return <BookOpen className={iconClass} />;
    case 'coins': return <Coins className={iconClass} />;
    case 'shop': return <ShoppingBag className={iconClass} />;
    case 'wallet': return <Wallet className={iconClass} />;
    default: return null;
  }
};

export const OnboardingTutorial = ({ open, onComplete, onSkip }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tutorialSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm mx-4 p-0 bg-card border-border overflow-hidden rounded-2xl">
        {/* Hero Section */}
        <div className={`p-6 pb-8 bg-gradient-to-br ${step.gradient} relative overflow-hidden`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-1.5 mb-6 relative z-10">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-white w-6' 
                    : index < currentStep 
                      ? 'bg-white/60 w-1.5' 
                      : 'bg-white/30 w-1.5'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 relative z-10 shadow-lg">
            {step.icon === 'logo' ? (
              <img src={cubeLogo} alt="UniqueHub" className="w-12 h-12" />
            ) : (
              getStepIcon(step.icon, true)
            )}
          </div>

          {/* Text */}
          <div className="text-center relative z-10">
            <p className="text-white/80 text-sm font-medium mb-1">{step.subtitle}</p>
            <h2 className="text-2xl font-bold text-white">{step.title}</h2>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {step.description}
          </p>

          {/* Features */}
          <div className="space-y-2">
            {step.features.map((feature, idx) => (
              <Card key={idx} className="p-3 rounded-xl flex items-center gap-3 bg-muted/50 border-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{feature.text}</span>
              </Card>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 space-y-3">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev} className="flex-1 rounded-full">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1 rounded-full bg-gradient-to-r from-primary to-primary/80">
              {currentStep === tutorialSteps.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Exploring
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {currentStep === 0 && (
            <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground text-sm">
              I already know how it works
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

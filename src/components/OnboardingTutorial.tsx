
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Wallet, BookOpen, ShoppingBag, Coins, User } from 'lucide-react';
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
    description: 'Learn, earn, and grow with video-first courses from the best creators. Your journey into the onchain learning ecosystem starts here.',
    highlight: 'Get started with $10,000 USDC and 5 ETH in your sandbox wallet!',
  },
  {
    icon: 'book',
    title: 'Discover & Learn',
    description: 'Browse video courses from top creators. Each course is backed by a creator coin - when you buy, you support knowledge and creators directly.',
    highlight: 'One tap to buy. Instant access. Token appears in wallet.',
  },
  {
    icon: 'coins',
    title: 'Courses Tab',
    description: 'Your purchased courses live here. Watch, learn, and earn course coins as you progress through lessons.',
    highlight: 'Every course has its own coin that grows with demand.',
  },
  {
    icon: 'shop',
    title: 'Marketplace',
    description: 'Trade creator-related NFTs and digital assets. Simple, clean, and integrated into the ecosystem.',
    highlight: 'Buy and sell with your sandbox balance.',
  },
  {
    icon: 'user',
    title: 'Your Profile & Wallet',
    description: 'View your balances, tokens, and transaction history. Send tokens to other users and track your learning journey.',
    highlight: 'Create your own creator coin when you are ready!',
  },
];

const getIcon = (iconType: string) => {
  switch (iconType) {
    case 'book': return BookOpen;
    case 'coins': return Coins;
    case 'shop': return ShoppingBag;
    case 'user': return User;
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
  const Icon = getIcon(step.icon);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm mx-4 p-0 bg-card border-border overflow-hidden">
        <div className="flex justify-center gap-1.5 pt-4">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep ? 'bg-primary w-6' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            {step.icon === 'logo' ? (
              <img src={cubeLogo} alt="UniqueHub" className="w-12 h-12" />
            ) : (
              Icon && <Icon className="w-10 h-10 text-primary" />
            )}
          </div>

          <h2 className="text-xl font-bold text-foreground">{step.title}</h2>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {step.description}
          </p>

          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
            <p className="text-primary text-sm font-medium">{step.highlight}</p>
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-3">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1">
              {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
              {currentStep < tutorialSteps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {currentStep === 0 && (
            <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
              Skip Tutorial
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

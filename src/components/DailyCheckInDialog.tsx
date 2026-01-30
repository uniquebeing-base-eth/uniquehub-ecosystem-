
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Gift, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShareToFarcaster } from "@/components/ShareToFarcaster";
import { useFarcasterWallet } from "@/hooks/useFarcasterWallet";
import { useViemClients } from "@/hooks/useViemClients";
import { base } from "wagmi/chains";
import { 
  EARN_POINTS_CLAIM_ADDRESS, 
  EARN_POINTS_CLAIM_ABI,
  EARN_CLAIM_FEE 
} from "@/config/wagmi";


interface DailyCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDay: number;
  onSuccess: () => void;
}

export const DailyCheckInDialog = ({ 
  open, 
  onOpenChange, 
  currentDay,
  onSuccess 
}: DailyCheckInDialogProps) => {
  const [claiming, setClaiming] = useState(false);
  const [checkInComplete, setCheckInComplete] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [newStreak, setNewStreak] = useState(0);
  const [step, setStep] = useState<'confirm' | 'transaction' | 'processing'>('confirm');
  const { toast } = useToast();
  const { address } = useFarcasterWallet();
  const { walletClient, publicClient } = useViemClients(address);

  const handleCheckIn = async () => {
    if (!address || !walletClient || !publicClient) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to check in.",
        variant: "destructive",
      });
      return;
    }

    setClaiming(true);
    setStep('transaction');

    try {
      // Generate unique task ID for this check-in
      const taskId = `daily_checkin_${new Date().toISOString().split('T')[0]}`;
      const pointsToEarn = currentDay === 6 ? 500 : 100; // Estimate for mystery box

      // Step 1: Send on-chain transaction to claim contract
      toast({
        title: "Confirm Transaction",
        description: "Please confirm the transaction in your wallet.",
      });

      const hash = await walletClient.writeContract({
        address: EARN_POINTS_CLAIM_ADDRESS,
        abi: EARN_POINTS_CLAIM_ABI,
        functionName: 'claimPoints',
        args: [taskId, BigInt(pointsToEarn)],
        value: EARN_CLAIM_FEE,
        chain: base,
        account: address,
      });

      setStep('processing');
      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation...",
      });

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      // Step 2: Process check-in on backend after successful transaction
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to check in daily.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('process-checkin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          transactionHash: hash
        }
      });

      if (error) throw error;

      if (data.success) {
        setEarnedPoints(data.pointsAwarded || 100);
        setNewStreak(data.newStreak || currentDay);
        setCheckInComplete(true);
        
        toast({
          title: data.isMysteryBox ? "Mystery Box Unlocked!" : "Check-In Successful!",
          description: data.message,
        });
        
        onSuccess();
      } else {
        toast({
          title: "Already Checked In",
          description: data.message,
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      
      // Check if user rejected the transaction
      if (error.message?.includes('rejected') || error.message?.includes('denied')) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check-In Failed",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      }
      setStep('confirm');
    } finally {
      setClaiming(false);
    }
  };

  const handleClose = () => {
    setCheckInComplete(false);
    setEarnedPoints(0);
    setStep('confirm');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="text-center space-y-6 pt-4">
          <h2 className="text-3xl font-bold text-foreground">
            {checkInComplete ? "Check-In Complete!" : "Daily Check-In"}
          </h2>

          {!checkInComplete ? (
            <>
              {/* 6-Day Grid */}
              <div className="grid grid-cols-3 gap-4 py-6">
                {[1, 2, 3, 4, 5, 6].map((day) => {
                  const isCurrentDay = day === currentDay;
                  const isMysteryBox = day === 6;
                  const isCompleted = day < currentDay;

                  return (
                    <div
                      key={day}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        isCurrentDay
                          ? 'bg-primary/20 ring-2 ring-primary shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-primary/10 opacity-50'
                          : 'bg-muted/50'
                      }`}
                    >
                      {isMysteryBox ? (
                        <Gift 
                          className={`w-12 h-12 ${isCurrentDay ? 'text-primary animate-pulse' : 'text-primary/70'}`} 
                        />
                      ) : (
                        <Coins 
                          className={`w-12 h-12 ${isCurrentDay ? 'text-yellow-500 animate-pulse' : isCompleted ? 'text-yellow-500/50' : 'text-yellow-500/70'}`} 
                        />
                      )}
                      <span className="text-sm font-semibold text-foreground">
                        {isMysteryBox ? 'Mystery' : `Day ${day}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {isMysteryBox ? '200-1000 UP' : '100 UP'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Transaction Info */}
              <p className="text-xs text-muted-foreground">
                A small transaction fee of 0.0000001 ETH is required to claim points on-chain.
              </p>

              {/* Check-In Button */}
              <Button
                onClick={handleCheckIn}
                disabled={claiming || !address}
                className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {claiming ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {step === 'transaction' ? 'Confirm in Wallet...' : 'Processing...'}
                  </>
                ) : !address ? (
                  'Connect Wallet to Check In'
                ) : (
                  <>
                    <Coins className="mr-2 h-5 w-5" />
                    Check In
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Success State with Share */}
              <div className="py-6 space-y-4">
                <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                  <Coins className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">+{earnedPoints} UP</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {newStreak} Day Streak!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <ShareToFarcaster
                  text={`I just checked in on @uniquehub!\n\n${newStreak} Day Streak | +${earnedPoints} UP Points\n\nShowing up daily to learn and earn. Join the ultimate Web3 learning platform!`}
                  embeds={['https://uniquehub.xyz']}
                  buttonText="Share Check-In"
                  variant="default"
                  size="lg"
                  className="w-full bg-gradient-primary"
                />
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

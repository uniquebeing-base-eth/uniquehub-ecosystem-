import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DollarSign, Zap, BookOpen, Wallet } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS, COURSE_CONTRACT_ABI, USDC_ADDRESS, USDC_ABI } from '@/config/contracts';
import { base } from 'wagmi/chains';

interface CoursePurchaseProps {
  course: any;
  onPurchaseComplete?: () => void;
}

export const CoursePurchase = ({ course, onPurchaseComplete }: CoursePurchaseProps) => {
  const { user } = useAuth();
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [selectedCurrency, setSelectedCurrency] = useState<'USDC' | 'ETH'>('USDC');
  const [step, setStep] = useState<'idle' | 'approving' | 'enrolling'>('idle');
  
  const { data: hash, writeContractAsync, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Check USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.COURSE_CONTRACT as `0x${string}`] : undefined,
  });

  const priceInUSDC = parseFloat(course.price_usdc) || 0;
  const isFree = priceInUSDC === 0;
  const isLoading = isPending || isConfirming;

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      if (step === 'approving') {
        toast.success('USDC approved! Now enrolling...');
        setStep('enrolling');
        refetchAllowance();
        // Proceed to enrollment after approval
        handleEnrollWithUSDC();
      } else if (step === 'enrolling') {
        completeEnrollment(hash);
      }
    }
  }, [isSuccess, hash, step]);

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please sign in with Farcaster first');
      return;
    }

    if (!isConnected || !address) {
      toast.error('Please connect your wallet to purchase');
      return;
    }

    if (chainId !== base.id) {
      toast.error('Switching to Base network...');
      switchChain?.({ chainId: base.id });
      return;
    }

    try {
      if (selectedCurrency === 'USDC') {
        const priceInWei = parseUnits(priceInUSDC.toString(), 6);
        const currentAllowance = (allowance as bigint) || 0n;

        if (currentAllowance >= priceInWei) {
          // Already approved, go straight to enrollment
          await handleEnrollWithUSDC();
        } else {
          // Need approval first
          setStep('approving');
          toast.info('Step 1/2: Approve USDC in your wallet...');
          await writeContractAsync({
            address: USDC_ADDRESS as `0x${string}`,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [CONTRACTS.COURSE_CONTRACT as `0x${string}`, priceInWei],
            account: address,
            chain: base,
          });
        }
      } else {
        // ETH payment
        setStep('enrolling');
        toast.info('Processing ETH payment in your wallet...');
        await writeContractAsync({
          address: CONTRACTS.COURSE_CONTRACT as `0x${string}`,
          abi: COURSE_CONTRACT_ABI,
          functionName: 'enrollWithETH',
          args: [course.id],
          account: address,
          chain: base,
        });
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast.error('Transaction failed: ' + (error.message || 'Unknown error'));
      setStep('idle');
    }
  };

  const handleEnrollWithUSDC = async () => {
    try {
      setStep('enrolling');
      toast.info('Step 2/2: Enrolling in course...');
      await writeContractAsync({
        address: CONTRACTS.COURSE_CONTRACT as `0x${string}`,
        abi: COURSE_CONTRACT_ABI,
        functionName: 'enrollWithUSDC',
        args: [course.id],
        account: address!,
        chain: base,
      });
    } catch (error: any) {
      console.error('Enrollment error:', error);
      toast.error('Enrollment failed: ' + (error.message || 'Unknown error'));
      setStep('idle');
    }
  };

  const handleEnrollFree = async () => {
    if (!user) {
      toast.error('Please sign in with Farcaster to enroll');
      return;
    }

    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (chainId !== base.id) {
      toast.error('Switching to Base network...');
      switchChain?.({ chainId: base.id });
      return;
    }

    try {
      setStep('enrolling');
      toast.info('Enrolling in free course...');
      await writeContractAsync({
        address: CONTRACTS.COURSE_CONTRACT as `0x${string}`,
        abi: COURSE_CONTRACT_ABI,
        functionName: 'enrollFreeCourse',
        args: [course.id],
        value: parseUnits('0.0000001', 18),
        account: address,
        chain: base,
      });
    } catch (error: any) {
      console.error('Free enrollment error:', error);
      toast.error('Enrollment failed: ' + (error.message || 'Unknown error'));
      setStep('idle');
    }
  };

  const completeEnrollment = async (txHash: `0x${string}`) => {
    try {
      // Create enrollment in database
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user!.id,
          course_id: course.id,
        });

      if (enrollError && !enrollError.message.includes('duplicate')) {
        console.error('Error creating enrollment:', enrollError);
      }

      // Update course enrollment count
      const { data: courseData } = await supabase
        .from('courses')
        .select('enrollment_count')
        .eq('id', course.id)
        .single();

      await supabase
        .from('courses')
        .update({
          enrollment_count: (courseData?.enrollment_count || 0) + 1,
        })
        .eq('id', course.id);

      // Award UP points
      await supabase.functions.invoke('process-transaction-with-fees', {
        body: {
          transactionType: 'buy',
          amountUsd: priceInUSDC,
          transactionHash: txHash,
        },
      });

      toast.success('🎉 Purchase successful! You can now access the course.');
      setStep('idle');
      onPurchaseComplete?.();
    } catch (error) {
      console.error('Error completing enrollment:', error);
      toast.error('Transaction succeeded but enrollment failed. Contact support.');
      setStep('idle');
    }
  };

  return (
    <div className="space-y-3">
      {!isConnected && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <Wallet className="w-4 h-4" />
            <span>Connect your wallet to {isFree ? 'enroll' : 'purchase'}</span>
          </div>
        </div>
      )}

      {isConnected && chainId !== base.id && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-warning">
            <Wallet className="w-4 h-4" />
            <span>Please switch to Base network</span>
          </div>
        </div>
      )}

      {isFree ? (
        <>
          <div className="flex items-center justify-center p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="text-center">
              <p className="text-sm font-bold text-success mb-0.5">Free Course</p>
              <p className="text-xs text-muted-foreground">0.0000001 ETH enrollment fee</p>
            </div>
          </div>

          <Button
            onClick={handleEnrollFree}
            disabled={isLoading || !user || !isConnected || chainId !== base.id}
            className="w-full gap-2"
            size="default"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {isLoading ? 'Enrolling...' : 'Enroll Now (Free)'}
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="text-sm font-semibold text-foreground">Price:</span>
            </div>
            <span className="text-lg font-bold text-primary">${priceInUSDC}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Payment Currency</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedCurrency === 'USDC' ? 'default' : 'outline'}
                onClick={() => setSelectedCurrency('USDC')}
                disabled={isLoading}
                className="w-full text-xs h-9"
              >
                USDC
              </Button>
              <Button
                variant={selectedCurrency === 'ETH' ? 'default' : 'outline'}
                onClick={() => setSelectedCurrency('ETH')}
                disabled={isLoading}
                className="w-full text-xs h-9"
              >
                ETH
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Contract: 0x237b...a48A</p>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={isLoading || !user || !isConnected || chainId !== base.id}
            className="w-full gap-2 text-sm"
            size="default"
          >
            <Zap className="w-3.5 h-3.5" />
            {isLoading
              ? step === 'approving'
                ? 'Approving USDC...'
                : 'Enrolling...'
              : `Buy with ${selectedCurrency}`}
          </Button>

          <div className="pt-2 border-t space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium text-foreground">Base L2</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Platform Fee</span>
              <span className="font-medium text-foreground">2%</span>
            </div>
          </div>
        </>
      )}

      {!user && (
        <p className="text-xs text-muted-foreground text-center">
          Sign in with Farcaster to continue
        </p>
      )}
    </div>
  );
};

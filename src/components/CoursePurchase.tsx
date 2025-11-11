import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFarcasterWallet } from '@/hooks/useFarcasterWallet';
import { useViemClients } from '@/hooks/useViemClients';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'sonner';
import { DollarSign, Zap, BookOpen, Loader2 } from 'lucide-react';
import { 
  COURSE_CONTRACT_ADDRESS, 
  USDC_ADDRESS, 
  COURSE_CONTRACT_ABI, 
  USDC_ABI, 
  FREE_COURSE_FEE 
} from '@/config/wagmi';

interface CoursePurchaseProps {
  course: any;
  onPurchaseComplete?: () => void;
}

export const CoursePurchase = ({ course, onPurchaseComplete }: CoursePurchaseProps) => {
  const { user } = useAuth();
  const { address, isLoading: isWalletLoading } = useFarcasterWallet();
  const { publicClient, walletClient } = useViemClients(address);
  const [selectedCurrency, setSelectedCurrency] = useState<'USDC' | 'ETH'>('USDC');
  const [approvalStep, setApprovalStep] = useState<'idle' | 'approving' | 'approved'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [requiredETH, setRequiredETH] = useState<bigint>(0n);

  const priceInUSDC = parseFloat(course.price_usdc) || 0;
  const isFree = priceInUSDC === 0;

  // Fetch USDC allowance
  useEffect(() => {
    const fetchAllowance = async () => {
      if (!address || isFree || selectedCurrency !== 'USDC' || !publicClient) return;
      
      try {
        const result = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'allowance',
          args: [address, COURSE_CONTRACT_ADDRESS],
        } as any);
        setAllowance(result as bigint);
      } catch (error) {
        console.error('Error fetching allowance:', error);
      }
    };

    fetchAllowance();
  }, [address, isFree, selectedCurrency, publicClient]);

  // Calculate required ETH
  useEffect(() => {
    const calculateETH = async () => {
      if (!publicClient || isFree || selectedCurrency !== 'ETH') return;
      
      try {
        const result = await publicClient.readContract({
          address: COURSE_CONTRACT_ADDRESS,
          abi: COURSE_CONTRACT_ABI,
          functionName: 'calculateETHAmount',
          args: [BigInt(priceInUSDC * 1_000_000)],
        } as any);
        setRequiredETH(result as bigint);
      } catch (error) {
        console.error('Error calculating ETH:', error);
      }
    };

    calculateETH();
  }, [publicClient, isFree, selectedCurrency, priceInUSDC]);

  const handleEnrollmentInDB = async () => {
    if (!user) return;
    
    try {
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .maybeSingle();

      if (existingEnrollment) {
        toast.success('You are already enrolled in this course!');
        onPurchaseComplete?.();
        return;
      }

      await supabase.from('enrollments').insert({
        user_id: user.id,
        course_id: course.id,
      });

      const { data: courseData } = await supabase
        .from('courses')
        .select('enrollment_count')
        .eq('id', course.id)
        .single();

      await supabase
        .from('courses')
        .update({ enrollment_count: (courseData?.enrollment_count || 0) + 1 })
        .eq('id', course.id);

      toast.success('Successfully enrolled! You can now access the course.');
      setIsProcessing(false);
      setApprovalStep('idle');
      onPurchaseComplete?.();
    } catch (error: any) {
      console.error('Error creating enrollment:', error);
      toast.error('Enrollment created on-chain but database update failed');
      setIsProcessing(false);
    }
  };

  const handleApproveUSDC = async () => {
    if (!address || !walletClient || !publicClient) {
      toast.error('Wallet not connected');
      return;
    }

    setApprovalStep('approving');
    setIsProcessing(true);
    
    try {
      const amountToApprove = parseUnits(priceInUSDC.toString(), 6);
      
      toast.info('Please approve the transaction in your wallet...');
      
      const hash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [COURSE_CONTRACT_ADDRESS, amountToApprove],
        account: address,
        chain: walletClient.chain,
      } as any);

      toast.info('Approval transaction submitted. Waiting for confirmation...');
      
      // Wait for transaction confirmation
      await publicClient!.waitForTransactionReceipt({ hash });
      
      // Refetch allowance
      const newAllowance = await publicClient!.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [address, COURSE_CONTRACT_ADDRESS],
      } as any) as bigint;
      
      setAllowance(newAllowance);
      setApprovalStep('approved');
      toast.success('USDC approved! Now enrolling in course...');
      
      // Auto-proceed to enrollment
      setTimeout(() => handleEnrollWithUSDC(), 1000);
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve USDC');
      setApprovalStep('idle');
      setIsProcessing(false);
    }
  };

  const handleEnrollWithUSDC = async () => {
    if (!address || !walletClient || !publicClient) {
      toast.error('Wallet not connected');
      return;
    }

    setIsProcessing(true);
    
    try {
      toast.info('Please confirm the enrollment in your wallet...');
      
      const hash = await walletClient.writeContract({
        address: COURSE_CONTRACT_ADDRESS,
        abi: COURSE_CONTRACT_ABI,
        functionName: 'enrollWithUSDC',
        args: [course.id],
        account: address,
        chain: walletClient.chain,
      } as any);

      toast.info('Enrollment transaction submitted!');
      
      // Wait for confirmation
      await publicClient!.waitForTransactionReceipt({ hash });
      
      toast.success('Transaction confirmed!');
      await handleEnrollmentInDB();
    } catch (error: any) {
      console.error('Enrollment error:', error);
      toast.error(error.message || 'Failed to enroll');
      setApprovalStep('idle');
      setIsProcessing(false);
    }
  };

  const handleEnrollWithETH = async () => {
    if (!address || !walletClient || !publicClient) {
      toast.error('Wallet not connected');
      return;
    }

    if (!requiredETH) {
      toast.error('Unable to calculate ETH price');
      return;
    }

    setIsProcessing(true);
    
    try {
      toast.info('Please confirm the payment in your wallet...');
      
      const hash = await walletClient.writeContract({
        address: COURSE_CONTRACT_ADDRESS,
        abi: COURSE_CONTRACT_ABI,
        functionName: 'enrollWithETH',
        args: [course.id],
        value: requiredETH,
        account: address,
        chain: walletClient.chain,
      } as any);

      toast.info('Enrollment transaction submitted!');
      
      // Wait for confirmation
      await publicClient!.waitForTransactionReceipt({ hash });
      
      toast.success('Transaction confirmed!');
      await handleEnrollmentInDB();
    } catch (error: any) {
      console.error('Enrollment error:', error);
      toast.error(error.message || 'Failed to enroll with ETH');
      setIsProcessing(false);
    }
  };

  const handleEnrollFree = async () => {
    if (!address || !walletClient || !publicClient) {
      toast.error('Wallet not connected');
      return;
    }

    setIsProcessing(true);
    
    try {
      toast.info('Please confirm the enrollment fee in your wallet...');
      
      const hash = await walletClient.writeContract({
        address: COURSE_CONTRACT_ADDRESS,
        abi: COURSE_CONTRACT_ABI,
        functionName: 'enrollFreeCourse',
        args: [course.id],
        value: FREE_COURSE_FEE,
        account: address,
        chain: walletClient.chain,
      } as any);

      toast.info('Enrollment transaction submitted!');
      
      // Wait for confirmation
      await publicClient!.waitForTransactionReceipt({ hash });
      
      toast.success('Transaction confirmed!');
      await handleEnrollmentInDB();
    } catch (error: any) {
      console.error('Free enrollment error:', error);
      toast.error(error.message || 'Failed to enroll in free course');
      setIsProcessing(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please sign in with Farcaster to purchase courses');
      return;
    }

    if (isWalletLoading) {
      toast.info('Loading your wallet...');
      return;
    }

    if (!address) {
      toast.error('Could not fetch your Farcaster wallet address');
      return;
    }

    if (selectedCurrency === 'USDC') {
      const amountNeeded = parseUnits(priceInUSDC.toString(), 6);
      
      if (allowance < amountNeeded) {
        await handleApproveUSDC();
      } else {
        await handleEnrollWithUSDC();
      }
    } else {
      await handleEnrollWithETH();
    }
  };

  return (
    <div className="space-y-3">
      {isFree ? (
        <>
          <div className="flex items-center justify-center p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="text-center">
              <p className="text-sm font-bold text-success mb-0.5">Free Course</p>
              <p className="text-xs text-muted-foreground">Pay 0.0000001 ETH enrollment fee</p>
            </div>
          </div>

          <Button
            onClick={handleEnrollFree}
            disabled={isProcessing || !user || !address || isWalletLoading}
            className="w-full gap-2"
            size="default"
          >
            {isWalletLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading wallet...
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                Enroll Now
              </>
            )}
          </Button>

          {!user && (
            <p className="text-xs text-muted-foreground text-center">
              Sign in with Farcaster to enroll
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="text-sm font-semibold text-foreground">Price:</span>
            </div>
            <span className="text-lg font-bold text-primary">
              ${priceInUSDC}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Payment Currency</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedCurrency === 'USDC' ? 'default' : 'outline'}
                onClick={() => setSelectedCurrency('USDC')}
                disabled={isProcessing}
                className="w-full text-xs h-9"
              >
                USDC
              </Button>
              <Button
                variant={selectedCurrency === 'ETH' ? 'default' : 'outline'}
                onClick={() => setSelectedCurrency('ETH')}
                disabled={isProcessing}
                className="w-full text-xs h-9"
              >
                ETH
              </Button>
            </div>
            {selectedCurrency === 'ETH' && requiredETH > 0n && (
              <p className="text-[10px] text-muted-foreground">
                ≈ {formatUnits(requiredETH, 18)} ETH
              </p>
            )}
          </div>

          <Button
            onClick={handlePurchase}
            disabled={isProcessing || !user || !address || isWalletLoading}
            className="w-full gap-2 text-sm"
            size="default"
          >
            {isWalletLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading wallet...
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {approvalStep === 'approving' ? 'Approving USDC...' : 'Processing...'}
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Buy with {selectedCurrency}
              </>
            )}
          </Button>

          {!user && (
            <p className="text-xs text-muted-foreground text-center">
              Sign in with Farcaster to purchase
            </p>
          )}

          <div className="pt-2 border-t space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium text-foreground">Base L2</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Access</span>
              <span className="font-medium text-success">Instant</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

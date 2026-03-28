

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFarcasterWallet } from '@/hooks/useFarcasterWallet';
import { useViemClients } from '@/hooks/useViemClients';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'sonner';
import { DollarSign, Zap, BookOpen, Loader2, User, Star, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShareButtons } from '@/components/ShareButtons';
import { ShareToFarcaster } from '@/components/ShareToFarcaster';
import {
  COURSE_CONTRACT_ADDRESS, 
  USDC_ADDRESS, 
  COURSE_CONTRACT_ABI, 
  USDC_ABI, 
  FREE_COURSE_FEE 
} from '@/config/wagmi';

interface AuthorProfile {
  display_name: string | null;
  avatar_url: string | null;
  farcaster_username: string | null;
}

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
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [enrollmentComplete, setEnrollmentComplete] = useState(false);

  
  const priceInUSDC = parseFloat(course.price_usdc) || 0;
  const isFree = priceInUSDC === 0;

  
  // Fetch author profile
  useEffect(() => {
    const fetchAuthorProfile = async () => {
      if (!course.user_id) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, farcaster_username')
          .eq('user_id', course.user_id)
          .maybeSingle();
        
        if (data) {
          setAuthorProfile(data);
        }
      } catch (error) {
        console.error('Error fetching author profile:', error);
      }
    };

    fetchAuthorProfile();
  }, [course.user_id]);

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

  const handleEnrollmentInDB = async (transactionHash: string, currency: 'USDC' | 'ETH') => {
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

      // Create enrollment
      await supabase.from('enrollments').insert({
        user_id: user.id,
        course_id: course.id,
      });

      // Use RPC function to accurately increment enrollment count
      await supabase.rpc('increment_enrollment_count', { 
        course_id: course.id 
      });

      // Record the payment for tutor earnings tracking
      if (!isFree) {
        const { error: paymentError } = await supabase
          .from('course_payments')
          .insert({
            course_id: course.id,
            buyer_user_id: user.id,
            seller_user_id: course.user_id,
            amount: priceInUSDC,
            currency: currency,
            chain: 'base',
            status: 'completed',
            transaction_hash: transactionHash,
            completed_at: new Date().toISOString(),
          });

        if (paymentError) {
          console.error('Failed to record payment:', paymentError);
          // Don't fail enrollment if payment recording fails
        }

        // Award points for course purchase (10 UP per $1 spent, max 1000 UP)
        const pointsToAward = Math.min(Math.floor(priceInUSDC * 10), 1000);
        
        // Get or create user points record
        let { data: userPoints } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!userPoints) {
          const { data: newPoints } = await supabase
            .from('user_points')
            .insert({ user_id: user.id, total_points: 0 })
            .select()
            .single();
          userPoints = newPoints;
        }

        // Update total points
        if (userPoints) {
          await supabase
            .from('user_points')
            .update({ total_points: (userPoints.total_points || 0) + pointsToAward })
            .eq('user_id', user.id);

          // Record point event
          await supabase
            .from('point_events')
            .insert({
              user_id: user.id,
              event_type: 'course_purchase',
              points_earned: pointsToAward,
              transaction_amount: priceInUSDC,
              transaction_hash: transactionHash,
            });
        }
      }

      toast.success('Successfully enrolled! You can now access the course.');
      setIsProcessing(false);
      setApprovalStep('idle');
      setEnrollmentComplete(true);
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
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      
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
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      
      toast.success('Transaction confirmed!');
      await handleEnrollmentInDB(receipt.transactionHash, 'USDC');
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
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      
      toast.success('Transaction confirmed!');
      await handleEnrollmentInDB(receipt.transactionHash, 'ETH');
    } catch (error: any) {
      console.error('Enrollment error:', error);
      toast.error(error.message || 'Failed to enroll with ETH');
      setIsProcessing(false);
    }
  };

  const handleEnrollFree = async () => {
    if (!address || !walletClient || !publicClient) {
      toast.error('Wallet not ready. Please try again in a moment.');
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
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      
      toast.success('Transaction confirmed!');
      await handleEnrollmentInDB(receipt.transactionHash, 'ETH');
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

    if (!address || !walletClient || !publicClient) {
      toast.info('Connecting wallet...');
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

  // Get truncated description - first 80 characters
  const getTruncatedDescription = (desc: string) => {
    if (!desc) return '';
    const firstParagraph = desc.split('\n')[0];
    if (firstParagraph.length <= 80) return firstParagraph;
    return firstParagraph.substring(0, 80) + '...';
  };

  if (enrollmentComplete) {
    return (
      <div className="space-y-4 text-center py-4">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Enrolled Successfully!</h3>
        <p className="text-sm text-muted-foreground">You're now enrolled in <strong>{course.title}</strong></p>
        <div className="space-y-2">
          <ShareToFarcaster
            text={`I just enrolled in "${course.title}" on @uniquehub! 🎓\n\nJoin me on the ultimate Web3 learning platform!`}
            embeds={['https://uniquehub.xyz']}
            buttonText="Share on Farcaster"
            variant="default"
            size="lg"
            className="w-full"
          />
          <ShareButtons
            text={`I just enrolled in "${course.title}" on UniqueHub! 🎓\n\nJoin me on the ultimate Web3 learning platform!`}
            url="https://uniquehub.xyz"
            showFarcaster={false}
            showTwitter={true}
            variant="outline"
            size="default"
            buttonText="Share on X"
            className="w-full justify-center"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Course Thumbnail - Compact */}
      {course.thumbnail_url && (
        <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden bg-muted">
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Course Title & Rating - Inline */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-foreground line-clamp-1 flex-1">{course.title}</h3>
        {course.rating > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">{course.rating?.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Author Info - Compact inline */}
      {authorProfile && (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={authorProfile.avatar_url || ''} alt={authorProfile.display_name || 'Author'} />
            <AvatarFallback>
              <User className="w-3 h-3" />
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">
            {authorProfile.farcaster_username ? `@${authorProfile.farcaster_username}` : authorProfile.display_name || 'Anonymous'}
          </span>
        </div>
      )}

      {/* Course Description - Very short */}
      {course.description && (
        <p className="text-xs text-foreground/70 line-clamp-2">{getTruncatedDescription(course.description)}</p>
      )}

      {/* Purchase Section */}
      {isFree ? (
        <>
          <div className="flex items-center justify-center p-2 bg-success/10 rounded-lg border border-success/20">
            <div className="text-center">
              <p className="text-xs font-bold text-success">Free Course</p>
              <p className="text-xs text-muted-foreground">Pay 0.0000001 ETH enrollment fee</p>
            </div>
          </div>

          <Button
            onClick={handleEnrollFree}
            disabled={isProcessing || !user || !address || !walletClient || !publicClient}
            className="w-full gap-2"
            size="default"
          >
            {!address || !walletClient || !publicClient ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Connecting wallet...
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
          <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-semibold text-foreground">Price:</span>
            </div>
            <span className="text-base font-bold text-primary">
              ${priceInUSDC}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Pay with</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedCurrency === 'USDC' ? 'default' : 'outline'}
                onClick={() => setSelectedCurrency('USDC')}
                disabled={isProcessing}
                className="w-full text-xs h-8"
              >
                USDC
              </Button>
              <Button
                variant={selectedCurrency === 'ETH' ? 'default' : 'outline'}
                onClick={() => setSelectedCurrency('ETH')}
                disabled={isProcessing}
                className="w-full text-xs h-8"
              >
                ETH {selectedCurrency === 'ETH' && requiredETH > 0n && `(≈${formatUnits(requiredETH, 18).slice(0,8)})`}
              </Button>
            </div>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={isProcessing || !user || !address || !walletClient || !publicClient}
            className="w-full gap-2 text-sm"
            size="sm"
          >
            {!address || !walletClient || !publicClient ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Connecting...
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {approvalStep === 'approving' ? 'Approving...' : 'Processing...'}
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Buy with {selectedCurrency}
              </>
            )}
          </Button>

          {!user && (
            <p className="text-[10px] text-muted-foreground text-center">
              Sign in to purchase
            </p>
          )}
        </>
      )}
    </div>
  );
};

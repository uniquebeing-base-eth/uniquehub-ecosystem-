import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DollarSign, Zap, BookOpen } from 'lucide-react';

/**
 * Course Purchase Component
 * Handles course purchase via transaction frames on Base L2
 */
interface CoursePurchaseProps {
  course: any;
  onPurchaseComplete?: () => void;
}

export const CoursePurchase = ({ course, onPurchaseComplete }: CoursePurchaseProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'USDC' | 'ETH'>('USDC');

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please sign in with Farcaster to purchase courses');
      return;
    }

    setLoading(true);
    try {
      // Create transaction frame for purchase
      const { data, error } = await supabase.functions.invoke('create-course-payment-frame', {
        body: {
          courseId: course.id,
          currency: selectedCurrency,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Transaction frame created! Complete payment in your wallet.');
        console.log('Transaction frame:', data.frameMetadata);
        // In a real Farcaster miniapp, this would trigger the transaction frame
        // For now, we'll simulate the payment verification
        
        // Simulate transaction completion (in production, this happens via frame callback)
        setTimeout(async () => {
          toast.info('Simulating payment completion...');
          
          // Award UP points for purchase
          try {
            const { data: pointsData } = await supabase.functions.invoke('process-transaction-with-fees', {
              body: {
                transactionType: 'buy',
                amountUsd: priceInUSDC,
                transactionHash: data.paymentId, // Using payment ID as simulated tx hash
              },
            });

            if (pointsData?.success) {
              toast.success(`🎉 ${pointsData.message}`, { duration: 5000 });
            }
          } catch (error) {
            console.error('Error awarding points:', error);
          }
          
          onPurchaseComplete?.();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error creating payment frame:', error);
      toast.error(error.message || 'Failed to create payment transaction');
    } finally {
      setLoading(false);
    }
  };

  const priceInUSDC = parseFloat(course.price_usdc) || 0;

  const isFree = priceInUSDC === 0;

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please sign in with Farcaster to enroll');
      return;
    }

    setLoading(true);
    try {
      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .single();

      if (existingEnrollment) {
        toast.success('You are already enrolled in this course!');
        onPurchaseComplete?.();
        return;
      }

      // Create enrollment for free course
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: course.id,
        });

      if (error) throw error;

      // Update enrollment count
      await supabase
        .from('courses')
        .update({ enrollment_count: (course.enrollment_count || 0) + 1 })
        .eq('id', course.id);

      toast.success('Successfully enrolled! You can now access the course.');
      onPurchaseComplete?.();
    } catch (error: any) {
      console.error('Error enrolling:', error);
      toast.error(error.message || 'Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {isFree ? (
        <>
          <div className="flex items-center justify-center p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="text-center">
              <p className="text-sm font-bold text-success mb-0.5">Free Course</p>
              <p className="text-xs text-muted-foreground">Enroll now to get instant access</p>
            </div>
          </div>

          <Button
            onClick={handleEnroll}
            disabled={loading || !user}
            className="w-full gap-2"
            size="default"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {loading ? 'Enrolling...' : 'Enroll Now'}
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
                className="w-full text-xs h-9"
              >
                USDC
              </Button>
              <Button
                variant={selectedCurrency === 'ETH' ? 'default' : 'outline'}
                onClick={() => setSelectedCurrency('ETH')}
                className="w-full text-xs h-9"
              >
                ETH
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Pay with {selectedCurrency} on Base L2
            </p>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={loading || !user}
            className="w-full gap-2 text-sm"
            size="default"
          >
            <Zap className="w-3.5 h-3.5" />
            {loading ? 'Creating...' : `Buy with ${selectedCurrency}`}
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

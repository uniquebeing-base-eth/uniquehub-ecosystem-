import { Wallet, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const WalletConnector = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="bg-card border-t border-border p-4">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="text-sm">
              {user ? (
                <>
                  <div className="font-medium text-foreground">Connected</div>
                  <div className="text-muted-foreground">
                    {user.user_metadata?.farcaster_username || 'Farcaster User'}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-medium text-foreground">Wallet</div>
                  <div className="text-muted-foreground">Connect with Farcaster</div>
                </>
              )}
            </div>
          </div>
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-sm"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Sign Out
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
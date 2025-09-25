import { Wallet, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FarcasterAuth } from "./FarcasterAuth";
import { useState } from "react";

export const WalletConnector = () => {
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleConnect = () => {
    setShowAuth(true);
  };

  if (showAuth && !user) {
    return (
      <div className="bg-card border-t border-border p-6">
        <div className="container mx-auto px-6">
          <FarcasterAuth />
          <div className="text-center mt-4">
            <button
              onClick={() => setShowAuth(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          ) : (
            <Button
              onClick={handleConnect}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Connect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
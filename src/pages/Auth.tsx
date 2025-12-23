import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Wallet, Mail, Twitter } from 'lucide-react';
import cubeLogo from '@/assets/uniquehub-cube.png';

const Auth = () => {
  const navigate = useNavigate();
  const { login, authenticated, ready } = usePrivy();

  useEffect(() => {
    if (ready && authenticated) {
      navigate('/');
    }
  }, [ready, authenticated, navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
              <img src={cubeLogo} alt="UniqueHub" className="h-20 w-20 relative z-10" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              UniqueHUB
            </h1>
            <p className="text-muted-foreground mt-2">
              Learn, Earn & Trade in Web3
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card/80 backdrop-blur-lg rounded-3xl border border-border p-8 shadow-2xl shadow-primary/5">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-foreground">Welcome Back</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to continue your journey
            </p>
          </div>

          {/* Login Methods Preview */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Wallet</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Email</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
                <svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8 0-5.52-4.48-10-10-10z"/>
                </svg>
                <span className="text-sm font-medium text-foreground">Farcaster</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
                <Twitter className="h-5 w-5 text-sky-500" />
                <span className="text-sm font-medium text-foreground">Twitter</span>
              </div>
            </div>
          </div>

          {/* Main Login Button */}
          <Button
            onClick={handleLogin}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white rounded-2xl shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign In / Sign Up
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Choose your preferred sign-in method
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg">🎓</span>
            </div>
            <p className="text-xs text-muted-foreground">Learn Skills</p>
          </div>
          <div className="space-y-2">
            <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg">💰</span>
            </div>
            <p className="text-xs text-muted-foreground">Earn Rewards</p>
          </div>
          <div className="space-y-2">
            <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg">🛍️</span>
            </div>
            <p className="text-xs text-muted-foreground">Trade NFTs</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default Auth;

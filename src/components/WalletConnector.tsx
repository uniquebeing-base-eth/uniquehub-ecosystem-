import { Wallet } from "lucide-react";

export const WalletConnector = () => {
  return (
    <div className="bg-card border-t border-border p-4">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-foreground">Wallet</div>
              <div className="text-muted-foreground">Connect to get started</div>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};
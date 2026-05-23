import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <main className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <h1 className="text-6xl font-semibold tracking-tight">404</h1>
      <p className="text-muted-foreground">This page doesn't exist.</p>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  </main>
);

export default NotFound;

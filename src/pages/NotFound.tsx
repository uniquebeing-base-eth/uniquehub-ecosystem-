
import { useLocation } from "react-router-dom";
import { useEffect } from "react";


const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">UniqueHub</h1>
        <p className="text-xl text-muted-foreground">Web3 Learning & Trading Platform</p>
      </div>
    </div>
  );
};

export default NotFound;

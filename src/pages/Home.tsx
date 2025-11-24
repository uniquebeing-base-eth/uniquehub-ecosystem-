import { HomeSection } from "@/components/sections/HomeSection";
import { useAuth } from "@/hooks/useAuth";

const Home = () => {
  const { user } = useAuth();
  return <HomeSection userName={user?.user_metadata?.display_name || user?.user_metadata?.username || 'Uniquebeing'} />;
};

export default Home;

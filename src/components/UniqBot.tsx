
import { useState, useEffect, useRef } from "react";
import { Send, Minimize2, Mic } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import uniqbotAvatar from "@/assets/uniqbot-avatar.png";
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export const UniqBot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('uniqbot_position');
    if (saved) return JSON.parse(saved);
    // Default to bottom right corner
    return { 
      x: window.innerWidth - 84, // 64px avatar + 20px margin
      y: window.innerHeight - 200 // Above bottom nav + more clearance
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState("home");
  const [userData, setUserData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const savedNew = localStorage.getItem("uniqbot_chat_history");
    const savedOld = localStorage.getItem("uniqbot-messages");
    if (savedNew) {
      setMessages(JSON.parse(savedNew));
    } else if (savedOld) {
      try {
        const parsed = JSON.parse(savedOld);
        setMessages(parsed);
        localStorage.setItem("uniqbot_chat_history", savedOld);
        localStorage.removeItem("uniqbot-messages");
      } catch {
        // ignore parsing errors
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("uniqbot_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Track current page/section
  useEffect(() => {
    const handleNavigation = (event: any) => {
      const section = event.detail?.section || event.detail;
      if (section) {
        setCurrentPage(section.toLowerCase());
      }
    };

    // Check hash on mount and changes
    const updateFromHash = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setCurrentPage(hash.toLowerCase());
    };

    updateFromHash();
    window.addEventListener('navigate', handleNavigation);
    window.addEventListener('navigateToSection', handleNavigation);
    window.addEventListener('hashchange', updateFromHash);

    return () => {
      window.removeEventListener('navigate', handleNavigation);
      window.removeEventListener('navigateToSection', handleNavigation);
      window.removeEventListener('hashchange', updateFromHash);
    };
  }, []);

  // Fetch user progress data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Fetch user points and streaks
        const { data: pointsData } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Fetch enrolled courses
        const { data: enrollmentsData } = await supabase
          .from('enrollments')
          .select('*, courses(*)')
          .eq('user_id', user.id);

        // Fetch completed modules
        const { data: completionsData } = await supabase
          .from('module_completions')
          .select('*')
          .eq('user_id', user.id);

        // Fetch learning streak
        const { data: streakData } = await supabase
          .from('user_learning_streaks')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setUserData({
          points: pointsData,
          enrollments: enrollmentsData || [],
          completedModules: completionsData?.length || 0,
          streak: streakData
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("uniqbot-chat", {
        body: { 
          messages: [...messages, userMessage],
          currentPage,
          userData
        },
      });

      if (error) {
        console.error("Error:", error);
        // Check if it's a payment or rate limit error
        if (error.message?.includes('credits depleted') || error.message?.includes('402')) {
          toast.error("AI service is temporarily unavailable. Please contact support.");
        } else if (error.message?.includes('Too many requests') || error.message?.includes('429')) {
          toast.error("Too many requests. Please wait a moment and try again.");
        } else {
          toast.error(error.message || "Failed to get response. Please try again.");
        }
        return;
      }

      if (data?.error) {
        console.error("API Error:", data.error);
        toast.error(data.error);
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("uniqbot_chat_history");
    localStorage.removeItem("uniqbot-messages");
    toast.success("Chat history cleared");
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) return;
    e.preventDefault();
    setIsDragging(true);
    const t = e.touches[0];
    setDragOffset({ 
      x: t.clientX - position.x, 
      y: t.clientY - position.y 
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 64, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 64, e.clientY - dragOffset.y));
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    localStorage.setItem('uniqbot_position', JSON.stringify(position));
  };

  useEffect(() => {
    if (isDragging) {
      const onTouchMove = (e: TouchEvent) => {
        const t = e.touches[0];
        const newX = Math.max(0, Math.min(window.innerWidth - 64, t.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 64, t.clientY - dragOffset.y));
        setPosition({ x: newX, y: newY });
      };
      const onTouchEnd = () => {
        setIsDragging(false);
        localStorage.setItem('uniqbot_position', JSON.stringify(position));
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onTouchEnd);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
      };
    }
  }, [isDragging, dragOffset, position]);

  return (
    <>
      {/* Floating Avatar */}
      {!isOpen && (
        <div
          className="fixed z-50 cursor-move select-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={() => !isDragging && setIsOpen(true)}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-crypto-blue p-1 flex items-center justify-center shadow-lg pulse cursor-pointer hover:scale-110 transition-transform">
              <img src={uniqbotAvatar} alt="UniqBot avatar" className="w-14 h-14 rounded-full object-cover" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[70] md:right-4 md:bottom-4 md:left-auto md:w-96 md:h-[600px] h-full animate-enter">
          <div className="bg-background rounded-t-3xl md:rounded-2xl shadow-2xl border border-border h-full flex flex-col overflow-hidden">
            {/* Header */}
              <div className="bg-gradient-to-r from-primary to-crypto-blue p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={uniqbotAvatar} alt="UniqBot" className="w-10 h-10 rounded-full object-cover bg-background" />
                  <div>
                    <h3 className="font-semibold text-white">UniqBot</h3>
                    <p className="text-xs text-white/80">AI Assistant</p>
                  </div>
                </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={clearChat}
                  className="text-white hover:bg-white/20 text-xs sm:text-sm"
                >
                  🗑 Clear Chat
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">Hi! I’m UniqBot 👋 Ask me anything about UniqueHub or learning!</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-1">
                        <img src={uniqbotAvatar} alt="UniqBot" className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs font-semibold">UniqBot</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-muted rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </ScrollArea>

            {/* Input */}
            <div className="p-4 pb-[max(env(safe-area-inset-bottom),0.5rem)] border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about UniqueHub or learning ✨"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" disabled className="opacity-60 cursor-not-allowed" aria-label="Microphone (coming soon)">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

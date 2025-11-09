import { useState, useEffect, useRef } from "react";
import { X, Send, Trash2, Minimize2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export const UniqBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("uniqbot-messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("uniqbot-messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        body: { messages: [...messages, userMessage] },
      });

      if (error) throw error;

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
    localStorage.removeItem("uniqbot-messages");
    toast.success("Chat history cleared");
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <>
      {/* Floating Avatar */}
      {!isOpen && (
        <div
          className="fixed z-50 cursor-move select-none"
          style={{
            right: `${position.x}px`,
            bottom: `${position.y}px`,
          }}
          onMouseDown={handleMouseDown}
          onClick={() => !isDragging && setIsOpen(true)}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-crypto-blue flex items-center justify-center shadow-lg animate-pulse cursor-pointer hover:scale-110 transition-transform">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">U</span>
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:right-4 md:bottom-4 md:left-auto md:w-96 md:h-[600px] h-full animate-slide-in-bottom">
          <div className="bg-background rounded-t-3xl md:rounded-2xl shadow-2xl border border-border h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-crypto-blue p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">U</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">UniqBot</h3>
                  <p className="text-xs text-white/80">AI Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  className="text-white hover:bg-white/20"
                >
                  <Trash2 className="h-4 w-4" />
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
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p className="mb-2">👋 Hi! I'm UniqBot</p>
                  <p className="text-sm">Ask me anything about UniqueHub or learning!</p>
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
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-crypto-blue flex items-center justify-center">
                          <span className="text-xs font-bold text-white">U</span>
                        </div>
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
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
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

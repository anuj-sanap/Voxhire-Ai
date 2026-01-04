import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Phone, PhoneOff, Send, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface AgentProps {
  userName?: string;
  type?: "generate" | "interview";
  interviewId?: string;
  role?: string;
  interviewType?: string;
  techStack?: string[];
  questions?: string[];
  onComplete?: (transcript: string) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Agent = ({ 
  userName = "User", 
  type = "interview",
  interviewId,
  role = "Developer",
  interviewType = "technical",
  techStack = [],
  questions = [],
  onComplete
}: AgentProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const systemPrompt = `You are an expert AI interviewer conducting a mock ${interviewType} interview for a ${role} position.

${techStack.length > 0 ? `The candidate should be familiar with: ${techStack.join(', ')}` : ''}

Your behavior:
- Be professional, friendly, and encouraging
- Ask one question at a time and wait for the candidate's response
- Provide brief acknowledgments (1-2 sentences) before moving to the next question
- If the candidate seems stuck, offer gentle prompts
- Keep responses concise for natural conversation flow
- When all questions are asked, thank the candidate and let them know feedback will be ready shortly

${questions.length > 0 ? `Interview questions to ask (in order):
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

Current question number: ${currentQuestionIndex + 1} of ${questions.length}

Start by greeting the candidate named ${userName}, briefly introduce yourself as their AI interviewer, and ask the first question.`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    setIsProcessing(true);
    setIsSpeaking(true);

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setTranscript(prev => [...prev, `${userName}: ${userMessage}`]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            systemPrompt 
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      setTranscript(prev => [...prev, `AI Interviewer: ${assistantMessage}`]);
      
      // Check if we should move to next question
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
      });
    } finally {
      setIsProcessing(false);
      setIsSpeaking(false);
    }
  };

  const handleCall = async () => {
    if (isCallActive) {
      // End call - generate feedback
      setIsCallActive(false);
      setIsSpeaking(false);
      
      if (onComplete) {
        onComplete(transcript.join("\n\n"));
      } else if (interviewId) {
        // Navigate to feedback page
        navigate(`/interview/${interviewId}`);
      }
    } else {
      setIsCallActive(true);
      // Send initial greeting
      await streamChat("Hello, I'm ready to begin the interview.");
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    const message = inputText.trim();
    setInputText("");
    await streamChat(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Agent Cards */}
      <div className="call-view">
        {/* AI Avatar Card */}
        <div className="card-interviewer">
          <div className="relative">
            {/* Pulsing animation when speaking */}
            {isSpeaking && isCallActive && (
              <div className="animate-speak" />
            )}
            
            {/* Avatar */}
            <div className={cn(
              "z-10 flex items-center justify-center blue-gradient rounded-full size-28 relative",
              isCallActive && "animate-pulse-glow"
            )}>
              <img
                src="/ai-avatar.svg"
                alt="AI Interviewer"
                className="size-16"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23CAC5FE'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
                }}
              />
            </div>
          </div>

          <h3 className="text-center text-primary-100 mt-4 font-semibold">
            {isCallActive ? (isSpeaking ? "AI is responding..." : "Listening...") : "AI Interviewer"}
          </h3>

          {/* Call Controls */}
          <div className="flex items-center gap-4 mt-4">
            {isCallActive && (
              <button
                onClick={toggleMute}
                className={cn(
                  "p-3 rounded-full transition-all duration-200",
                  isMuted
                    ? "bg-destructive-100 hover:bg-destructive-200"
                    : "bg-dark-200 hover:bg-dark-300 border border-border"
                )}
              >
                {isMuted ? (
                  <MicOff className="size-5 text-white" />
                ) : (
                  <Mic className="size-5 text-foreground" />
                )}
              </button>
            )}

            <button
              onClick={handleCall}
              disabled={isProcessing}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-200",
                isCallActive
                  ? "btn-disconnect"
                  : "btn-call"
              )}
            >
              {isCallActive ? (
                <>
                  <PhoneOff className="size-5" />
                  <span>End Interview</span>
                </>
              ) : (
                <>
                  <Phone className="size-5" />
                  <span>Start Interview</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="card-border flex-1 sm:basis-1/2 w-full h-[400px] max-md:hidden">
          <div className="card-content flex flex-col gap-4 justify-center items-center p-7">
            <div className="size-28 rounded-full bg-gradient-to-br from-primary-200/20 to-accent/10 flex items-center justify-center border-2 border-primary-200/30">
              <span className="text-4xl font-bold text-primary-200">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="text-center text-foreground font-semibold">{userName}</h3>
            <p className="text-muted-foreground text-sm">
              {isCallActive ? (isMuted ? "Muted" : "Connected") : "Ready to connect"}
            </p>
            {isCallActive && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Volume2 className="size-3" />
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      {isCallActive && (
        <div className="card-border w-full">
          <div className="card-content p-4">
            {/* Messages */}
            <div className="max-h-64 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-xl max-w-[80%]",
                    message.role === "user"
                      ? "ml-auto bg-primary-200/20 text-foreground"
                      : "mr-auto bg-dark-200 text-foreground"
                  )}
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {message.role === "user" ? userName : "AI Interviewer"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your response..."
                className="form-input flex-1"
                disabled={isProcessing}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isProcessing}
                className="btn-primary px-4"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agent;

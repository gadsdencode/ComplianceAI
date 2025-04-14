import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User } from "lucide-react";
import { AIMessage } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

type AIAssistantProps = {
  initialMessages?: AIMessage[];
  suggestedPrompts?: string[];
};

export default function AIAssistant({ 
  initialMessages = [],
  suggestedPrompts = [
    "Generate ISO documentation",
    "Schedule meeting with auditor",
    "Show compliance checklist"
  ]
}: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages.length > 0 
    ? initialMessages 
    : [
        {
          id: "welcome",
          role: "assistant",
          content: "Hi! I'm your ComplianceAI Assistant. How can I help you with your compliance tasks today?",
          timestamp: new Date().toISOString()
        }
      ]
  );
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      // Format messages for OpenAI API
      const messagesToSend = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Call OpenAI API through our backend
      const response = await apiRequest(
        'POST',
        '/api/ai/chat',
        {
          messages: messagesToSend,
          model: "gpt-4", // Or other model as configured
          temperature: 0.7,
          max_tokens: 500,
          context: "You are a helpful AI assistant specialized in compliance, regulations, and governance. Help users with their compliance tasks, documentation, and provide guidance on regulatory requirements."
        }
      );
      
      const responseData = await response.json();
      
      // Add AI response to messages
      const assistantMessage: AIMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: responseData.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Add error message
      const errorMessage: AIMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    handleSendMessage();
  };

  // Automatically send the message after setting the input value from a suggestion
  useEffect(() => {
    if (inputValue && inputValue.trim() && inputValue === suggestedPrompts.find(p => p === inputValue)) {
      handleSendMessage();
    }
  }, [inputValue]);

  return (
    <section className="mb-8">
      <Card className="shadow overflow-hidden border border-slate-200">
        <CardHeader className="p-4 border-b border-slate-200 flex flex-row items-center">
          <Bot className="text-primary-600 mr-2" size={20} />
          <CardTitle className="text-base font-medium">ComplianceAI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4 mb-4 max-h-[350px] overflow-y-auto custom-scrollbar">
            {messages.map((message) => (
              <div key={message.id} className={cn(
                "flex items-start",
                message.role === "user" ? "justify-end" : ""
              )}>
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center">
                      <Bot className="text-primary-600" size={16} />
                    </div>
                  </div>
                )}
                
                <div className={cn(
                  "rounded-lg p-3 max-w-[85%]",
                  message.role === "assistant" ? "bg-slate-100" : "bg-primary-50"
                )}>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{message.content}</p>
                </div>
                
                {message.role === "user" && (
                  <div className="flex-shrink-0 ml-3">
                    <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center text-white">
                      <User size={16} />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="relative mt-4">
            <Input
              type="text"
              className="w-full border-2 border-slate-300 rounded-full py-2 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
            />
            <Button 
              size="icon"
              className="absolute right-1 top-1 bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-primary-700"
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <div className="inline-flex flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <Button 
                  key={index} 
                  variant="outline"
                  size="sm"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm h-auto py-1"
                  onClick={() => handleSuggestedPrompt(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Menu, X, Trash2, MessageSquare, Settings, Moon, Sun, Volume2, VolumeX, Copy, Download } from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
  timestamp: string;
  sources?: string[];
}

export default function ResponsiveSportsChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "bot", 
      content: "Hello! How can I help you with sports today?", 
      timestamp: new Date().toLocaleTimeString()
    },
  ]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("online");
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [useStreaming, setUseStreaming] = useState(false);
  const [fontSize, setFontSize] = useState("text-sm");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prompts = [
    "History of Cricket",
    "What are the rules of Cricket?",
    "When did Olympics start?",
    "History of Football",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const playNotificationSound = () => {
    if (soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.log("Audio context not available");
      }
    }
  };

  const sendStreamingMessage = async (queryText: string) => {
    const userMessage: Message = { 
      role: "user", 
      content: queryText,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setConnectionStatus("connecting");

    
    const botMessageId = Date.now();
    const initialBotMessage: Message = {
      role: "bot",
      content: "",
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, { ...initialBotMessage, content: "" }]);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: queryText,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          streamedContent += chunk;
          
          
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (newMessages[lastIndex].role === "bot") {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: streamedContent
              };
            }
            return newMessages;
          });
        }
      }

      setConnectionStatus("online");
      playNotificationSound();
      
    } catch (error) {
      console.error("Streaming Error:", error);
      
      
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (newMessages[lastIndex].role === "bot") {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: "Unable to connect to the sports knowledge base. Please ensure the backend server is running."
          };
        }
        return newMessages;
      });
      setConnectionStatus("offline");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const queryText = text || input;
    if (!queryText.trim() || isLoading) return;

    if (useStreaming) {
      return sendStreamingMessage(queryText);
    }

    const userMessage: Message = { 
      role: "user", 
      content: queryText,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setConnectionStatus("connecting");

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: queryText,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage: Message = {
        role: "bot",
        content: data.answer || "I couldn't find a relevant answer to your question.",
        sources: data.sources?.map((s: any) => s.source || "Unknown") || [],
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setConnectionStatus("online");
      playNotificationSound();
      
    } catch (error) {
      console.error("API Error:", error);
      
      let errorMessage = "Unable to connect to the sports knowledge base. ";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += "Please ensure:\n\n1. Backend server is running (uvicorn main:app --reload)\n2. Server is accessible at http://127.0.0.1:8000\n3. CORS is properly configured";
        setConnectionStatus("offline");
      } else if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage += "Service endpoint not found. Please check if the backend server is running.";
        } else if (error.message.includes('500')) {
          errorMessage += "Server error occurred. Please try again in a moment.";
        } else {
          errorMessage += `Connection error: ${error.message}`;
        }
        setConnectionStatus("offline");
      } else {
        errorMessage += "An unexpected error occurred. Please try again.";
        setConnectionStatus("offline");
      }

      setMessages((prev) => [
        ...prev,
        { 
          role: "bot", 
          content: errorMessage,
          timestamp: new Date().toLocaleTimeString()
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ 
      role: "bot", 
      content: "Chat cleared! How can I help you with sports today?",
      timestamp: new Date().toLocaleTimeString()
    }]);
    playNotificationSound();
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      console.log('Message copied');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const exportChat = () => {
    const chatText = messages.map(msg => {
      let text = `[${msg.timestamp}] ${msg.role === 'user' ? 'You' : 'Sports Assistant'}: ${msg.content}`;
      if (msg.sources && msg.sources.length > 0) {
        text += `\n\nSources:\n${msg.sources.map(source => `- ${source}`).join('\n')}`;
      }
      return text;
    }).join('\n\n---\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sports-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const themeClasses = darkMode 
    ? "bg-gray-900 text-white" 
    : "bg-gradient-to-br from-blue-50 to-teal-50 text-gray-900";

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-all duration-300 ${themeClasses}`}>
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex flex-1 relative overflow-hidden">
        
        <aside
          className={`fixed lg:static top-0 left-0 h-full w-full sm:w-80 lg:w-72 xl:w-80 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border-r flex flex-col transform transition-all duration-300 z-50 shadow-lg
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          
          
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <MessageSquare size={20} className="text-teal-600" />
              <h1 className={`text-lg lg:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Sports Assistant
              </h1>
            </div>
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          
          
          
          <nav className="flex-1 px-4 pb-4 mt-30">
            <h2 className={`text-xs sm:text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              QUICK QUESTIONS
            </h2>
            <div className="space-y-2">
              {prompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sendMessage(prompt);
                    setSidebarOpen(false);
                  }}
                  disabled={isLoading}
                  className={`text-left p-3 rounded-xl transition-all duration-200 w-full text-xs sm:text-sm hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-teal-700'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </nav>

          
          <div className={`mx-4 mb-4 p-3 sm:p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Settings size={14} />
              <span className="text-xs sm:text-sm font-medium">Settings</span>
            </div>
            
            <div className="space-y-3">
              
              <div className="flex items-center justify-between">
                <span className="text-xs">Dark Mode</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-yellow-600' : 'bg-gray-600'}`}
                >
                  {darkMode ? <Sun size={12} /> : <Moon size={12} />}
                </button>
              </div>

             
              <div className="flex items-center justify-between">
                <span className="text-xs">Sound</span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg transition-colors ${soundEnabled ? 'bg-teal-600' : 'bg-gray-600'}`}
                >
                  {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                </button>
              </div>

              
              <div className="flex items-center justify-between">
                <span className="text-xs">Streaming</span>
                <button
                  onClick={() => setUseStreaming(!useStreaming)}
                  className={`p-1.5 rounded-lg transition-colors ${useStreaming ? 'bg-green-600' : 'bg-gray-600'}`}
                >
                  <MessageSquare size={12} />
                </button>
              </div>

              
              <div className="flex items-center justify-between">
                <span className="text-xs">Font Size</span>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className={`text-xs p-1 rounded transition-colors ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'}`}
                >
                  <option value="text-xs">Small</option>
                  <option value="text-sm">Medium</option>
                  <option value="text-base">Large</option>
                </select>
              </div>
            </div>
          </div>

       
          <div className="p-4 space-y-2">
            <button
              onClick={exportChat}
              className={`w-full p-2.5 rounded-xl transition-colors flex items-center gap-2 justify-center text-sm ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Download size={14} />
              Export Chat
            </button>
            <button
              onClick={() => {
                clearChat();
                setSidebarOpen(false);
              }}
              className={`w-full p-2.5 rounded-xl transition-colors flex items-center gap-2 justify-center text-sm ${
                darkMode 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <Trash2 size={14} />
              Clear Chat
            </button>
          </div>
        </aside>

        
        <div className={`flex flex-col flex-1 min-w-0 ${themeClasses}`}>
          
          <header className={`flex-shrink-0 ${
            darkMode 
              ? 'bg-gradient-to-r from-teal-800 to-blue-800' 
              : 'bg-gradient-to-r from-teal-600 to-blue-600'
          } text-white shadow-lg`}>
            <div className="flex items-center justify-between p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu size={18} />
                </button>
                <div className="flex items-center gap-2 xl:ml-150 sm:ml-30 h-25">
                  <MessageSquare size={20} className="hidden sm:block" />
                  <div>
                    <h1 className="text-lg sm:text-2xl lg:text-3xl  font-bold">Sports Assistant</h1>
            
                  </div>
                </div>
              </div>
            </div>
          </header>

          
          <div className={`flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 ${themeClasses}`}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 sm:gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                
                <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  msg.role === "user" 
                    ? (darkMode ? 'bg-teal-600' : 'bg-teal-500')
                    : (darkMode ? 'bg-gray-600' : 'bg-gray-300')
                }`}>
                  {msg.role === "bot" ? <Bot size={14} /> : <User size={14} />}
                </div>

              
                <div className={`group relative max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}>
                  <div className={`p-3 sm:p-4 rounded-2xl ${fontSize} leading-relaxed ${
                    msg.role === "user"
                      ? (darkMode 
                          ? "bg-teal-600 text-white" 
                          : "bg-teal-500 text-white")
                      : (darkMode 
                          ? "bg-gray-700 text-gray-100" 
                          : "bg-white text-gray-800 shadow-sm border border-gray-200")
                  }`}>
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>

                    

                  
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex items-center gap-2 text-xs ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}>
                      <button
                        onClick={() => copyMessage(msg.content)}
                        className="p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
                        title="Copy message"
                      >
                        <Copy size={10} />
                      </button>
                      <span className="opacity-60">{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            
            {isLoading && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}>
                  <Bot size={14} />
                </div>
                <div className={`p-3 sm:p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm border border-gray-200'}`}>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs text-gray-500">Searching sports database...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

        
          <div className={`flex-shrink-0 border-t p-3 sm:p-4 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-end gap-2 sm:gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  className={`w-full border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 resize-none min-h-[44px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm sm:text-base ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  } ${isLoading ? 'opacity-75' : ''}`}
                  placeholder="Ask anything about sports..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    adjustTextareaHeight();
                  }}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  rows={1}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className={`p-2.5 sm:p-3 rounded-2xl transition-all duration-200 ${
                  !input.trim() || isLoading
                    ? (darkMode ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')
                    : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 shadow-lg'
                } text-white`}
                title={isLoading ? "Processing..." : "Send message"}
              >
                {isLoading ? (
                  <div className="w-4 h-4 sm:w-[18px] sm:h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                )}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
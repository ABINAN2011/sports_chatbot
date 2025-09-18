"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Send, Bot, User, Menu, X, Trash2, MessageSquare, Settings, Moon, Sun, Volume2, VolumeX, Copy, Download } from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
  timestamp: string;
  sources?: string[];
}

export default function EnhancedChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "bot", 
      content: "Hello! How can i help you with sports today?", 
      timestamp: new Date().toLocaleTimeString()
    },
  ]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("online");
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
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

  const sendMessage = async (text?: string) => {
    const queryText = text || input;
    if (!queryText.trim() || isLoading) return;

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
      const res = await axios.post("http://127.0.0.1:8000/chat", {
        query: queryText,
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const botMessage: Message = {
        role: "bot",
        content: res.data.answer,
        sources: res.data.sources?.filter((source: string) => source) || [],
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setConnectionStatus("online");
      playNotificationSound();
      
    } catch (error) {
      console.error("API Error:", error);
      
      let errorMessage = "❌ Unable to connect to the sports knowledge base. ";
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage += "The request timed out. Please try again.";
          setConnectionStatus("offline");
        } else if (error.response?.status === 500) {
          errorMessage += "Server error occurred. Please try again in a moment.";
          setConnectionStatus("offline");
        } else if (error.response?.status === 404) {
          errorMessage += "Service endpoint not found. Please check if the backend server is running on http://127.0.0.1:8000";
          setConnectionStatus("offline");
        } else if (!error.response) {
          errorMessage += "Cannot reach the server. Please ensure:\n\n1. Backend server is running (uvicorn main:app --reload)\n2. Server is accessible at http://127.0.0.1:8000\n3. CORS is properly configured";
          setConnectionStatus("offline");
        } else {
          errorMessage += `Server responded with error code: ${error.response.status}`;
          setConnectionStatus("offline");
        }
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
      content: "Chat cleared! 🧹 Ready to answer your sports questions. What would you like to know?",
      timestamp: new Date().toLocaleTimeString()
    }]);
    playNotificationSound();
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
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
    a.click();
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
    <div className={`flex flex-col h-screen w-screen transition-all duration-300 ${themeClasses}`}>
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex flex-1 relative">
        
        <aside
          className={`fixed md:static top-0 left-0 h-full md:h-auto w-80 md:w-72 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border-r p-4 flex flex-col transform transition-all duration-300 z-50 shadow-lg
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className={`text-lg font-bold ml-10 mt-7 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Sports Assistant
            </h1>
            <button
              className="md:hidden p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

       

          {/* Quick Questions */}
          <nav className="flex flex-col gap-3 flex-1  mt-40">
            <h2 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              QUICK QUESTIONS
            </h2>
            <div className="space-y-2 max-h-64 ">
              {prompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sendMessage(prompt.replace(/^[^a-zA-Z]*/, ''));
                    setSidebarOpen(false);
                  }}
                  disabled={isLoading}
                  className={`text-left p-3 rounded-xl transition-all duration-200 w-full text-sm hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
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

          {/* Settings Panel */}
          <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Settings size={16} />
              <span className="text-sm font-medium">Settings</span>
            </div>
            
            {/* Theme Toggle */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs">Dark Mode</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-1 rounded-lg transition-colors ${darkMode ? 'bg-yellow-600' : 'bg-gray-600'}`}
              >
                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs">Notifications</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1 rounded-lg transition-colors ${soundEnabled ? 'bg-teal-600' : 'bg-gray-600'}`}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between">
              <span className="text-xs">Font Size</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className={`text-xs p-1 rounded transition-colors ${darkMode ? 'bg-gray-600' : 'bg-white'}`}
              >
                <option value="text-xs">Small</option>
                <option value="text-sm">Medium</option>
                <option value="text-base">Large</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            <button
              onClick={exportChat}
              className={`w-full p-2 rounded-xl transition-colors flex items-center gap-2 justify-center ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Download size={16} />
              Export Chat
            </button>
            <button
              onClick={() => {
                clearChat();
                setSidebarOpen(false);
              }}
              className={`w-full p-2 rounded-xl transition-colors flex items-center gap-2 justify-center ${
                darkMode 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <Trash2 size={16} />
              Clear Chat
            </button>
          </div>
        </aside>

        {/* Main Chat Area */}
        <div className="flex flex-col  flex-1 min-w-0">
          {/* Enhanced Header */}
          <header className={`${
            darkMode 
              ? 'bg-gradient-to-r from-teal-800 to-blue-800' 
              : 'bg-gradient-to-r from-teal-600 to-blue-600'
          } text-white p-4 shadow-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu size={20} />
                </button>
                <div className="flex items-center gap-2 h-20 ml-150">
                  <MessageSquare size={24} className="hidden sm:block" />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Sports Assistant</h1>
            
                  </div>
                </div>
              </div>
              
            
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === "user" 
                    ? (darkMode ? 'bg-teal-600' : 'bg-teal-500')
                    : (darkMode ? 'bg-gray-600' : 'bg-gray-300')
                }`}>
                  {msg.role === "bot" ? <Bot size={16} /> : <User size={16} />}
                </div>

              
                <div className={`group relative max-w-[85%] sm:max-w-[70%] ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}>
                  <div className={`p-3 sm:p-4 rounded-2xl ${fontSize} ${
                    msg.role === "user"
                      ? (darkMode 
                          ? "bg-teal-600 text-white" 
                          : "bg-teal-500 text-white")
                      : (darkMode 
                          ? "bg-gray-700 text-gray-100" 
                          : "bg-white text-gray-800 shadow-sm border")
                  }`}>
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>

                    
              
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex items-center gap-2 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}>
                      <button
                        onClick={() => copyMessage(msg.content)}
                        className="p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
                        title="Copy message"
                      >
                        <Copy size={12} />
                      </button>
                      <span className="text-xs opacity-60">{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

     
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}>
                  <Bot size={16} />
                </div>
                <div className={`p-3 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm border'}`}>
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

        
          <div className={`border-t p-4 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  className={`w-full border rounded-2xl px-4 py-3 resize-none min-h-[44px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
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
                className={`p-3 rounded-2xl transition-all duration-200 mb-3 ${
                  !input.trim() || isLoading
                    ? (darkMode ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')
                    : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 shadow-lg'
                } text-white`}
                title={isLoading ? "Processing..." : "Send message"}
              >
                {isLoading ? (
                  <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
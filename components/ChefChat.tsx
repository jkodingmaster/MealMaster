
import React, { useState, useRef, useEffect } from 'react';
import { ChefHat, X, Send, MessageCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import { getChefResponse } from '../services/geminiService';

const ChefChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Right, I'm here. Don't ask me anything stupid. What are you cooking?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await getChefResponse(messages, input);
      
      const chefMsg: ChatMessage = { role: 'model', text: responseText };
      setMessages(prev => [...prev, chefMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Service is down, you donut! Check your internet." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center border-2 border-slate-900 ${
          isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-black text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : <div className="relative"><ChefHat size={24} /><span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black"></span></div>}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-40 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        style={{ maxHeight: '600px', height: '65vh' }}
      >
        {/* Header */}
        <div className="bg-slate-900 p-4 flex items-center gap-3 text-white">
          <div className="bg-white/10 p-2 rounded-full">
            <ChefHat size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Gorden Ram-C</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Live Assistance</p>
          </div>
        </div>

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
          ref={scrollRef}
        >
          {messages.map((msg, idx) => {
            const isChef = msg.role === 'model';
            return (
              <div key={idx} className={`flex ${isChef ? 'justify-start' : 'justify-end'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                    isChef 
                      ? 'bg-white text-slate-800 rounded-tl-none border border-slate-200' 
                      : 'bg-slate-800 text-white rounded-tr-none'
                  }`}
                >
                  {isChef && <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Gorden Ram-C</div>}
                  {msg.text}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for tips..."
            className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all outline-none"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
};

export default ChefChat;

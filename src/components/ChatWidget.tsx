/**
 * HEART AI Chat Widget — Floating chat bubble
 * Connects to /api/chat for real-time Gemini conversation
 */

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/api';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: 'Hello! I\'m HEART AI Assistant. I can help you understand patient vitals, care decisions, or answer questions about elderly care. How can I help?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const response = await sendChatMessage(input.trim());

    const aiMsg: Message = {
      id: Date.now() + 1,
      role: 'assistant',
      content: response.success && response.reply
        ? response.reply
        : '⚠️ Failed to get response. Make sure the backend server is running (`npm run server:dev`).',
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #e74c5a, #d4404f)' }}
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[560px] flex flex-col rounded-2xl overflow-hidden"
          style={{ background: 'var(--heart-surface)', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', border: '1px solid var(--heart-border-light)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: 'linear-gradient(135deg, #e74c5a, #d4404f)' }}>
            <div className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5" />
              <div>
                <div className="text-sm font-bold">HEART AI</div>
                <div className="text-[10px] opacity-80">Powered by Gemini 2.0 Flash</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/20 text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: '380px', minHeight: '200px' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="flex-none w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px]"
                  style={{ background: msg.role === 'user' ? '#3b82f6' : '#e74c5a' }}>
                  {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                }`}
                  style={{
                    background: msg.role === 'user' ? '#3b82f6' : 'var(--heart-bg)',
                    color: msg.role === 'user' ? 'white' : 'var(--heart-text)',
                  }}>
                  {msg.content}
                  <div className="text-[9px] mt-1 opacity-50">{msg.timestamp}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: '#e74c5a' }}>
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="px-3 py-2 rounded-xl rounded-tl-sm" style={{ background: 'var(--heart-bg)' }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#e74c5a' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-3" style={{ borderTop: '1px solid var(--heart-border-light)' }}>
            <input
              type="text"
              placeholder="Ask HEART AI..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
              style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}
              className="p-2 rounded-xl transition-all hover:scale-105"
              style={{
                background: input.trim() ? 'linear-gradient(135deg, #e74c5a, #d4404f)' : '#e5e7eb',
                color: input.trim() ? 'white' : '#9ca3af',
              }}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

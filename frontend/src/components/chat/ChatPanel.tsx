'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  sessionId?: string;
  contextType?: string;
  contextId?: string;
  onActionReceived?: (action: any) => void;
}

export default function ChatPanel({
  sessionId,
  contextType = 'general',
  contextId,
  onActionReceived,
}: ChatPanelProps) {
  const {
    messages,
    isLoading,
    error,
    pendingActions,
    sendMessage,
    continueLearningSession,
    clearPendingActions,
    clearError,
  } = useChatStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle pending AI actions
  useEffect(() => {
    if (pendingActions.length > 0 && onActionReceived) {
      pendingActions.forEach((action) => onActionReceived(action));
      clearPendingActions();
    }
  }, [pendingActions, onActionReceived, clearPendingActions]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');

    try {
      if (sessionId) {
        await continueLearningSession(sessionId, message);
      } else {
        await sendMessage(message, contextType, contextId);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-gray-800">AI Teacher</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">Ask questions or get hints</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: '300px', maxHeight: '500px' }}>
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="mb-4 text-4xl">👋</div>
            <p className="text-sm">Start a conversation!</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-primary-100' : 'text-gray-500'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={clearError} className="text-xs text-red-600 hover:text-red-800 mt-1 underline">
              Dismiss
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your AI teacher..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

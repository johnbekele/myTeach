'use client';

import { useState } from 'react';

export default function RightPanel() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI DevOps mentor. I'm here to help you learn step-by-step. What would you like to work on today?",
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');

    // TODO: Send to AI backend
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I understand. Let me help you with that...",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="flex w-1/2 flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="border-b bg-white px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">AI Mentor</h2>
        <p className="text-sm text-gray-500">Your personal DevOps instructor</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-800 shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <button
            onClick={handleSend}
            className="rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-700 transition-colors"
          >
            Send
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-700 hover:bg-gray-200">
            💡 Hint
          </button>
          <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-700 hover:bg-gray-200">
            📝 Simplify
          </button>
          <button className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-700 hover:bg-gray-200">
            ❓ Explain Why
          </button>
        </div>
      </div>
    </div>
  );
}

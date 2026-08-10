import React, { useEffect, useRef, useState } from 'react';
import { IconSend } from '../components/icons';

const parseMarkdown = (text) => {
  if (!text) return null;

  const blocks = text.split('\n\n');

  return blocks.map((block, blockIndex) => {
    if (block.trim().startsWith('* ') || block.trim().startsWith('- ')) {
      const items = block.split('\n').filter(item => item.trim() !== '');
      return (
        <ul key={blockIndex} className="list-disc pl-5 mb-4 space-y-1">
          {items.map((item, i) => {
            const content = item.replace(/^[\*\-]\s+/, '');
            return <li key={i}>{formatInlineMarkdown(content)}</li>;
          })}
        </ul>
      );
    }

    return (
      <p key={blockIndex} className="mb-4 last:mb-0">
        {formatInlineMarkdown(block)}
      </p>
    );
  });
};

const formatInlineMarkdown = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-indigo-900 dark:text-indigo-200">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export default function AdvisorView({
  theme,
  isDark,
  aiConfig,
  balance,
  income,
  totalExpenses,
  bills,
  budgets,
}) {
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: "Hello! I'm WealthMate AI. I have access to your budgets, bills, and recent transactions. How can I help you manage your money today?" }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userMessage = { role: 'user', text: inputMsg };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setInputMsg('');
    setIsLoading(true);

    const financialContext = `
      System Context - User Financial Data (Do not mention you are reading this unless asked):
      Balance: ${balance}. Monthly Income: ${income}. Total Expenses this month: ${totalExpenses}.
      Upcoming Unpaid Bills: ${JSON.stringify(bills.filter(b => !b.isPaid))}.
      Budgets: ${JSON.stringify(budgets)}.
    `;

    const systemInstruction =
      'Act as a helpful financial advisor. Provide structured, actionable, friendly answers based on my data. Use markdown formatting (like bolding with **text** and bulleted lists with *) to make your responses easy to read.';

    const messages = [
      { role: 'system', content: `${financialContext}\n\n${systemInstruction}` },
      ...newHistory.map((msg) => ({ role: msg.role, content: msg.text })),
    ];

    try {
      const payload = {
        model: aiConfig.chatModel,
        messages,
        temperature: 0.7,
      };
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || `DeepSeek error ${response.status}`);
      }

      const result = await response.json();
      const text = result.choices?.[0]?.message?.content;

      if (text) {
        setChatHistory([...newHistory, { role: 'assistant', text }]);
      }
    } catch (err) {
      setChatHistory([
        ...newHistory,
        { role: 'assistant', text: `Sorry, I had trouble connecting to DeepSeek. ${err.message || 'Please try again.'}` },
      ]);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 h-full flex flex-col">
      <header>
        <h2 className={`text-2xl font-bold ${theme.text}`}>WealthMate Assistant</h2>
        <p className={`${theme.textMuted} text-sm`}>Chat with your personalized AI financial advisor.</p>
      </header>

      <div className={`flex-1 ${theme.card} rounded-2xl border shadow-sm flex flex-col overflow-hidden min-h-[320px] md:min-h-[400px] max-h-[70vh] md:max-h-[600px]`}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : `${isDark ? 'bg-slate-700' : 'bg-gray-100'} ${theme.text} rounded-bl-none`}`}>
                {msg.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                ) : (
                  <div className="text-sm leading-relaxed">
                    {parseMarkdown(msg.text)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-gray-100'} rounded-bl-none flex gap-1`}>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} className={`p-3 border-t ${theme.border} ${isDark ? 'bg-slate-800' : 'bg-white'} flex items-end gap-2`}>
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Ask about your budget, spending trends..."
            className={`flex-1 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${theme.input}`}
          />
          <button type="submit" disabled={isLoading || !inputMsg.trim()} className="shrink-0 bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            <IconSend />
          </button>
        </form>
      </div>
    </div>
  );
}

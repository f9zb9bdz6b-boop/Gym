import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { AIConversationMessage, FoodLog } from '@/db/types';
import { runLocalDeterministicAI } from '@/lib/ai/localEngine';
import { nutritionRepo } from '@/db/repositories/nutritionRepo';
import { generateId } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, Send, Check, ShieldCheck } from 'lucide-react';

const QUICK_PROMPTS = [
  'What workout do I have today?',
  'How much protein do I still need?',
  'Log my breakfast: 2 eggs and 2 roti',
  'Analyze my last 7 days',
  'Suggest a 2,500-calorie Indian diet',
];

export function AIAssistantView() {
  const { addToast, setSubView } = useAppStore();
  const settings = useLiveQuery(() => db.appSettings.get('settings'), []);
  const [messages, setMessages] = useState<AIConversationMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! I am your GYM APP AI Assistant running locally on your device. Ask me about your workouts, macros, 7-day progress, or say "Log my breakfast: 2 eggs and 2 roti".',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setInput('');

    const userMsg: AIConversationMessage = {
      id: generateId(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await runLocalDeterministicAI(query);
      const assistantMsg: AIConversationMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        proposedFoodLogs: response.proposedFoodLogs,
        confirmed: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmFoodLogs = async (msgId: string, logs: Omit<FoodLog, 'id' | 'createdAt'>[]) => {
    for (const log of logs) {
      await nutritionRepo.addFoodLog(log);
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, confirmed: true } : m))
    );
    addToast({ title: 'Meals saved to Food Tracker', description: `${logs.length} item(s) logged.` });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-lime-400" />
          <h1 className="text-2xl font-bold text-white">AI Fitness Assistant</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="lime">
            <ShieldCheck className="h-3 w-3" />
            {settings?.aiProvider === 'local_deterministic' || !settings?.aiConsentGranted
              ? 'Local Offline Engine'
              : settings.aiProvider}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => setSubView('settings')}>
            Configure AI
          </Button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 hover:border-lime-400/40 hover:text-lime-300 transition-colors cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs whitespace-pre-line leading-relaxed ${
                m.role === 'user'
                  ? 'bg-lime-400 text-zinc-950 font-medium'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
              }`}
            >
              {m.content}

              {m.proposedFoodLogs && m.proposedFoodLogs.length > 0 && (
                <div className="mt-3 space-y-2 rounded-xl bg-zinc-950/80 p-3 border border-zinc-800">
                  {m.proposedFoodLogs.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-zinc-300">
                      <span>{item.foodName} ({item.servingLabel})</span>
                      <span className="text-lime-400 font-semibold">{item.calories} kcal · {item.proteinG}g P</span>
                    </div>
                  ))}
                  {!m.confirmed ? (
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleConfirmFoodLogs(m.id, m.proposedFoodLogs!)}
                    >
                      <Check className="h-3.5 w-3.5" /> Confirm &amp; Save to Database
                    </Button>
                  ) : (
                    <p className="text-[11px] text-lime-400 font-semibold pt-1">✓ Saved to Food Tracker</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-zinc-500 animate-pulse">Analyzing local fitness records...</div>
        )}
      </Card>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 shrink-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about workouts, macros, or log a meal..."
          className="flex-1 h-11 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50"
        />
        <Button type="submit" size="lg" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

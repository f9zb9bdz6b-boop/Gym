import { useState } from 'react';
import { askFitnessAI } from '@/lib/ai/aiService';
import { nutritionRepo } from '@/db/repositories/nutritionRepo';
import type { FoodLog } from '@/db/types';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, X, Send, Check } from 'lucide-react';

export function AIQuickModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { activeTab, subView, addToast } = useAppStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [providerLabel, setProviderLabel] = useState<string>('');
  const [proposedLogs, setProposedLogs] = useState<Omit<FoodLog, 'id' | 'createdAt'>[] | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!open) return null;

  const contextLabel = subView ? `Module: ${subView}` : `Tab: ${activeTab}`;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setConfirmed(false);
    setProposedLogs(null);
    try {
      const res = await askFitnessAI(input.trim(), contextLabel);
      setReply(res.fallbackNotice ? `${res.fallbackNotice}\n\n${res.content}` : res.content);
      setProviderLabel(res.modelUsed ?? res.providerUsed);
      if (res.proposedFoodLogs) {
        setProposedLogs(res.proposedFoodLogs);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLogs = async () => {
    if (!proposedLogs) return;
    for (const item of proposedLogs) {
      await nutritionRepo.addFoodLog(item);
    }
    setConfirmed(true);
    addToast({ title: 'Meals saved', description: `${proposedLogs.length} item(s) added to Food Tracker.` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-lime-400" />
            <h3 className="text-sm font-bold text-white">Quick AI Assistant</h3>
            <Badge>{contextLabel}</Badge>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer" aria-label="Close AI modal">
            <X className="h-4 w-4" />
          </button>
        </div>

        {reply && (
          <div className="max-h-64 overflow-y-auto rounded-xl bg-zinc-900/90 border border-zinc-800 p-3.5 text-xs text-zinc-200 whitespace-pre-line space-y-3">
            {providerLabel && <Badge variant="lime">{providerLabel}</Badge>}
            <p className="leading-relaxed">{reply}</p>
            {proposedLogs && (
              <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800 space-y-2">
                {proposedLogs.map((l, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span>{l.foodName} ({l.servingLabel})</span>
                    <span className="text-lime-400 font-semibold">{l.calories} kcal · {l.proteinG}g P</span>
                  </div>
                ))}
                {!confirmed ? (
                  <Button size="sm" className="w-full" onClick={handleConfirmLogs}>
                    <Check className="h-3.5 w-3.5" /> Confirm &amp; Save
                  </Button>
                ) : (
                  <p className="text-[11px] text-lime-400 font-semibold">✓ Saved to Food Tracker</p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything or log food..."
            className="flex-1 h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50"
          />
          <Button type="submit" size="md" disabled={loading || !input.trim()}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { askFitnessAI } from '@/lib/ai/aiService';
import { Card, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AIInlinePanelProps {
  title: string;
  prompt: string;
  contextHint: string;
  buttonLabel?: string;
}

export function AIInlinePanel({
  title,
  prompt,
  contextHint,
  buttonLabel = 'Generate AI Insight',
}: AIInlinePanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; provider: string; model?: string; notice?: string } | null>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await askFitnessAI(prompt, contextHint);
      setResult({
        text: res.content,
        provider: res.providerUsed,
        model: res.modelUsed,
        notice: res.fallbackNotice,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-lime-400/20 bg-gradient-to-br from-[#121215] to-[#141812]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-lime-400" />
          <CardTitle>{title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <Badge variant="lime">{result.model ?? result.provider}</Badge>
          )}
          <Button size="sm" variant="secondary" onClick={handleRun} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Thinking...' : result ? 'Refresh' : buttonLabel}
          </Button>
        </div>
      </CardHeader>

      {result ? (
        <div className="space-y-2 text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
          {result.notice && (
            <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
              {result.notice}
            </p>
          )}
          <p>{result.text}</p>
        </div>
      ) : (
        <p className="text-xs text-zinc-400">
          Click <strong>{buttonLabel}</strong> to get personalized guidance based on your local data.
        </p>
      )}
    </Card>
  );
}

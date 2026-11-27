import { useAppStore } from '@/stores/useAppStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, dismissToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 md:bottom-6 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/95 p-3.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
        >
          {t.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          ) : t.type === 'info' ? (
            <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-lime-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-100">{t.title}</p>
            {t.description && <p className="text-[11px] text-zinc-400 mt-0.5">{t.description}</p>}
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-zinc-500 hover:text-zinc-200 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

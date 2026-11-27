import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { backupRepo } from '@/db/repositories/backupRepo';
import { ensureDatabaseSeeded } from '@/db/seed';
import type { GeminiModelOption } from '@/db/types';
import { callGeminiAPI, DEFAULT_GEMINI_MODELS, fetchAvailableGeminiModels } from '@/lib/ai/geminiClient';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Download, Upload, Trash2, AlertTriangle, Shield, RefreshCw, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export function BackupSettingsView() {
  const { addToast } = useAppStore();
  const settings = useLiveQuery(() => db.appSettings.get('settings'), []);

  const [aiProvider, setAiProvider] = useState<'local_deterministic' | 'gemini' | 'ollama' | 'openai_compatible'>(
    'local_deterministic'
  );
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<GeminiModelOption[]>(DEFAULT_GEMINI_MODELS);
  const [aiModel, setAiModel] = useState('gemini-3.8-flash');
  const [aiEndpoint, setAiEndpoint] = useState('');
  const [aiConsent, setAiConsent] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testingConn, setTestingConn] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setAiProvider(settings.aiProvider);
    setGeminiApiKey(settings.geminiApiKey ?? '');
    if (settings.availableGeminiModels && settings.availableGeminiModels.length > 0) {
      const valid = settings.availableGeminiModels.filter((m) =>
        DEFAULT_GEMINI_MODELS.some((d) => d.id === m.id)
      );
      setAvailableModels(valid.length > 0 ? valid : DEFAULT_GEMINI_MODELS);
    }
    setAiModel(
      settings.aiModel && DEFAULT_GEMINI_MODELS.some((d) => d.id === settings.aiModel)
        ? settings.aiModel
        : 'gemini-3.8-flash'
    );
    setAiEndpoint(settings.aiEndpoint ?? '');
    setAiConsent(settings.aiConsentGranted);
  }, [settings]);

  const handleExport = async () => {
    const payload = await backupRepo.exportAllData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-app-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ title: 'Backup exported', description: 'JSON file downloaded to your device.' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validation = backupRepo.validateBackup(parsed);
      if (!validation.valid) {
        addToast({ title: 'Import failed', description: validation.error, type: 'error' });
        return;
      }
      if (!window.confirm('This will replace your current local data with the backup. Continue?')) {
        return;
      }
      const res = await backupRepo.importBackup(validation.data, 'replace');
      addToast({ title: 'Backup restored', description: `${res.restoredRecords} records restored.` });
    } catch {
      addToast({ title: 'Invalid JSON file', type: 'error' });
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to delete ALL local data? This cannot be undone.')) return;
    await backupRepo.clearAllUserData();
    await ensureDatabaseSeeded();
    addToast({ title: 'Local data cleared', description: 'Default templates restored.' });
  };

  const handleFetchModels = async () => {
    if (!geminiApiKey.trim()) {
      addToast({ title: 'Enter your Gemini API token first', type: 'error' });
      return;
    }
    setFetchingModels(true);
    try {
      const models = await fetchAvailableGeminiModels(geminiApiKey);
      setAvailableModels(models);
      if (!models.some((m) => m.id === aiModel)) {
        setAiModel(models[0].id);
      }
      addToast({ title: 'Models loaded', description: `Found ${models.length} available Gemini models.` });
    } catch (err) {
      addToast({
        title: 'Could not fetch models',
        description: err instanceof Error ? err.message : 'Check your API token.',
        type: 'error',
      });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTestGemini = async () => {
    if (!geminiApiKey.trim()) {
      addToast({ title: 'Enter your Gemini API token first', type: 'error' });
      return;
    }
    setTestingConn(true);
    try {
      const reply = await callGeminiAPI({
        apiKey: geminiApiKey,
        model: aiModel,
        systemPrompt: 'Reply in 5 words or less.',
        userPrompt: 'Confirm connection OK.',
      });
      addToast({ title: 'Gemini Connected!', description: `${aiModel}: ${reply}` });
    } catch (err) {
      addToast({
        title: 'Connection failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setTestingConn(false);
    }
  };

  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.appSettings.put({
      id: 'settings',
      weightUnit: settings?.weightUnit ?? 'kg',
      aiProvider,
      geminiApiKey: geminiApiKey.trim() || undefined,
      availableGeminiModels: availableModels,
      aiModel: aiModel || 'gemini-3.8-flash',
      aiEndpoint: aiEndpoint.trim() || undefined,
      aiConsentGranted: aiConsent,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    });
    addToast({ title: 'AI settings saved locally' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Backup &amp; Settings</h1>
        <p className="text-xs text-zinc-400">Manage local IndexedDB data, JSON backups, and AI provider configuration.</p>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 text-xs text-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong>Local-Only Storage:</strong> All data and API tokens are stored exclusively in your browser&apos;s
          IndexedDB on this device. Export a JSON backup regularly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Backup &amp; Restore</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <Button onClick={handleExport} className="w-full">
              <Download className="h-4 w-4" /> Export All Data (JSON)
            </Button>
            <label className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-200 hover:bg-zinc-800 cursor-pointer">
              <Upload className="h-4 w-4" /> Import JSON Backup
              <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
            </label>
            <Button variant="danger" onClick={handleReset} className="w-full">
              <Trash2 className="h-4 w-4" /> Clear All Local Data
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-lime-400" />
              <CardTitle>AI Provider &amp; Model Settings</CardTitle>
            </div>
            <Badge variant={aiProvider === 'gemini' && aiConsent && geminiApiKey ? 'lime' : 'default'}>
              {aiProvider === 'gemini' ? aiModel : 'Offline Engine'}
            </Badge>
          </CardHeader>
          <form onSubmit={handleSaveAISettings} className="space-y-3.5">
            <Select
              label="AI Engine"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as typeof aiProvider)}
            >
              <option value="local_deterministic">Local Deterministic (100% Offline)</option>
              <option value="gemini">Google Gemini (Custom API Token)</option>
              <option value="ollama">Local Ollama Endpoint</option>
              <option value="openai_compatible">Custom OpenAI-Compatible Endpoint</option>
            </Select>

            {aiProvider === 'gemini' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-400">Custom Gemini API Token</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKey ? 'text' : 'password'}
                        placeholder="AIzaSy..."
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900/80 pl-3.5 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                        aria-label={showKey ? 'Hide API key' : 'Show API key'}
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFetchModels}
                      disabled={fetchingModels}
                      title="Fetch available models for this API key"
                    >
                      <RefreshCw className={`h-4 w-4 ${fetchingModels ? 'animate-spin' : ''}`} />
                      Fetch Models
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <Select
                    label="Available Gemini Models"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                  >
                    {availableModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} ({m.id})
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleTestGemini}
                    disabled={testingConn}
                    className="shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4 text-lime-400" />
                    {testingConn ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </>
            )}

            {(aiProvider === 'ollama' || aiProvider === 'openai_compatible') && (
              <Input
                label="Endpoint URL"
                placeholder="http://localhost:11434/api/chat"
                value={aiEndpoint}
                onChange={(e) => setAiEndpoint(e.target.value)}
              />
            )}

            <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(e) => setAiConsent(e.target.checked)}
                className="mt-0.5 accent-lime-400"
              />
              <span>
                I explicitly consent to sending my local fitness context to the configured AI provider when I use AI features.
              </span>
            </label>

            <Button type="submit" size="md" className="w-full">
              Save AI Settings
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

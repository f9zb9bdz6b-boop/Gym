import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { backupRepo } from '@/db/repositories/backupRepo';
import { ensureDatabaseSeeded } from '@/db/seed';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Download, Upload, Trash2, AlertTriangle, Shield } from 'lucide-react';

export function BackupSettingsView() {
  const { addToast } = useAppStore();
  const settings = useLiveQuery(() => db.appSettings.get('settings'), []);
  const [aiProvider, setAiProvider] = useState<'local_deterministic' | 'ollama' | 'openai_compatible'>(
    settings?.aiProvider ?? 'local_deterministic'
  );
  const [aiEndpoint, setAiEndpoint] = useState(settings?.aiEndpoint ?? '');
  const [aiConsent, setAiConsent] = useState(settings?.aiConsentGranted ?? false);

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

  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.appSettings.put({
      id: 'settings',
      weightUnit: settings?.weightUnit ?? 'kg',
      aiProvider,
      aiEndpoint: aiEndpoint || undefined,
      aiConsentGranted: aiConsent,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    });
    addToast({ title: 'AI settings saved' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Backup &amp; Settings</h1>
        <p className="text-xs text-zinc-400">Manage local IndexedDB data, JSON backups, and AI provider privacy.</p>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 text-xs text-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong>Local-Only Storage:</strong> All data is stored in your browser&apos;s IndexedDB. It will not
          automatically appear on another device. Export a JSON backup regularly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <CardTitle>AI Provider &amp; Privacy</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={handleSaveAISettings} className="space-y-3">
            <Select
              label="AI Engine"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as typeof aiProvider)}
            >
              <option value="local_deterministic">Local Deterministic (100% Offline)</option>
              <option value="ollama">Local Ollama Endpoint</option>
              <option value="openai_compatible">Custom OpenAI-Compatible Endpoint</option>
            </Select>
            {aiProvider !== 'local_deterministic' && (
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
                I explicitly consent to sending my fitness context to the configured external/local AI endpoint when I send a message.
              </span>
            </label>
            <Button type="submit" size="sm" className="w-full">Save AI Settings</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { wellnessRepo } from '@/db/repositories/wellnessRepo';
import { todayISO } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HeartPulse, Moon, Droplets } from 'lucide-react';

export function RecoveryView() {
  const { addToast } = useAppStore();
  const today = todayISO();

  const recovery = useLiveQuery(() => db.recoveryLogs.where('date').equals(today).first(), [today]);
  const sleep = useLiveQuery(() => db.sleepLogs.where('date').equals(today).first(), [today]);

  const [sleepHours, setSleepHours] = useState(sleep?.durationHours ?? 7.5);
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(sleep?.quality ?? 4);
  const [soreness, setSoreness] = useState<1 | 2 | 3 | 4 | 5>(recovery?.soreness ?? 2);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(recovery?.energy ?? 4);
  const [fatigue, setFatigue] = useState<1 | 2 | 3 | 4 | 5>(recovery?.fatigue ?? 2);
  const [moodNote, setMoodNote] = useState(recovery?.moodNote ?? '');

  const handleSaveSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    await wellnessRepo.saveSleep({ date: today, durationHours: Number(sleepHours), quality: sleepQuality });
    addToast({ title: 'Sleep logged' });
  };

  const handleSaveRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    await wellnessRepo.saveRecovery({
      date: today,
      waterMl: recovery?.waterMl ?? 0,
      soreness,
      energy,
      fatigue,
      isRecoveryDay: recovery?.isRecoveryDay ?? false,
      moodNote,
    });
    addToast({ title: 'Recovery check-in saved' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Recovery &amp; Wellness</h1>
        <p className="text-xs text-zinc-400">Track sleep, hydration, soreness, and readiness. Not a medical diagnostic tool.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-sky-400" />
              <CardTitle>Sleep &amp; Hydration</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={handleSaveSleep} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Sleep Duration (hrs)" type="number" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} />
              <Input label="Quality (1-5)" type="number" min={1} max={5} value={sleepQuality} onChange={(e) => setSleepQuality(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)} />
            </div>
            <Button type="submit" size="sm">Save Sleep</Button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-sky-400" />
              <span className="text-sm font-semibold text-white">{recovery?.waterMl ?? 0} ml</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => wellnessRepo.addWaterMl(today, 250)}>+250ml</Button>
              <Button size="sm" variant="outline" onClick={() => wellnessRepo.addWaterMl(today, 500)}>+500ml</Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-lime-400" />
              <CardTitle>Readiness Check-In</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={handleSaveRecovery} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Input label="Soreness (1-5)" type="number" min={1} max={5} value={soreness} onChange={(e) => setSoreness(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)} />
              <Input label="Energy (1-5)" type="number" min={1} max={5} value={energy} onChange={(e) => setEnergy(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)} />
              <Input label="Fatigue (1-5)" type="number" min={1} max={5} value={fatigue} onChange={(e) => setFatigue(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)} />
            </div>
            <Input label="Mood / Notes" value={moodNote} onChange={(e) => setMoodNote(e.target.value)} placeholder="How are you feeling today?" />
            <Button type="submit" size="sm">Save Check-In</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

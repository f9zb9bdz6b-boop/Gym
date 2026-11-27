import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { profileRepo } from '@/db/repositories/profileRepo';
import { todayISO, formatDate } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Scale, User } from 'lucide-react';

export function ProfileView() {
  const { setShowOnboarding, addToast } = useAppStore();
  const profile = useLiveQuery(() => db.userProfile.get('primary'), []);
  const targets = useLiveQuery(() => db.nutritionTargets.get('active'), []);
  const metrics = useLiveQuery(() => db.bodyMetrics.orderBy('date').reverse().limit(10).toArray(), []) ?? [];

  const [weightKg, setWeightKg] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');

  if (!profile) {
    return (
      <Card className="text-center py-8 space-y-3">
        <p className="text-sm text-zinc-400">No profile found.</p>
        <Button onClick={() => setShowOnboarding(true)}>Create Profile</Button>
      </Card>
    );
  }

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg) return;
    await profileRepo.addBodyMetric({
      date: todayISO(),
      weightKg: Number(weightKg),
      bodyFatPercent: bodyFat ? Number(bodyFat) : undefined,
      notes: notes || undefined,
    });
    setWeightKg('');
    setBodyFat('');
    setNotes('');
    addToast({ title: 'Body measurement recorded' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Personal Profile</h1>
          <p className="text-xs text-zinc-400">Historical body measurements are preserved automatically.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowOnboarding(true)}>
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-zinc-400">Current Weight</p>
          <p className="text-xl font-bold text-white mt-1">{profile.currentWeightKg} kg</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-400">Target Weight</p>
          <p className="text-xl font-bold text-lime-400 mt-1">{profile.targetWeightKg} kg</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-400">Calorie Target</p>
          <p className="text-xl font-bold text-white mt-1">{targets?.caloriesTarget ?? '-'} kcal</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-400">Protein Target</p>
          <p className="text-xl font-bold text-lime-400 mt-1">{targets?.proteinTargetG ?? '-'} g</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-lime-400" />
              <CardTitle>Record Body Measurement</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={handleLogWeight} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Weight (kg)" type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
              <Input label="Body Fat % (opt)" type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
            </div>
            <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Morning fasted weight..." />
            <Button type="submit" className="w-full">Save Measurement</Button>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-lime-400" />
              <CardTitle>Recent Weight History</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {metrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-zinc-900/70 px-3 py-2 text-xs">
                <div>
                  <span className="font-semibold text-white">{m.weightKg} kg</span>
                  {m.bodyFatPercent && <span className="text-zinc-400 ml-2">({m.bodyFatPercent}% BF)</span>}
                  {m.notes && <p className="text-[11px] text-zinc-500">{m.notes}</p>}
                </div>
                <Badge>{formatDate(m.date)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

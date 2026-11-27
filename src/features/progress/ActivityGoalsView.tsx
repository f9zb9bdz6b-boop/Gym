import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { goalsRepo } from '@/db/repositories/goalsRepo';
import type { ActivityType } from '@/db/types';
import { todayISO } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Check, Flame, Plus, Trash2 } from 'lucide-react';

const ACTIVITY_TYPES: ActivityType[] = ['Weight training', 'Walking', 'Running', 'Cycling', 'Swimming', 'Cardio', 'Other'];

export function ActivityGoalsView() {
  const { addToast } = useAppStore();
  const today = todayISO();

  const goals = useLiveQuery(() => db.dailyGoals.filter((g) => g.isActive).toArray(), []) ?? [];
  const completions = useLiveQuery(() => db.goalCompletions.where('date').equals(today).toArray(), [today]) ?? [];
  const activities = useLiveQuery(() => db.activityLogs.where('date').equals(today).toArray(), [today]) ?? [];

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [actType, setActType] = useState<ActivityType>('Walking');
  const [actDuration, setActDuration] = useState(30);
  const [actSteps, setActSteps] = useState(4000);
  const [actCalories, setActCalories] = useState(140);

  const completedIds = new Set(completions.filter((c) => c.completed).map((c) => c.goalId));
  const pct = goals.length > 0 ? Math.round((completedIds.size / goals.length) * 100) : 0;

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    await goalsRepo.addGoal({
      title: newGoalTitle.trim(),
      category: 'custom',
      targetValue: 1,
      unit: 'day',
      isActive: true,
    });
    setNewGoalTitle('');
    addToast({ title: 'Daily goal added' });
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    await goalsRepo.addActivityLog({
      date: today,
      type: actType,
      durationMinutes: Number(actDuration),
      steps: actType === 'Walking' || actType === 'Running' ? Number(actSteps) : undefined,
      estimatedCaloriesBurned: Number(actCalories),
    });
    addToast({ title: 'Activity logged', description: `${actType} · ~${actCalories} kcal` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Daily Goals &amp; Activity</h1>
        <p className="text-xs text-zinc-400">
          Track daily habits and physical activity. Exercise calories are kept separate from BMR/TDEE.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Goals Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Checklist ({pct}%)</CardTitle>
          </CardHeader>
          <ProgressBar value={completedIds.size} max={Math.max(1, goals.length)} className="mb-4" />
          <div className="space-y-2 mb-4">
            {goals.map((g) => {
              const done = completedIds.has(g.id);
              return (
                <div
                  key={g.id}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 border ${
                    done ? 'bg-lime-400/10 border-lime-400/30' : 'bg-zinc-900/70 border-zinc-800/60'
                  }`}
                >
                  <button
                    onClick={() => goalsRepo.toggleGoalCompletion(g.id, today, !done)}
                    className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                        done ? 'bg-lime-400 border-lime-400 text-zinc-950' : 'border-zinc-600'
                      }`}
                    >
                      {done && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className={`text-xs font-medium ${done ? 'line-through text-zinc-400' : 'text-zinc-100'}`}>
                      {g.title}
                    </span>
                  </button>
                  {g.category === 'custom' && (
                    <button onClick={() => goalsRepo.deleteGoal(g.id)} className="text-zinc-500 hover:text-red-400 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <form onSubmit={handleAddGoal} className="flex gap-2">
            <Input placeholder="Add custom daily habit..." value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} />
            <Button type="submit" size="md">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </Card>

        {/* Activity Logger */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-lime-400" />
              <CardTitle>Log Physical Activity</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={handleAddActivity} className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <Select label="Activity Type" value={actType} onChange={(e) => setActType(e.target.value as ActivityType)}>
                {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Input label="Duration (min)" type="number" value={actDuration} onChange={(e) => setActDuration(Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Steps (optional)" type="number" value={actSteps} onChange={(e) => setActSteps(Number(e.target.value))} />
              <Input label="Est. Burned (kcal)" type="number" value={actCalories} onChange={(e) => setActCalories(Number(e.target.value))} />
            </div>
            <Button type="submit" className="w-full">Log Activity</Button>
          </form>

          <div className="space-y-2 border-t border-zinc-800 pt-4">
            <p className="text-xs font-semibold text-zinc-300">Today's Activities</p>
            {activities.length === 0 ? (
              <p className="text-xs text-zinc-500">No activities logged today.</p>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-zinc-900/70 px-3 py-2 text-xs">
                  <span>{a.type} · {a.durationMinutes}m {a.steps ? `· ${a.steps} steps` : ''}</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-lime-400">~{a.estimatedCaloriesBurned} kcal</strong>
                    <button onClick={() => goalsRepo.deleteActivityLog(a.id)} className="text-zinc-500 hover:text-red-400 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

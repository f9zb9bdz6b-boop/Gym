import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { estimateSetCaloriesBurned } from '@/lib/calculators';
import { calculateWorkoutCaloriesWithGemini } from '@/lib/ai/aiService';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { useAppStore } from '@/stores/useAppStore';
import type { ExerciseLibraryItem, ExerciseSet, WorkoutSession } from '@/db/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Play, Check, Plus, Trash2, Trophy, Square, Flame, Sparkles } from 'lucide-react';

export function LiveWorkoutLogger() {
  const { activeSession, setActiveSession } = useWorkoutStore();
  const { addToast } = useAppStore();

  const profile = useLiveQuery(() => db.userProfile.get('primary'), []);
  const exercises = useLiveQuery(() => db.exerciseLibrary.orderBy('name').toArray(), []) ?? [];
  const sessionSets =
    useLiveQuery(
      () => (activeSession ? db.exerciseSets.where('sessionId').equals(activeSession.id).sortBy('createdAt') : []),
      [activeSession?.id]
    ) ?? [];

  const [selectedExId, setSelectedExId] = useState<string>('');
  const [completedSummary, setCompletedSummary] = useState<WorkoutSession | null>(null);
  const [prevBestMap, setPrevBestMap] = useState<Record<string, string>>({});
  const [geminiCalories, setGeminiCalories] = useState<{ total: number; perExercise: Record<string, number> } | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Load previous bests for exercises in current session
  useEffect(() => {
    if (!activeSession) return;
    const uniqueIds = Array.from(new Set(sessionSets.map((s) => s.exerciseId)));
    uniqueIds.forEach(async (exId) => {
      const prev = await workoutRepo.getPreviousBestForExercise(exId, activeSession.id);
      if (prev.bestSet) {
        setPrevBestMap((m) => ({
          ...m,
          [exId]: `${prev.bestSet!.weightKg} kg × ${prev.bestSet!.reps} reps`,
        }));
      }
    });
  }, [sessionSets, activeSession]);

  const handleAddExerciseToSession = async (ex: ExerciseLibraryItem) => {
    if (!activeSession) return;
    const existingForEx = sessionSets.filter((s) => s.exerciseId === ex.id);
    await workoutRepo.saveSet({
      sessionId: activeSession.id,
      exerciseId: ex.id,
      exerciseName: ex.name,
      setNumber: existingForEx.length + 1,
      weightKg: 0,
      reps: 8,
      completed: false,
    });
  };

  const handleUpdateSet = async (set: ExerciseSet, updates: Partial<ExerciseSet>) => {
    const updated = await workoutRepo.saveSet({ ...set, ...updates });
    if (updates.completed && !set.completed && updated.isPR) {
      addToast({ title: 'New Personal Record!', description: `${updated.exerciseName}: ${updated.weightKg} kg × ${updated.reps}` });
    }
  };

  const handleFinishWorkout = async () => {
    if (!activeSession) return;
    setCalcLoading(true);
    try {
      const doneSets = sessionSets.filter((s) => s.completed);
      const aiRes = await calculateWorkoutCaloriesWithGemini({
        sets: doneSets.map((s) => ({
          exerciseId: s.exerciseId,
          exerciseName: s.exerciseName,
          weightKg: s.weightKg,
          reps: s.reps,
        })),
        bodyWeightKg: profile?.currentWeightKg ?? 70,
        fallbackTotal: totalCaloriesBurned,
      });
      const summary = await workoutRepo.completeSession(
        activeSession.id,
        0,
        undefined,
        aiRes.totalCaloriesBurned
      );
      setActiveSession(null);
      setGeminiCalories(null);
      if (summary) {
        setCompletedSummary(summary);
        addToast({
          title: 'Workout Completed!',
          description: `~${summary.totalCaloriesBurned ?? 0} kcal burned${aiRes.usedGemini ? ' (Gemini)' : ''}`,
        });
      }
    } finally {
      setCalcLoading(false);
    }
  };

  const handleCalculateWithGemini = async () => {
    const doneSets = sessionSets.filter((s) => s.completed);
    if (doneSets.length === 0) {
      addToast({ title: 'Complete at least one set first', type: 'info' });
      return;
    }
    setCalcLoading(true);
    try {
      const res = await calculateWorkoutCaloriesWithGemini({
        sets: doneSets.map((s) => ({
          exerciseId: s.exerciseId,
          exerciseName: s.exerciseName,
          weightKg: s.weightKg,
          reps: s.reps,
        })),
        bodyWeightKg: profile?.currentWeightKg ?? 70,
        fallbackTotal: totalCaloriesBurned,
      });
      setGeminiCalories({ total: res.totalCaloriesBurned, perExercise: res.perExercise });
      addToast({
        title: res.usedGemini ? 'Gemini Calorie Calculation Ready' : 'Local Calorie Estimate Updated',
        description: `Total: ~${res.totalCaloriesBurned} kcal`,
      });
    } finally {
      setCalcLoading(false);
    }
  };

  if (completedSummary) {
    return (
      <Card className="max-w-xl mx-auto text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400/15 text-lime-400">
          <Trophy className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Workout Complete!</h2>
        <p className="text-sm text-zinc-400">{completedSummary.title}</p>
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800">
            <p className="text-[11px] text-zinc-400">Calories Burned</p>
            <p className="text-base font-bold text-amber-400">~{completedSummary.totalCaloriesBurned ?? 0} kcal</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800">
            <p className="text-[11px] text-zinc-400">Sets Completed</p>
            <p className="text-base font-bold text-lime-400">{completedSummary.totalSets}</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800">
            <p className="text-[11px] text-zinc-400">PRs</p>
            <p className="text-base font-bold text-white">{completedSummary.personalRecordsCount}</p>
          </div>
        </div>
        <Button onClick={() => setCompletedSummary(null)} className="w-full">
          Done
        </Button>
      </Card>
    );
  }

  if (!activeSession) {
    return (
      <Card className="text-center py-8 space-y-3">
        <p className="text-sm text-zinc-400">No active workout session.</p>
        <Button
          onClick={async () => {
            const s = await workoutRepo.startSession('Custom Workout');
            setActiveSession(s);
          }}
        >
          <Play className="h-4 w-4" /> Start Workout Session
        </Button>
      </Card>
    );
  }

  const exCalMap = new Map(exercises.map((e) => [e.id, e.caloriesBurnedPerSet ?? 8]));
  const grouped = sessionSets.reduce<Record<string, ExerciseSet[]>>((acc, s) => {
    if (!acc[s.exerciseId]) acc[s.exerciseId] = [];
    acc[s.exerciseId].push(s);
    return acc;
  }, {});

  const completedSets = sessionSets.filter((s) => s.completed);
  const dynamicTotalCalories = Math.round(
    completedSets.reduce(
      (sum, s) =>
        sum +
        estimateSetCaloriesBurned({
          weightKg: s.weightKg,
          reps: s.reps,
          baseCalPerSet: exCalMap.get(s.exerciseId) ?? 8,
          bodyWeightKg: profile?.currentWeightKg ?? 70,
        }),
      0
    )
  );
  const totalCaloriesBurned = geminiCalories?.total ?? dynamicTotalCalories;

  return (
    <div className="space-y-4">
      {/* Live Header (No Timers) */}
      <Card className="border-lime-400/30 bg-[#121215]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
              <h2 className="text-lg font-bold text-white">{activeSession.title}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
              <span>Sets: <strong className="text-white">{completedSets.length}</strong></span>
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                Est. Burned: <strong className="text-amber-400">~{totalCaloriesBurned} kcal</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleCalculateWithGemini} disabled={calcLoading}>
              <Sparkles className={`h-3.5 w-3.5 text-lime-400 ${calcLoading ? 'animate-spin' : ''}`} />
              {calcLoading ? 'Calculating...' : 'Gemini Calories'}
            </Button>
            <Button size="sm" onClick={handleFinishWorkout} disabled={calcLoading}>
              <Square className="h-3.5 w-3.5" /> Finish Workout
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Exercise Bar */}
      <div className="flex gap-2">
        <select
          value={selectedExId}
          onChange={(e) => setSelectedExId(e.target.value)}
          className="flex-1 h-10 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 text-sm text-zinc-100"
        >
          <option value="">Select an exercise from library...</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.primaryMuscle} · ~{ex.caloriesBurnedPerSet ?? 8} kcal/set)
            </option>
          ))}
        </select>
        <Button
          onClick={() => {
            const ex = exercises.find((e) => e.id === selectedExId);
            if (ex) handleAddExerciseToSession(ex);
          }}
          disabled={!selectedExId}
        >
          <Plus className="h-4 w-4" /> Add Exercise
        </Button>
      </div>

      {/* Exercise Cards */}
      {Object.entries(grouped).map(([exId, sets]) => {
        const calPerSet = exCalMap.get(exId) ?? 8;
        const dynamicExBurned = Math.round(
          sets
            .filter((s) => s.completed)
            .reduce(
              (sum, s) =>
                sum +
                estimateSetCaloriesBurned({
                  weightKg: s.weightKg,
                  reps: s.reps,
                  baseCalPerSet: calPerSet,
                  bodyWeightKg: profile?.currentWeightKg ?? 70,
                }),
              0
            )
        );
        const exBurned = geminiCalories?.perExercise[exId] ?? dynamicExBurned;

        return (
          <Card key={exId}>
            <CardHeader>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>{sets[0].exerciseName}</CardTitle>
                  <Badge variant="warning">~{exBurned} kcal</Badge>
                </div>
                {prevBestMap[exId] && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">Previous best: {prevBestMap[exId]}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  workoutRepo.saveSet({
                    sessionId: activeSession.id,
                    exerciseId: exId,
                    exerciseName: sets[0].exerciseName,
                    setNumber: sets.length + 1,
                    weightKg: sets[sets.length - 1]?.weightKg ?? 0,
                    reps: sets[sets.length - 1]?.reps ?? 8,
                    completed: false,
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add Set
              </Button>
            </CardHeader>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-medium text-zinc-500 px-2">
                <span className="col-span-2">SET</span>
                <span className="col-span-4">WEIGHT (KG)</span>
                <span className="col-span-4">REPS</span>
                <span className="col-span-2 text-right">DONE</span>
              </div>
              {sets.map((s, idx) => (
                <div
                  key={s.id}
                  className={`grid grid-cols-12 items-center gap-2 rounded-xl px-2 py-1.5 ${
                    s.completed ? 'bg-lime-400/10 border border-lime-400/20' : 'bg-zinc-900/60'
                  }`}
                >
                  <div className="col-span-2 flex items-center gap-1 text-xs font-semibold text-zinc-300">
                    <span>{idx + 1}</span>
                    {s.isPR && <Badge variant="lime">PR</Badge>}
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      step="0.5"
                      value={s.weightKg}
                      onChange={(e) => handleUpdateSet(s, { weightKg: Number(e.target.value) })}
                      className="w-full h-8 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-xs text-white"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      value={s.reps}
                      onChange={(e) => handleUpdateSet(s, { reps: Number(e.target.value) })}
                      className="w-full h-8 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-xs text-white"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleUpdateSet(s, { completed: !s.completed })}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                        s.completed ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                      aria-label="Mark set completed"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => workoutRepo.deleteSet(s.id)}
                      className="h-8 w-6 flex items-center justify-center text-zinc-500 hover:text-red-400 cursor-pointer"
                      aria-label="Remove set"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

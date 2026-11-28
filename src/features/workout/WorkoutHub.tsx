import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { useAppStore } from '@/stores/useAppStore';
import type { PlannedExercise, WorkoutDayTemplate } from '@/db/types';
import { LiveWorkoutLogger } from './LiveWorkoutLogger';
import { ExerciseLibraryView } from './ExerciseLibraryView';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AIInlinePanel } from '@/components/ui/AIInlinePanel';
import { formatDate, generateId } from '@/lib/utils';
import { Play, Copy, Trash2, CheckCircle2, Dumbbell, History, BookOpen, Calendar, Plus } from 'lucide-react';

export function WorkoutHub() {
  const [tab, setTab] = useState<'live' | 'plans' | 'history' | 'library'>('plans');
  const { activeSession, setActiveSession } = useWorkoutStore();
  const { addToast } = useAppStore();

  const plans = useLiveQuery(() => db.workoutPlans.filter((p) => !p.isTemplate).toArray(), []) ?? [];
  const exercises = useLiveQuery(() => db.exerciseLibrary.orderBy('name').toArray(), []) ?? [];
  const sessions = useLiveQuery(() => db.workoutSessions.where('status').equals('completed').reverse().sortBy('startedAt'), []) ?? [];
  const inProgress = useLiveQuery(() => db.workoutSessions.where('status').equals('in_progress').first(), []);

  // Custom Plan Builder State
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [days, setDays] = useState<WorkoutDayTemplate[]>([
    { id: generateId(), dayName: 'Day 1', isRestDay: false, exercises: [] },
  ]);
  const [pickExId, setPickExId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (inProgress && !activeSession) {
      setActiveSession(inProgress);
      setTab('live');
    }
  }, [inProgress, activeSession, setActiveSession]);

  const handleAddDay = () => {
    setDays((prev) => [
      ...prev,
      { id: generateId(), dayName: `Day ${prev.length + 1}`, isRestDay: false, exercises: [] },
    ]);
  };

  const handleAddExerciseToDay = (dayId: string) => {
    const exId = pickExId[dayId];
    const ex = exercises.find((e) => e.id === exId);
    if (!ex) return;
    const planned: PlannedExercise = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      targetSets: 3,
      targetReps: '8-12',
      restSeconds: 0,
    };
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, planned] } : d))
    );
  };

  const handleSaveCustomPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;
    await workoutRepo.saveWorkoutPlan({
      name: planName.trim(),
      splitType: 'Custom',
      description: planDesc.trim() || 'Custom workout plan',
      days,
      isActive: plans.length === 0,
      isArchived: false,
      isTemplate: false,
    });
    setPlanName('');
    setPlanDesc('');
    setDays([{ id: generateId(), dayName: 'Day 1', isRestDay: false, exercises: [] }]);
    setShowCreatePlan(false);
    addToast({ title: 'Custom plan saved!' });
  };

  const handleStartPlanDay = async (dayName: string, dayExercises: PlannedExercise[]) => {
    const session = await workoutRepo.startSession(dayName);
    for (const ex of dayExercises) {
      for (let i = 1; i <= ex.targetSets; i++) {
        await workoutRepo.saveSet({
          sessionId: session.id,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          setNumber: i,
          weightKg: 0,
          reps: parseInt(ex.targetReps, 10) || 8,
          completed: false,
        });
      }
    }
    setActiveSession(session);
    setTab('live');
    addToast({ title: 'Workout Started', description: dayName });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Workout</h1>
          <p className="text-xs text-zinc-400">Build custom plans, log sets/reps/weights, and track calories burned.</p>
        </div>
        <div className="flex flex-wrap gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          {[
            { id: 'live', label: 'Live Logger', icon: Dumbbell },
            { id: 'plans', label: 'Custom Plans', icon: Calendar },
            { id: 'history', label: 'History', icon: History },
            { id: 'library', label: 'Library', icon: BookOpen },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tab === t.id ? 'bg-lime-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {t.id === 'live' && activeSession && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'live' && <LiveWorkoutLogger />}

      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Your Custom Plans</h2>
            <Button size="sm" onClick={() => setShowCreatePlan(!showCreatePlan)}>
              <Plus className="h-4 w-4" /> Create Custom Plan
            </Button>
          </div>

          {showCreatePlan && (
            <Card className="border-lime-400/30">
              <form onSubmit={handleSaveCustomPlan} className="space-y-4">
                <CardTitle>New Custom Workout Plan</CardTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Plan Name" placeholder="e.g. My 4-Day Split" value={planName} onChange={(e) => setPlanName(e.target.value)} required />
                  <Input label="Description" placeholder="Optional notes..." value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} />
                </div>

                <div className="space-y-3">
                  {days.map((day, dIdx) => (
                    <div key={day.id} className="rounded-xl bg-zinc-900/70 p-3 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          value={day.dayName}
                          onChange={(e) =>
                            setDays((prev) => prev.map((d) => (d.id === day.id ? { ...d, dayName: e.target.value } : d)))
                          }
                          className="h-8 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-xs font-semibold text-white flex-1"
                        />
                        {days.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDays((prev) => prev.filter((d) => d.id !== day.id))}
                            className="text-zinc-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {day.exercises.map((ex, eIdx) => (
                        <div key={`${ex.exerciseId}-${eIdx}`} className="flex items-center justify-between text-xs bg-zinc-950/80 px-2.5 py-1.5 rounded-lg">
                          <span>{ex.exerciseName} ({ex.targetSets} × {ex.targetReps})</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDays((prev) =>
                                prev.map((d) =>
                                  d.id === day.id ? { ...d, exercises: d.exercises.filter((_, i) => i !== eIdx) } : d
                                )
                              )
                            }
                            className="text-zinc-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <select
                          value={pickExId[day.id] ?? ''}
                          onChange={(e) => setPickExId((m) => ({ ...m, [day.id]: e.target.value }))}
                          className="flex-1 h-8 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-200"
                        >
                          <option value="">Pick exercise for Day {dIdx + 1}...</option>
                          {exercises.map((ex) => (
                            <option key={ex.id} value={ex.id}>{ex.name} ({ex.primaryMuscle})</option>
                          ))}
                        </select>
                        <Button type="button" size="sm" variant="secondary" onClick={() => handleAddExerciseToDay(day.id)}>
                          <Plus className="h-3.5 w-3.5" /> Add
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" size="sm" variant="outline" onClick={handleAddDay}>
                    <Plus className="h-3.5 w-3.5" /> Add Day
                  </Button>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreatePlan(false)}>Cancel</Button>
                  <Button type="submit" size="sm">Save Custom Plan</Button>
                </div>
              </form>
            </Card>
          )}

          <AIInlinePanel
            title="AI Workout & Progressive Overload Coach"
            prompt="Review my custom workout plans and last 7 days of training. Suggest progressive overload targets and any exercise swaps if needed."
            contextHint="Workout Plans"
            buttonLabel="Analyze Split"
          />

          {plans.length === 0 ? (
            <Card className="text-center py-8 text-xs text-zinc-400">
              No custom plans yet. Click <strong>Create Custom Plan</strong> above to build your own split!
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className={plan.isActive ? 'border-lime-400/40' : ''}>
                  <CardHeader>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{plan.name}</CardTitle>
                        {plan.isActive && <Badge variant="lime">Active</Badge>}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{plan.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!plan.isActive && (
                        <Button size="sm" variant="outline" onClick={() => workoutRepo.setActivePlan(plan.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Activate
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => workoutRepo.duplicateWorkoutPlan(plan.id)} title="Duplicate plan">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => workoutRepo.deleteWorkoutPlan(plan.id)} title="Delete plan">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </CardHeader>

                  <div className="space-y-2">
                    {plan.days.map((day) => (
                      <div
                        key={day.id}
                        className="flex items-center justify-between rounded-xl bg-zinc-900/70 px-3.5 py-2.5 border border-zinc-800/60"
                      >
                        <div>
                          <p className="text-xs font-semibold text-zinc-100">{day.dayName}</p>
                          <p className="text-[11px] text-zinc-400">{day.exercises.length} exercises</p>
                        </div>
                        <Button size="sm" onClick={() => handleStartPlanDay(day.dayName, day.exercises)}>
                          <Play className="h-3.5 w-3.5" /> Start
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <Card className="text-center py-8 text-xs text-zinc-400">
              No completed workouts yet. Start a session to build your training history!
            </Card>
          ) : (
            sessions.map((s) => (
              <Card key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <p className="text-xs text-zinc-400">{formatDate(s.date)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="lime">{s.totalVolumeKg} kg volume</Badge>
                  <Badge variant="warning">~{s.totalCaloriesBurned ?? 0} kcal</Badge>
                  <Badge>{s.totalSets} sets</Badge>
                  {s.personalRecordsCount > 0 && <Badge variant="info">{s.personalRecordsCount} PRs</Badge>}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'library' && <ExerciseLibraryView />}
    </div>
  );
}

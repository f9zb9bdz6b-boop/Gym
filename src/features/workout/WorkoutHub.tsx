import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { useAppStore } from '@/stores/useAppStore';
import { LiveWorkoutLogger } from './LiveWorkoutLogger';
import { ExerciseLibraryView } from './ExerciseLibraryView';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatDuration } from '@/lib/utils';
import { Play, Copy, Trash2, CheckCircle2, Dumbbell, History, BookOpen, Calendar } from 'lucide-react';

export function WorkoutHub() {
  const [tab, setTab] = useState<'live' | 'plans' | 'history' | 'library'>('plans');
  const { activeSession, setActiveSession, setElapsedSeconds } = useWorkoutStore();
  const { addToast } = useAppStore();

  const plans = useLiveQuery(() => db.workoutPlans.toArray(), []) ?? [];
  const sessions = useLiveQuery(() => db.workoutSessions.where('status').equals('completed').reverse().sortBy('startedAt'), []) ?? [];
  const inProgress = useLiveQuery(() => db.workoutSessions.where('status').equals('in_progress').first(), []);

  useEffect(() => {
    if (inProgress && !activeSession) {
      setActiveSession(inProgress);
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(inProgress.startedAt).getTime()) / 1000));
      setElapsedSeconds(elapsed);
      setTab('live');
    }
  }, [inProgress, activeSession, setActiveSession, setElapsedSeconds]);

  const handleStartPlanDay = async (dayName: string, exercises: { exerciseId: string; exerciseName: string; targetSets: number; targetReps: string }[]) => {
    const session = await workoutRepo.startSession(dayName);
    for (const ex of exercises) {
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
    setElapsedSeconds(0);
    setTab('live');
    addToast({ title: 'Workout Started', description: dayName });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Workout</h1>
          <p className="text-xs text-zinc-400">Plan splits, log live sets, track PRs, and browse exercises.</p>
        </div>
        <div className="flex flex-wrap gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          {[
            { id: 'live', label: 'Live Logger', icon: Dumbbell },
            { id: 'plans', label: 'Plans', icon: Calendar },
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => workoutRepo.duplicateWorkoutPlan(plan.id)}
                    title="Duplicate plan"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {!plan.isTemplate && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => workoutRepo.deleteWorkoutPlan(plan.id)}
                      title="Delete plan"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  )}
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
                    {!day.isRestDay && (
                      <Button size="sm" onClick={() => handleStartPlanDay(day.dayName, day.exercises)}>
                        <Play className="h-3.5 w-3.5" /> Start
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
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
                  <p className="text-xs text-zinc-400">{formatDate(s.date)} · {formatDuration(s.durationSeconds)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="lime">{s.totalVolumeKg} kg volume</Badge>
                  <Badge>{s.totalSets} sets</Badge>
                  {s.personalRecordsCount > 0 && <Badge variant="warning">{s.personalRecordsCount} PRs</Badge>}
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

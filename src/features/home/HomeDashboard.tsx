import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useAppStore } from '@/stores/useAppStore';
import { todayISO, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { wellnessRepo } from '@/db/repositories/wellnessRepo';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import {
  Dumbbell,
  Utensils,
  Droplets,
  Flame,
  Sparkles,
  Scale,
  Plus,
  Play,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';

export function HomeDashboard() {
  const { setActiveTab, setSubView, setShowOnboarding, addToast } = useAppStore();
  const { setActiveSession, setElapsedSeconds } = useWorkoutStore();
  const today = todayISO();

  const profile = useLiveQuery(() => db.userProfile.get('primary'), []);
  const targets = useLiveQuery(() => db.nutritionTargets.get('active'), []);
  const foodLogs = useLiveQuery(() => db.foodLogs.where('date').equals(today).toArray(), [today]) ?? [];
  const activityLogs = useLiveQuery(() => db.activityLogs.where('date').equals(today).toArray(), [today]) ?? [];
  const recovery = useLiveQuery(() => db.recoveryLogs.where('date').equals(today).first(), [today]);
  const sleep = useLiveQuery(() => db.sleepLogs.where('date').equals(today).first(), [today]);
  const goals = useLiveQuery(() => db.dailyGoals.filter((g) => g.isActive).toArray(), []) ?? [];
  const completions = useLiveQuery(() => db.goalCompletions.where('date').equals(today).toArray(), [today]) ?? [];
  const scheduledToday = useLiveQuery(() => db.scheduledWorkouts.where('date').equals(today).first(), [today]);
  const activePlan = useLiveQuery(() => db.workoutPlans.filter((p) => p.isActive).first(), []);
  const inProgressSession = useLiveQuery(() => db.workoutSessions.where('status').equals('in_progress').first(), []);

  const totalCalories = Math.round(foodLogs.reduce((s, f) => s + f.calories, 0));
  const totalProtein = Math.round(foodLogs.reduce((s, f) => s + f.proteinG, 0));
  const totalCarbs = Math.round(foodLogs.reduce((s, f) => s + f.carbsG, 0));
  const totalFat = Math.round(foodLogs.reduce((s, f) => s + f.fatG, 0));
  const totalBurned = Math.round(activityLogs.reduce((s, a) => s + a.estimatedCaloriesBurned, 0));
  const totalSteps = activityLogs.reduce((s, a) => s + (a.steps ?? 0), 0);

  const calTarget = targets?.caloriesTarget ?? 2200;
  const protTarget = targets?.proteinTargetG ?? 150;
  const waterTarget = targets?.waterTargetMl ?? 3000;
  const waterMl = recovery?.waterMl ?? 0;

  const completedGoalsCount = completions.filter((c) => c.completed).length;
  const goalPct = goals.length > 0 ? Math.round((completedGoalsCount / goals.length) * 100) : 0;

  const handleQuickWater = async () => {
    await wellnessRepo.addWaterMl(today, 250);
    addToast({ title: '+250 ml water logged' });
  };

  const handleStartWorkout = async () => {
    if (inProgressSession) {
      setActiveSession(inProgressSession);
      setActiveTab('workout');
      return;
    }
    const title = scheduledToday?.title ?? activePlan?.days[0]?.dayName ?? 'Quick Workout';
    const session = await workoutRepo.startSession(title, scheduledToday?.id);
    setActiveSession(session);
    setElapsedSeconds(0);
    setActiveTab('workout');
    addToast({ title: 'Workout started', description: title });
  };

  if (profile === undefined) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<UserPlus className="h-6 w-6" />}
          title="Welcome to GYM APP"
          description="Set up your personal fitness profile to unlock tailored calorie targets, workout planning, and AI insights."
          actionLabel="Start Onboarding"
          onAction={() => setShowOnboarding(true)}
        />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const remainingProt = Math.max(0, protTarget - totalProtein);
  const remainingCal = Math.max(0, calTarget - totalCalories);

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-lime-400 uppercase tracking-wider">{formatDate(today)}</p>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            {greeting}, {profile.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="lime">{profile.objective.replace('_', ' ')}</Badge>
            <Badge>{profile.currentWeightKg} kg → {profile.targetWeightKg} kg</Badge>
            <Badge>{profile.workoutFrequencyPerWeek}x / week</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setActiveTab('nutrition')}>
            <Plus className="h-4 w-4" /> Log Food
          </Button>
          <Button size="sm" onClick={handleStartWorkout}>
            <Play className="h-4 w-4" /> {inProgressSession ? 'Resume Workout' : 'Start Workout'}
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {[
          { label: 'Log Food', icon: Utensils, onClick: () => setActiveTab('nutrition') },
          { label: 'Workout', icon: Dumbbell, onClick: handleStartWorkout },
          { label: 'Log Weight', icon: Scale, onClick: () => setSubView('profile') },
          { label: 'Add Activity', icon: Flame, onClick: () => setSubView('activity') },
          { label: '+250ml Water', icon: Droplets, onClick: handleQuickWater },
          { label: 'Ask AI', icon: Sparkles, onClick: () => setActiveTab('ai') },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-zinc-800/80 bg-[#121215] p-3 text-xs font-medium text-zinc-300 hover:border-lime-400/40 hover:text-lime-300 transition-all cursor-pointer"
            >
              <Icon className="h-4 w-4 text-lime-400" />
              <span className="truncate w-full text-center">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Nutrition Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Daily Nutrition Overview</CardTitle>
              <p className="text-xs text-zinc-400 mt-0.5">
                {remainingCal} kcal & {remainingProt}g protein remaining today
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setActiveTab('nutrition')}>
              Details
            </Button>
          </CardHeader>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="rounded-xl bg-zinc-900/70 p-3 border border-zinc-800/60">
              <p className="text-[11px] text-zinc-400">Calories</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {totalCalories} <span className="text-xs font-normal text-zinc-500">/ {calTarget}</span>
              </p>
              <ProgressBar value={totalCalories} max={calTarget} className="mt-2" />
            </div>
            <div className="rounded-xl bg-zinc-900/70 p-3 border border-zinc-800/60">
              <p className="text-[11px] text-zinc-400">Protein</p>
              <p className="text-lg font-bold text-lime-400 mt-0.5">
                {totalProtein}g <span className="text-xs font-normal text-zinc-500">/ {protTarget}g</span>
              </p>
              <ProgressBar value={totalProtein} max={protTarget} className="mt-2" />
            </div>
            <div className="rounded-xl bg-zinc-900/70 p-3 border border-zinc-800/60">
              <p className="text-[11px] text-zinc-400">Carbs</p>
              <p className="text-lg font-bold text-sky-400 mt-0.5">
                {totalCarbs}g <span className="text-xs font-normal text-zinc-500">/ {targets?.carbsTargetG ?? 220}g</span>
              </p>
              <ProgressBar value={totalCarbs} max={targets?.carbsTargetG ?? 220} colorClass="bg-sky-400" className="mt-2" />
            </div>
            <div className="rounded-xl bg-zinc-900/70 p-3 border border-zinc-800/60">
              <p className="text-[11px] text-zinc-400">Fat</p>
              <p className="text-lg font-bold text-amber-400 mt-0.5">
                {totalFat}g <span className="text-xs font-normal text-zinc-500">/ {targets?.fatTargetG ?? 70}g</span>
              </p>
              <ProgressBar value={totalFat} max={targets?.fatTargetG ?? 70} colorClass="bg-amber-400" className="mt-2" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-900/50 px-4 py-2.5 text-xs text-zinc-400 border border-zinc-800/60">
            <span>Estimated Activity Expenditure: <strong className="text-zinc-200">{totalBurned} kcal</strong></span>
            <span>Steps Today: <strong className="text-zinc-200">{totalSteps.toLocaleString()}</strong></span>
          </div>
        </Card>

        {/* Today's Workout */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Workout</CardTitle>
            <Badge variant={scheduledToday?.status === 'completed' ? 'lime' : 'default'}>
              {scheduledToday?.status ?? (inProgressSession ? 'In Progress' : 'Planned')}
            </Badge>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <p className="text-base font-semibold text-white">
                {inProgressSession?.title ?? scheduledToday?.title ?? activePlan?.days[0]?.dayName ?? 'Custom Session'}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {activePlan ? `Plan: ${activePlan.name}` : 'No active split selected'}
              </p>
            </div>
            <Button className="w-full" onClick={handleStartWorkout}>
              <Play className="h-4 w-4" />
              {inProgressSession ? 'Resume Live Session' : 'Start Workout'}
            </Button>
          </div>
        </Card>

        {/* Daily Goals & Recovery */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Goals & Recovery</CardTitle>
            <span className="text-xs font-semibold text-lime-400">{goalPct}%</span>
          </CardHeader>
          <div className="space-y-3">
            <ProgressBar value={completedGoalsCount} max={Math.max(1, goals.length)} />
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="rounded-xl bg-zinc-900/70 p-3 border border-zinc-800/60">
                <p className="text-[11px] text-zinc-400">Water</p>
                <p className="text-sm font-semibold text-white mt-0.5">{waterMl} / {waterTarget} ml</p>
              </div>
              <div className="rounded-xl bg-zinc-900/70 p-3 border border-zinc-800/60">
                <p className="text-[11px] text-zinc-400">Sleep</p>
                <p className="text-sm font-semibold text-white mt-0.5">{sleep ? `${sleep.durationHours} hrs` : 'Not logged'}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={() => setSubView('activity')}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Manage Daily Goals
            </Button>
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-lime-400" />
              <CardTitle>AI Fitness Insights</CardTitle>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setActiveTab('ai')}>
              Open Assistant
            </Button>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-zinc-900/70 p-3.5 border border-zinc-800/60">
              <p className="font-semibold text-zinc-200 mb-1">Nutrition Check</p>
              <p className="text-zinc-400">
                {remainingProt > 0
                  ? `You still need ${remainingProt}g of protein today. Consider 1 scoop whey (25g) or 100g chicken breast (31g).`
                  : 'Great job! You have hit your daily protein target.'}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-900/70 p-3.5 border border-zinc-800/60">
              <p className="font-semibold text-zinc-200 mb-1">Hydration & Readiness</p>
              <p className="text-zinc-400">
                {waterMl < waterTarget * 0.5
                  ? `Hydration is at ${Math.round((waterMl / waterTarget) * 100)}%. Drink 500ml water before your next meal.`
                  : 'Hydration is on track. Keep energy steady for your training session.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

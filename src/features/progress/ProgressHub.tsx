import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { daysAgoISO } from '@/lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Dumbbell, Utensils } from 'lucide-react';

type RangeKey = '7d' | '30d' | '90d' | 'all';

export function ProgressHub() {
  const [range, setRange] = useState<RangeKey>('30d');

  const cutoff =
    range === '7d' ? daysAgoISO(7) : range === '30d' ? daysAgoISO(30) : range === '90d' ? daysAgoISO(90) : '1970-01-01';

  const metrics = useLiveQuery(() => db.bodyMetrics.where('date').aboveOrEqual(cutoff).sortBy('date'), [cutoff]) ?? [];
  const sessions =
    useLiveQuery(
      () => db.workoutSessions.where('status').equals('completed').filter((s) => s.date >= cutoff).sortBy('date'),
      [cutoff]
    ) ?? [];
  const foodLogs = useLiveQuery(() => db.foodLogs.where('date').aboveOrEqual(cutoff).toArray(), [cutoff]) ?? [];

  // Aggregate nutrition by date
  const nutritionByDate = Object.values(
    foodLogs.reduce<Record<string, { date: string; calories: number; protein: number }>>((acc, log) => {
      if (!acc[log.date]) acc[log.date] = { date: log.date, calories: 0, protein: 0 };
      acc[log.date].calories += log.calories;
      acc[log.date].protein += log.proteinG;
      return acc;
    }, {})
  ).sort((a, b) => a.date.localeCompare(b.date));

  const totalWorkouts = sessions.length;
  const totalVolume = sessions.reduce((s, w) => s + w.totalVolumeKg, 0);
  const totalPRs = sessions.reduce((s, w) => s + w.personalRecordsCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Progress &amp; Analytics</h1>
          <p className="text-xs text-zinc-400">Real-time trends from your local IndexedDB records.</p>
        </div>
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          {(['7d', '30d', '90d', 'all'] as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                range === r ? 'bg-lime-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-zinc-400">Completed Workouts</p>
          <p className="text-2xl font-bold text-white mt-1">{totalWorkouts}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-400">Total Volume Lifted</p>
          <p className="text-2xl font-bold text-lime-400 mt-1">{totalVolume.toLocaleString()} kg</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-400">Personal Records</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{totalPRs}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-lime-400" />
              <CardTitle>Body Weight Trend (kg)</CardTitle>
            </div>
            <Badge>{metrics.length} entries</Badge>
          </CardHeader>
          <div className="h-64">
            {metrics.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                No weight entries in this date range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a3e635" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="weightKg" stroke="#a3e635" fill="url(#weightGrad)" strokeWidth={2} name="Weight (kg)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-lime-400" />
              <CardTitle>Workout Volume (kg)</CardTitle>
            </div>
            <Badge>{sessions.length} sessions</Badge>
          </CardHeader>
          <div className="h-64">
            {sessions.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                Complete a workout to see volume trends.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '12px' }} />
                  <Bar dataKey="totalVolumeKg" fill="#a3e635" radius={[6, 6, 0, 0]} name="Volume (kg)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-sky-400" />
              <CardTitle>Daily Calorie &amp; Protein Intake</CardTitle>
            </div>
            <Badge>{nutritionByDate.length} days</Badge>
          </CardHeader>
          <div className="h-64">
            {nutritionByDate.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                Log food entries to see nutrition trends.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nutritionByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '12px' }} />
                  <Bar dataKey="calories" fill="#38bdf8" radius={[6, 6, 0, 0]} name="Calories (kcal)" />
                  <Bar dataKey="protein" fill="#a3e635" radius={[6, 6, 0, 0]} name="Protein (g)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

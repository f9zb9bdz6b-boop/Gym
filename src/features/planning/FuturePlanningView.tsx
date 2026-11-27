import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { daysFromNowISO, formatDate } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CalendarClock, Plus } from 'lucide-react';

export function FuturePlanningView() {
  const { addToast } = useAppStore();
  const scheduled = useLiveQuery(() => db.scheduledWorkouts.orderBy('date').toArray(), []) ?? [];
  const activePlan = useLiveQuery(() => db.workoutPlans.filter((p) => p.isActive).first(), []);

  const [scheduleDate, setScheduleDate] = useState(daysFromNowISO(1));
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan || activePlan.days.length === 0) return;
    const day = activePlan.days[selectedDayIdx] ?? activePlan.days[0];
    await workoutRepo.scheduleWorkout({
      date: scheduleDate,
      planId: activePlan.id,
      dayTemplateId: day.id,
      title: day.dayName,
      status: day.isRestDay ? 'rest_day' : 'planned',
      exercises: day.exercises,
    });
    addToast({ title: 'Workout Scheduled', description: `${day.dayName} on ${formatDate(scheduleDate)}` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Future Planning</h1>
        <p className="text-xs text-zinc-400">Schedule upcoming workouts, rest days, and review your training calendar.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-lime-400" />
            <CardTitle>Schedule Upcoming Workout</CardTitle>
          </div>
        </CardHeader>
        {activePlan ? (
          <form onSubmit={handleSchedule} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Workout Day ({activePlan.name})</label>
              <select
                value={selectedDayIdx}
                onChange={(e) => setSelectedDayIdx(Number(e.target.value))}
                className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-white"
              >
                {activePlan.days.map((d, i) => (
                  <option key={d.id} value={i}>{d.dayName}</option>
                ))}
              </select>
            </div>
            <Button type="submit">
              <Plus className="h-4 w-4" /> Add to Schedule
            </Button>
          </form>
        ) : (
          <p className="text-xs text-zinc-400">Activate a workout plan in WORKOUT → Plans first.</p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Sessions</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {scheduled.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">No workouts scheduled yet.</p>
          ) : (
            scheduled.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-zinc-900/70 p-3 border border-zinc-800/60">
                <div>
                  <p className="text-xs font-semibold text-white">{item.title}</p>
                  <p className="text-[11px] text-zinc-400">{formatDate(item.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === 'completed' ? 'lime' : 'default'}>{item.status}</Badge>
                  <select
                    value={item.status}
                    onChange={(e) => workoutRepo.updateScheduledStatus(item.id, e.target.value as typeof item.status)}
                    className="h-8 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-200"
                  >
                    <option value="planned">Planned</option>
                    <option value="completed">Completed</option>
                    <option value="skipped">Skipped</option>
                    <option value="rescheduled">Rescheduled</option>
                    <option value="rest_day">Rest Day</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

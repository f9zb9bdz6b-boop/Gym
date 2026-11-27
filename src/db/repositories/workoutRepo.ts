import { db } from '../database';
import type {
  ExerciseLibraryItem,
  ExerciseSet,
  ScheduledWorkout,
  ScheduledWorkoutStatus,
  WorkoutPlan,
  WorkoutSession,
} from '../types';
import { generateId, todayISO } from '@/lib/utils';

export const workoutRepo = {
  // --- Exercise Library ---
  async getAllExercises(): Promise<ExerciseLibraryItem[]> {
    return db.exerciseLibrary.orderBy('name').toArray();
  },

  async toggleExerciseFavorite(id: string): Promise<void> {
    const item = await db.exerciseLibrary.get(id);
    if (item) {
      await db.exerciseLibrary.update(id, { isFavorite: !item.isFavorite });
    }
  },

  async saveCustomExercise(ex: Omit<ExerciseLibraryItem, 'id' | 'createdAt' | 'isCustom'>): Promise<ExerciseLibraryItem> {
    const record: ExerciseLibraryItem = {
      ...ex,
      id: generateId(),
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    await db.exerciseLibrary.add(record);
    return record;
  },

  // --- Workout Plans ---
  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    return db.workoutPlans.toArray();
  },

  async saveWorkoutPlan(plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<WorkoutPlan> {
    const now = new Date().toISOString();
    const record: WorkoutPlan = {
      ...plan,
      id: plan.id ?? generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.workoutPlans.put(record);
    return record;
  },

  async duplicateWorkoutPlan(id: string): Promise<WorkoutPlan | undefined> {
    const plan = await db.workoutPlans.get(id);
    if (!plan) return undefined;
    const now = new Date().toISOString();
    const copy: WorkoutPlan = {
      ...plan,
      id: generateId(),
      name: `${plan.name} (Copy)`,
      isActive: false,
      isTemplate: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.workoutPlans.add(copy);
    return copy;
  },

  async deleteWorkoutPlan(id: string): Promise<void> {
    await db.workoutPlans.delete(id);
  },

  async setActivePlan(id: string): Promise<void> {
    await db.transaction('rw', db.workoutPlans, async () => {
      const all = await db.workoutPlans.toArray();
      for (const p of all) {
        await db.workoutPlans.update(p.id, { isActive: p.id === id });
      }
    });
  },

  // --- Scheduled Workouts ---
  async getScheduledWorkouts(startDate?: string, endDate?: string): Promise<ScheduledWorkout[]> {
    if (startDate && endDate) {
      return db.scheduledWorkouts.where('date').between(startDate, endDate, true, true).toArray();
    }
    return db.scheduledWorkouts.orderBy('date').toArray();
  },

  async scheduleWorkout(workout: Omit<ScheduledWorkout, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledWorkout> {
    const now = new Date().toISOString();
    const record: ScheduledWorkout = {
      ...workout,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.scheduledWorkouts.add(record);
    return record;
  },

  async updateScheduledStatus(id: string, status: ScheduledWorkoutStatus, newDate?: string): Promise<void> {
    await db.scheduledWorkouts.update(id, {
      status,
      ...(newDate ? { date: newDate } : {}),
      updatedAt: new Date().toISOString(),
    });
  },

  // --- Live Workout Sessions & Sets ---
  async getInProgressSession(): Promise<WorkoutSession | undefined> {
    return db.workoutSessions.where('status').equals('in_progress').first();
  },

  async startSession(title: string, scheduledWorkoutId?: string): Promise<WorkoutSession> {
    const now = new Date().toISOString();
    const session: WorkoutSession = {
      id: generateId(),
      scheduledWorkoutId,
      title,
      date: todayISO(),
      startedAt: now,
      durationSeconds: 0,
      status: 'in_progress',
      totalVolumeKg: 0,
      totalSets: 0,
      exercisesCompleted: 0,
      personalRecordsCount: 0,
    };
    await db.workoutSessions.add(session);
    return session;
  },

  async getSessionSets(sessionId: string): Promise<ExerciseSet[]> {
    return db.exerciseSets.where('sessionId').equals(sessionId).sortBy('createdAt');
  },

  async getPreviousBestForExercise(exerciseId: string, excludeSessionId?: string): Promise<{
    maxWeightKg: number;
    bestSet?: ExerciseSet;
  }> {
    const sets = await db.exerciseSets
      .where('exerciseId')
      .equals(exerciseId)
      .filter((s) => s.completed && s.sessionId !== excludeSessionId)
      .toArray();

    if (sets.length === 0) return { maxWeightKg: 0 };
    let best = sets[0];
    for (const s of sets) {
      if (s.weightKg > best.weightKg || (s.weightKg === best.weightKg && s.reps > best.reps)) {
        best = s;
      }
    }
    return { maxWeightKg: best.weightKg, bestSet: best };
  },

  async saveSet(set: Omit<ExerciseSet, 'id' | 'createdAt' | 'isPR'> & { id?: string }): Promise<ExerciseSet> {
    const prev = await this.getPreviousBestForExercise(set.exerciseId, set.sessionId);
    const isPR = set.completed && set.weightKg > 0 && set.weightKg > prev.maxWeightKg;
    const record: ExerciseSet = {
      ...set,
      id: set.id ?? generateId(),
      isPR,
      createdAt: new Date().toISOString(),
    };
    await db.exerciseSets.put(record);
    if (set.completed) {
      await db.exerciseLibrary.update(set.exerciseId, { lastUsedAt: new Date().toISOString() });
    }
    return record;
  },

  async deleteSet(setId: string): Promise<void> {
    await db.exerciseSets.delete(setId);
  },

  async completeSession(sessionId: string, durationSeconds: number, notes?: string): Promise<WorkoutSession | undefined> {
    const session = await db.workoutSessions.get(sessionId);
    if (!session) return undefined;

    const sets = await this.getSessionSets(sessionId);
    const completedSets = sets.filter((s) => s.completed);
    const totalVolumeKg = completedSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
    const uniqueExercises = new Set(completedSets.map((s) => s.exerciseId));
    const prCount = completedSets.filter((s) => s.isPR).length;

    const updated: WorkoutSession = {
      ...session,
      endedAt: new Date().toISOString(),
      durationSeconds,
      status: 'completed',
      totalVolumeKg: Math.round(totalVolumeKg),
      totalSets: completedSets.length,
      exercisesCompleted: uniqueExercises.size,
      personalRecordsCount: prCount,
      notes,
    };

    await db.transaction('rw', [db.workoutSessions, db.scheduledWorkouts], async () => {
      await db.workoutSessions.put(updated);
      if (session.scheduledWorkoutId) {
        await db.scheduledWorkouts.update(session.scheduledWorkoutId, {
          status: 'completed',
          sessionId: session.id,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return updated;
  },

  async getCompletedSessions(limit = 50): Promise<WorkoutSession[]> {
    const all = await db.workoutSessions.where('status').equals('completed').reverse().sortBy('startedAt');
    return all.slice(0, limit);
  },
};

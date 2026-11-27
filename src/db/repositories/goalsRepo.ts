import { db } from '../database';
import type { ActivityLog, DailyGoal, GoalCompletion } from '../types';
import { generateId } from '@/lib/utils';

export const goalsRepo = {
  async getActiveGoals(): Promise<DailyGoal[]> {
    return db.dailyGoals.filter((g) => g.isActive).toArray();
  },

  async addGoal(goal: Omit<DailyGoal, 'id' | 'createdAt'>): Promise<DailyGoal> {
    const record: DailyGoal = {
      ...goal,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await db.dailyGoals.add(record);
    return record;
  },

  async deleteGoal(id: string): Promise<void> {
    await db.dailyGoals.delete(id);
  },

  async getCompletionsForDate(date: string): Promise<GoalCompletion[]> {
    return db.goalCompletions.where('date').equals(date).toArray();
  },

  async toggleGoalCompletion(goalId: string, date: string, completed: boolean, valueLogged?: number): Promise<void> {
    const existing = await db.goalCompletions.where('[goalId+date]').equals([goalId, date]).first();
    const now = new Date().toISOString();
    if (existing) {
      await db.goalCompletions.update(existing.id, { completed, valueLogged, updatedAt: now });
    } else {
      await db.goalCompletions.add({
        id: generateId(),
        goalId,
        date,
        completed,
        valueLogged,
        updatedAt: now,
      });
    }
  },

  async getActivityLogsByDate(date: string): Promise<ActivityLog[]> {
    return db.activityLogs.where('date').equals(date).toArray();
  },

  async getActivityLogsRange(startDate: string, endDate: string): Promise<ActivityLog[]> {
    return db.activityLogs.where('date').between(startDate, endDate, true, true).toArray();
  },

  async addActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    const record: ActivityLog = {
      ...log,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await db.activityLogs.add(record);
    return record;
  },

  async deleteActivityLog(id: string): Promise<void> {
    await db.activityLogs.delete(id);
  },
};

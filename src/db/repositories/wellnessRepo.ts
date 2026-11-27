import { db } from '../database';
import type { ProgressPhoto, RecoveryLog, SleepLog } from '../types';
import { generateId } from '@/lib/utils';

export const wellnessRepo = {
  async getRecoveryByDate(date: string): Promise<RecoveryLog | undefined> {
    return db.recoveryLogs.where('date').equals(date).first();
  },

  async saveRecovery(log: Omit<RecoveryLog, 'id' | 'updatedAt'>): Promise<RecoveryLog> {
    const existing = await this.getRecoveryByDate(log.date);
    const now = new Date().toISOString();
    const record: RecoveryLog = {
      ...log,
      id: existing?.id ?? generateId(),
      updatedAt: now,
    };
    await db.recoveryLogs.put(record);
    return record;
  },

  async addWaterMl(date: string, amountMl: number): Promise<RecoveryLog> {
    const existing = await this.getRecoveryByDate(date);
    const now = new Date().toISOString();
    const record: RecoveryLog = {
      id: existing?.id ?? generateId(),
      date,
      waterMl: Math.max(0, (existing?.waterMl ?? 0) + amountMl),
      soreness: existing?.soreness ?? 2,
      energy: existing?.energy ?? 3,
      fatigue: existing?.fatigue ?? 2,
      isRecoveryDay: existing?.isRecoveryDay ?? false,
      moodNote: existing?.moodNote,
      updatedAt: now,
    };
    await db.recoveryLogs.put(record);
    return record;
  },

  async getSleepByDate(date: string): Promise<SleepLog | undefined> {
    return db.sleepLogs.where('date').equals(date).first();
  },

  async saveSleep(log: Omit<SleepLog, 'id' | 'createdAt'>): Promise<SleepLog> {
    const existing = await this.getSleepByDate(log.date);
    const record: SleepLog = {
      ...log,
      id: existing?.id ?? generateId(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    await db.sleepLogs.put(record);
    return record;
  },

  async getRecentSleepLogs(limit = 14): Promise<SleepLog[]> {
    return db.sleepLogs.orderBy('date').reverse().limit(limit).toArray();
  },

  async getProgressPhotos(): Promise<ProgressPhoto[]> {
    return db.progressPhotos.orderBy('date').reverse().toArray();
  },

  async addProgressPhoto(photo: Omit<ProgressPhoto, 'id' | 'createdAt'>): Promise<ProgressPhoto> {
    const record: ProgressPhoto = {
      ...photo,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await db.progressPhotos.add(record);
    return record;
  },

  async deleteProgressPhoto(id: string): Promise<void> {
    await db.progressPhotos.delete(id);
  },
};

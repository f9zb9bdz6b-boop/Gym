import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/database';
import { ensureDatabaseSeeded } from '@/db/seed';
import { profileRepo } from '@/db/repositories/profileRepo';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { nutritionRepo } from '@/db/repositories/nutritionRepo';
import { backupRepo } from '@/db/repositories/backupRepo';

describe('IndexedDB Repositories & Backup', () => {
  beforeEach(async () => {
    await backupRepo.clearAllUserData();
    await ensureDatabaseSeeded();
  });

  it('saves profile, records initial body metric, and computes nutrition targets', async () => {
    await profileRepo.saveProfile({
      name: 'Test User',
      age: 26,
      gender: 'male',
      heightCm: 178,
      currentWeightKg: 76,
      targetWeightKg: 80,
      activityLevel: 'moderate',
      experience: 'intermediate',
      objective: 'muscle_gain',
      workoutFrequencyPerWeek: 4,
      availableEquipment: ['Barbell'],
      onboardingCompleted: true,
    });

    const profile = await profileRepo.getProfile();
    expect(profile?.name).toBe('Test User');

    const metrics = await profileRepo.getBodyMetrics();
    expect(metrics.length).toBe(1);
    expect(metrics[0].weightKg).toBe(76);

    const targets = await profileRepo.getNutritionTargets();
    expect(targets?.caloriesTarget).toBeGreaterThan(2500);
  });

  it('records workout sets, calculates volume, and detects PRs', async () => {
    const session = await workoutRepo.startSession('Push Day');
    await workoutRepo.saveSet({
      sessionId: session.id,
      exerciseId: 'ex-bench-press',
      exerciseName: 'Barbell Bench Press',
      setNumber: 1,
      weightKg: 60,
      reps: 8,
      completed: true,
    });
    await workoutRepo.saveSet({
      sessionId: session.id,
      exerciseId: 'ex-bench-press',
      exerciseName: 'Barbell Bench Press',
      setNumber: 2,
      weightKg: 65,
      reps: 8,
      completed: true,
    });

    const completed = await workoutRepo.completeSession(session.id, 1800);
    expect(completed?.totalVolumeKg).toBe(60 * 8 + 65 * 8);
    expect(completed?.totalSets).toBe(2);
    expect(completed?.personalRecordsCount).toBe(2);
  });

  it('logs food and exports/imports valid JSON backup', async () => {
    await nutritionRepo.addFoodLog({
      date: '2026-11-27',
      mealCategory: 'Breakfast',
      foodName: 'Whole Egg',
      servings: 2,
      servingLabel: '2 large',
      calories: 156,
      proteinG: 12.6,
      carbsG: 1.2,
      fatG: 10.6,
      source: 'verified',
    });

    const exported = await backupRepo.exportAllData();
    const validation = backupRepo.validateBackup(exported);
    expect(validation.valid).toBe(true);

    await db.foodLogs.clear();
    expect(await db.foodLogs.count()).toBe(0);

    if (validation.valid) {
      await backupRepo.importBackup(validation.data, 'replace');
      expect(await db.foodLogs.count()).toBe(1);
    }
  });
});

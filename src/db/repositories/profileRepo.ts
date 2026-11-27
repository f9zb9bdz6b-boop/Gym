import { db } from '../database';
import type { BodyMetric, NutritionTarget, UserProfile } from '../types';
import {
  calculateBMR,
  calculateDailyCalorieTarget,
  calculateHydrationMl,
  calculateMacroTargets,
  calculateTDEE,
} from '@/lib/calculators';
import { generateId, todayISO } from '@/lib/utils';

export const profileRepo = {
  async getProfile(): Promise<UserProfile | undefined> {
    return db.userProfile.get('primary');
  },

  async saveProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const existing = await db.userProfile.get('primary');
    const now = new Date().toISOString();
    const record: UserProfile = {
      ...profile,
      id: 'primary',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await db.transaction('rw', [db.userProfile, db.bodyMetrics, db.nutritionTargets], async () => {
      await db.userProfile.put(record);

      // Record historical body metric if weight changed or first time
      if (!existing || existing.currentWeightKg !== record.currentWeightKg) {
        await db.bodyMetrics.add({
          id: generateId(),
          date: todayISO(),
          weightKg: record.currentWeightKg,
          bodyFatPercent: record.bodyFatPercent,
          notes: existing ? 'Updated from profile' : 'Initial onboarding weight',
          createdAt: now,
        });
      }

      // Recalculate nutrition targets only if not manually customized
      const currentTargets = await db.nutritionTargets.get('active');
      if (!currentTargets || !currentTargets.isManuallyCustomized) {
        const bmr = calculateBMR(record.currentWeightKg, record.heightCm, record.age, record.gender);
        const tdee = calculateTDEE(bmr, record.activityLevel);
        const cal = calculateDailyCalorieTarget(tdee, record.objective);
        const macros = calculateMacroTargets(record.currentWeightKg, cal.calories, record.objective);
        const waterTargetMl = calculateHydrationMl(record.currentWeightKg);

        await db.nutritionTargets.put({
          id: 'active',
          caloriesTarget: cal.calories,
          proteinTargetG: macros.proteinG,
          carbsTargetG: macros.carbsG,
          fatTargetG: macros.fatG,
          waterTargetMl,
          isManuallyCustomized: false,
          bmr,
          tdee,
          formulaNote: `Mifflin-St Jeor BMR (${bmr}) × ${record.activityLevel} TDEE (${tdee}). ${cal.explanation}`,
          updatedAt: now,
        });
      }
    });

    return record;
  },

  async getBodyMetrics(): Promise<BodyMetric[]> {
    return db.bodyMetrics.orderBy('date').toArray();
  },

  async addBodyMetric(metric: Omit<BodyMetric, 'id' | 'createdAt'>): Promise<BodyMetric> {
    const now = new Date().toISOString();
    const record: BodyMetric = { ...metric, id: generateId(), createdAt: now };
    await db.transaction('rw', [db.bodyMetrics, db.userProfile], async () => {
      await db.bodyMetrics.add(record);
      const profile = await db.userProfile.get('primary');
      if (profile) {
        await db.userProfile.update('primary', {
          currentWeightKg: record.weightKg,
          bodyFatPercent: record.bodyFatPercent ?? profile.bodyFatPercent,
          updatedAt: now,
        });
      }
    });
    return record;
  },

  async getNutritionTargets(): Promise<NutritionTarget | undefined> {
    return db.nutritionTargets.get('active');
  },

  async saveNutritionTargets(targets: Partial<NutritionTarget> & { isManuallyCustomized: boolean }): Promise<void> {
    const existing = await db.nutritionTargets.get('active');
    const now = new Date().toISOString();
    if (!existing) return;
    await db.nutritionTargets.put({
      ...existing,
      ...targets,
      id: 'active',
      updatedAt: now,
    });
  },
};

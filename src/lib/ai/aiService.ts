import { db } from '@/db/database';
import type { FoodLog, MealCategory } from '@/db/types';
import { todayISO, daysAgoISO } from '@/lib/utils';
import { callGeminiAPI } from './geminiClient';
import { runLocalDeterministicAI, type AIResponse } from './localEngine';

export interface UnifiedAIResult extends AIResponse {
  providerUsed: string;
  modelUsed?: string;
  fallbackNotice?: string;
}

async function buildFitnessContextSummary(): Promise<string> {
  const today = todayISO();
  const weekAgo = daysAgoISO(7);

  const [profile, targets, todayFoods, activePlan, recentSessions, todayRecovery, todaySleep, recentMetrics] =
    await Promise.all([
      db.userProfile.get('primary'),
      db.nutritionTargets.get('active'),
      db.foodLogs.where('date').equals(today).toArray(),
      db.workoutPlans.filter((p) => p.isActive).first(),
      db.workoutSessions.where('status').equals('completed').filter((s) => s.date >= weekAgo).toArray(),
      db.recoveryLogs.where('date').equals(today).first(),
      db.sleepLogs.where('date').equals(today).first(),
      db.bodyMetrics.orderBy('date').reverse().limit(5).toArray(),
    ]);

  const consumedCal = Math.round(todayFoods.reduce((s, f) => s + f.calories, 0));
  const consumedProt = Math.round(todayFoods.reduce((s, f) => s + f.proteinG, 0));
  const consumedCarbs = Math.round(todayFoods.reduce((s, f) => s + f.carbsG, 0));
  const consumedFat = Math.round(todayFoods.reduce((s, f) => s + f.fatG, 0));

  return JSON.stringify({
    date: today,
    profile: profile
      ? {
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          heightCm: profile.heightCm,
          currentWeightKg: profile.currentWeightKg,
          targetWeightKg: profile.targetWeightKg,
          objective: profile.objective,
          activityLevel: profile.activityLevel,
          experience: profile.experience,
          workoutFrequencyPerWeek: profile.workoutFrequencyPerWeek,
          availableEquipment: profile.availableEquipment,
        }
      : null,
    nutritionTargets: targets
      ? {
          caloriesTarget: targets.caloriesTarget,
          proteinTargetG: targets.proteinTargetG,
          carbsTargetG: targets.carbsTargetG,
          fatTargetG: targets.fatTargetG,
          waterTargetMl: targets.waterTargetMl,
        }
      : null,
    todayNutrition: {
      consumedCal,
      consumedProt,
      consumedCarbs,
      consumedFat,
      entriesCount: todayFoods.length,
    },
    activeWorkoutPlan: activePlan
      ? {
          name: activePlan.name,
          splitType: activePlan.splitType,
          days: activePlan.days.map((d) => ({
            dayName: d.dayName,
            exercises: d.exercises.map((e) => `${e.exerciseName} (${e.targetSets}x${e.targetReps})`),
          })),
        }
      : null,
    last7DaysWorkouts: recentSessions.map((s) => ({
      date: s.date,
      title: s.title,
      volumeKg: s.totalVolumeKg,
      sets: s.totalSets,
      prs: s.personalRecordsCount,
    })),
    recentWeights: recentMetrics.map((m) => ({ date: m.date, weightKg: m.weightKg })),
    todayRecovery: todayRecovery ?? null,
    todaySleep: todaySleep ?? null,
  });
}

function tryExtractProposedFoodLogs(text: string): {
  cleanText: string;
  proposedFoodLogs?: Omit<FoodLog, 'id' | 'createdAt'>[];
} {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (!jsonMatch) return { cleanText: text };

  try {
    const parsed = JSON.parse(jsonMatch[1]) as {
      proposedFoodLogs?: Array<{
        mealCategory?: MealCategory;
        foodName: string;
        servings?: number;
        servingLabel?: string;
        calories: number;
        proteinG: number;
        carbsG: number;
        fatG: number;
      }>;
    };
    if (!Array.isArray(parsed.proposedFoodLogs) || parsed.proposedFoodLogs.length === 0) {
      return { cleanText: text };
    }
    const today = todayISO();
    const validLogs: Omit<FoodLog, 'id' | 'createdAt'>[] = parsed.proposedFoodLogs.map((item) => ({
      date: today,
      mealCategory: item.mealCategory ?? 'Snacks',
      foodName: item.foodName,
      servings: item.servings ?? 1,
      servingLabel: item.servingLabel ?? '1 serving',
      calories: Math.round(Number(item.calories) || 0),
      proteinG: Number((Number(item.proteinG) || 0).toFixed(1)),
      carbsG: Number((Number(item.carbsG) || 0).toFixed(1)),
      fatG: Number((Number(item.fatG) || 0).toFixed(1)),
      source: 'estimated',
    }));
    const cleanText = text.replace(jsonMatch[0], '').trim();
    return { cleanText: cleanText || 'Please review and confirm the proposed food entries below:', proposedFoodLogs: validLogs };
  } catch {
    return { cleanText: text };
  }
}

export async function askFitnessAI(prompt: string, contextHint?: string): Promise<UnifiedAIResult> {
  const settings = await db.appSettings.get('settings');
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (
    settings?.aiProvider === 'gemini' &&
    settings.aiConsentGranted &&
    settings.geminiApiKey &&
    isOnline
  ) {
    try {
      const contextJson = await buildFitnessContextSummary();
      const systemPrompt = [
        'You are GYM APP AI, a concise, evidence-based personal fitness, workout, nutrition, and recovery coach.',
        'You have access to the user’s local fitness records (JSON below). Never invent records that are not in the data.',
        'Do not present the app as a medical diagnostic tool.',
        'If the user asks to log a meal or food, ALWAYS include a ```json block with {"proposedFoodLogs": [{"mealCategory": "Breakfast"|"Lunch"|"Dinner"|"Snacks"|"Pre-workout"|"Post-workout", "foodName": string, "servings": number, "servingLabel": string, "calories": number, "proteinG": number, "carbsG": number, "fatG": number}]} so the user can confirm before saving.',
        contextHint ? `Current UI Context: ${contextHint}` : '',
        `User Fitness Context:\n${contextJson}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const modelId = settings.aiModel || 'gemini-2.5-flash';
      const rawReply = await callGeminiAPI({
        apiKey: settings.geminiApiKey,
        model: modelId,
        systemPrompt,
        userPrompt: prompt,
      });

      const { cleanText, proposedFoodLogs } = tryExtractProposedFoodLogs(rawReply);
      return {
        content: cleanText,
        proposedFoodLogs,
        providerUsed: 'Google Gemini',
        modelUsed: modelId,
      };
    } catch (err) {
      const localRes = await runLocalDeterministicAI(prompt);
      const errMsg = err instanceof Error ? err.message : 'Gemini request failed';
      return {
        ...localRes,
        providerUsed: 'Local Offline (Fallback)',
        fallbackNotice: `Gemini API unavailable (${errMsg}). Used local offline engine instead.`,
      };
    }
  }

  const localRes = await runLocalDeterministicAI(prompt);
  return {
    ...localRes,
    providerUsed: 'Local Deterministic (Offline)',
  };
}

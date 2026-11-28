import type { ActivityLevel, FitnessObjective, Gender } from '@/db/types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { factor: number; label: string; description: string }> = {
  sedentary: { factor: 1.2, label: 'Sedentary', description: 'Desk job, little or no formal exercise' },
  light: { factor: 1.375, label: 'Lightly Active', description: 'Light exercise 1–3 days/week' },
  moderate: { factor: 1.55, label: 'Moderately Active', description: 'Moderate exercise 3–5 days/week' },
  active: { factor: 1.725, label: 'Very Active', description: 'Hard training 6–7 days/week' },
  very_active: { factor: 1.9, label: 'Extra Active', description: 'Physical job + intense daily training' },
};

/**
 * Mifflin-St Jeor Equation for Basal Metabolic Rate (BMR).
 * Assumptions: Standard body composition; does not directly account for lean mass differences.
 * Male: (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
 * Female: (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161
 * Other: Average of male and female constants (-78)
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') return Math.round(base + 5);
  if (gender === 'female') return Math.round(base - 161);
  return Math.round(base - 78);
}

/**
 * Total Daily Energy Expenditure (TDEE) = BMR * Activity Multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel, customMultiplier?: number): number {
  const factor = customMultiplier ?? ACTIVITY_MULTIPLIERS[activityLevel].factor;
  return Math.round(bmr * factor);
}

/**
 * Daily Calorie Requirement based on fitness objective.
 */
export function calculateDailyCalorieTarget(tdee: number, objective: FitnessObjective): {
  calories: number;
  adjustment: number;
  explanation: string;
} {
  switch (objective) {
    case 'muscle_gain':
      return {
        calories: Math.round(tdee + 300),
        adjustment: 300,
        explanation: 'Moderate +300 kcal surplus above TDEE to support lean muscle hypertrophy while minimizing fat gain.',
      };
    case 'fat_loss':
      return {
        calories: Math.max(1200, Math.round(tdee - 500)),
        adjustment: -500,
        explanation: 'Standard -500 kcal deficit below TDEE (~0.45 kg/week estimated fat loss).',
      };
    case 'recomposition':
      return {
        calories: Math.round(tdee - 150),
        adjustment: -150,
        explanation: 'Slight -150 kcal deficit with high protein to support simultaneous fat loss and muscle retention.',
      };
    case 'strength':
      return {
        calories: Math.round(tdee + 200),
        adjustment: 200,
        explanation: 'Mild +200 kcal surplus to fuel neural recovery and progressive strength overload.',
      };
    case 'maintenance':
    case 'general_fitness':
    default:
      return {
        calories: Math.round(tdee),
        adjustment: 0,
        explanation: 'Maintenance calories matching estimated TDEE.',
      };
  }
}

/**
 * Macro targets (Protein, Fat, Carbs) based on body weight and calorie target.
 */
export function calculateMacroTargets(
  weightKg: number,
  calorieTarget: number,
  objective: FitnessObjective
): {
  proteinG: number;
  fatG: number;
  carbsG: number;
} {
  const proteinPerKg =
    objective === 'fat_loss' || objective === 'recomposition'
      ? 2.0
      : objective === 'muscle_gain' || objective === 'strength'
      ? 1.8
      : 1.6;

  const proteinG = Math.round(weightKg * proteinPerKg);
  const proteinCalories = proteinG * 4;

  // Fat ~25% of total calories (minimum 0.7g/kg for hormonal health)
  const fatFromPercent = Math.round((calorieTarget * 0.25) / 9);
  const minFat = Math.round(weightKg * 0.7);
  const fatG = Math.max(minFat, fatFromPercent);
  const fatCalories = fatG * 9;

  // Remaining calories allocated to carbohydrates
  const remainingCalories = Math.max(0, calorieTarget - proteinCalories - fatCalories);
  const carbsG = Math.round(remainingCalories / 4);

  return { proteinG, fatG, carbsG };
}

/**
 * Body Mass Index (BMI) = weightKg / (heightM ^ 2)
 */
export function calculateBMI(weightKg: number, heightCm: number): {
  bmi: number;
  category: string;
} {
  const heightM = heightCm / 100;
  if (heightM <= 0) return { bmi: 0, category: 'Unknown' };
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
  let category = 'Normal weight';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';
  return { bmi, category };
}

/**
 * Hydration estimate in ml: ~35 ml per kg body weight + extra for active training.
 */
export function calculateHydrationMl(weightKg: number, activeMinutesPerDay = 45): number {
  const base = weightKg * 35;
  const activityBonus = (activeMinutesPerDay / 30) * 350;
  return Math.round((base + activityBonus) / 50) * 50;
}

/**
 * Weight progression estimate: ~7700 kcal per kg of body tissue change.
 */
export function calculateWeightProgression(
  currentWeightKg: number,
  targetWeightKg: number,
  dailyCalorieDelta: number
): {
  weeklyChangeKg: number;
  estimatedWeeks: number | null;
} {
  const weeklyDeltaKcal = dailyCalorieDelta * 7;
  const weeklyChangeKg = Number((weeklyDeltaKcal / 7700).toFixed(2));
  const diffKg = targetWeightKg - currentWeightKg;

  if (Math.abs(weeklyChangeKg) < 0.05 || Math.sign(diffKg) !== Math.sign(weeklyChangeKg)) {
    return { weeklyChangeKg, estimatedWeeks: null };
  }
  const estimatedWeeks = Math.ceil(Math.abs(diffKg / weeklyChangeKg));
  return { weeklyChangeKg, estimatedWeeks };
}

/**
 * Estimates realistic calories burned for a single resistance training set
 * based on weight lifted, repetitions performed, and base exercise intensity.
 */
export function estimateSetCaloriesBurned(params: {
  weightKg: number;
  reps: number;
  baseCalPerSet?: number;
  bodyWeightKg?: number;
}): number {
  const { weightKg, reps, baseCalPerSet = 6, bodyWeightKg = 70 } = params;
  const safeReps = Math.max(1, reps);
  const safeWeight = Math.max(0, weightKg);
  const volumeFactor = safeWeight * safeReps * 0.014;
  const repEffort = safeReps * 0.35;
  const bwFactor = bodyWeightKg / 70;
  return Number(((baseCalPerSet * 0.4 + volumeFactor + repEffort) * bwFactor).toFixed(1));
}

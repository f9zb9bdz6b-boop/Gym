import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalorieTarget,
  calculateMacroTargets,
  calculateBMI,
  calculateHydrationMl,
  calculateWeightProgression,
} from '@/lib/calculators';

describe('Fitness Calculators', () => {
  it('calculates Mifflin-St Jeor BMR accurately', () => {
    // Male: 10*75 + 6.25*175 - 5*25 + 5 = 750 + 1093.75 - 125 + 5 = 1723.75 -> 1724
    expect(calculateBMR(75, 175, 25, 'male')).toBe(1724);
    // Female: 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345
    expect(calculateBMR(60, 165, 25, 'female')).toBe(1345);
  });

  it('calculates TDEE and objective calorie targets', () => {
    const tdee = calculateTDEE(1724, 'moderate'); // 1724 * 1.55 = 2672
    expect(tdee).toBe(2672);

    const bulk = calculateDailyCalorieTarget(tdee, 'muscle_gain');
    expect(bulk.calories).toBe(2972);

    const cut = calculateDailyCalorieTarget(tdee, 'fat_loss');
    expect(cut.calories).toBe(2172);
  });

  it('calculates macro targets', () => {
    const macros = calculateMacroTargets(75, 2500, 'muscle_gain');
    expect(macros.proteinG).toBe(135); // 75 * 1.8
    expect(macros.fatG).toBeGreaterThan(50);
    expect(macros.carbsG).toBeGreaterThan(200);
  });

  it('calculates BMI and category', () => {
    const res = calculateBMI(75, 175);
    expect(res.bmi).toBe(24.5);
    expect(res.category).toBe('Normal weight');
  });

  it('calculates hydration and weight progression', () => {
    expect(calculateHydrationMl(75, 45)).toBe(3150);
    const prog = calculateWeightProgression(75, 78, 300);
    expect(prog.weeklyChangeKg).toBeCloseTo(0.27, 2);
    expect(prog.estimatedWeeks).toBe(12);
  });
});

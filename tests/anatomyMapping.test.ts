import { describe, expect, it } from 'vitest';
import { resolveExerciseAnatomy } from '@/features/anatomy/utils/muscleResolver';
import type { ExerciseLibraryItem, MuscleGroup } from '@/db/types';

function makeEx(primaryMuscle: MuscleGroup, secondaryMuscles: MuscleGroup[] = []): ExerciseLibraryItem {
  return {
    id: `test-${primaryMuscle}`,
    name: `Test ${primaryMuscle}`,
    primaryMuscle,
    secondaryMuscles,
    equipment: 'Barbell',
    difficulty: 'intermediate',
    category: 'strength',
    instructions: [],
    formGuidance: '',
    commonMistakes: [],
    isFavorite: false,
    isCustom: false,
    createdAt: new Date().toISOString(),
  };
}

describe('resolveExerciseAnatomy', () => {
  const regions: MuscleGroup[] = [
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Forearms',
    'Quadriceps',
    'Hamstrings',
    'Glutes',
    'Calves',
    'Abdominals',
    'Obliques',
    'Adductors',
    'Abductors',
    'Spinal Stability',
  ];

  it.each(regions)('maps %s to valid open-anatomy-3d catalog keys', (region) => {
    const res = resolveExerciseAnatomy(makeEx(region));
    expect(res.primaryKeys.size).toBeGreaterThan(0);
    expect(res.unmappedMuscles).toHaveLength(0);
  });

  it('keeps primary and secondary keys distinct without overwriting primary', () => {
    const res = resolveExerciseAnatomy(makeEx('Chest', ['Shoulders', 'Triceps']));
    expect(res.primaryKeys.has('chest_muscles_l')).toBe(true);
    expect(res.secondaryKeys.has('deltoid_l')).toBe(true);
    expect(res.secondaryKeys.has('upper_arm_muscles_l')).toBe(true);
    expect(res.secondaryKeys.has('chest_muscles_l')).toBe(false);
  });

  it('does not falsely map unknown muscle names', () => {
    const ex = makeEx('Chest');
    ex.primaryMuscles = ['Nonexistent Muscle XYZ'];
    const res = resolveExerciseAnatomy(ex);
    expect(res.primaryKeys.size).toBe(0);
    expect(res.unmappedMuscles).toEqual(['Nonexistent Muscle XYZ']);
  });
});

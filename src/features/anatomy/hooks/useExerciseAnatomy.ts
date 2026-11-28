import { useMemo } from 'react';
import type { ExerciseLibraryItem } from '@/db/types';
import { resolveExerciseAnatomy } from '../utils/muscleResolver';

export function useExerciseAnatomy(exercise: ExerciseLibraryItem) {
  return useMemo(() => resolveExerciseAnatomy(exercise), [exercise]);
}

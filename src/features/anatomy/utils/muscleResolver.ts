import { ANATOMY_BY_KEY, type AnatomyStructure } from 'open-anatomy-3d';
import type { ExerciseLibraryItem } from '@/db/types';
import { MUSCLE_ALIASES, type MuscleAliasEntry } from '../data/muscleAliases';

export interface ResolvedMuscleItem {
  /** Original muscle label from the exercise database */
  sourceLabel: string;
  role: 'primary' | 'secondary';
  /** Matching open-anatomy-3d keys, empty if not modeled */
  catalogKeys: string[];
  availableInModel: boolean;
  region: string;
  functionSummary: string;
  modelCoverageNote?: string;
}

export interface ExerciseAnatomyMapping {
  primaryKeys: Set<string>;
  secondaryKeys: Set<string>;
  resolvedItems: ResolvedMuscleItem[];
  unmappedMuscles: string[];
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function lookupAlias(rawName: string): MuscleAliasEntry | null {
  const norm = normalizeName(rawName);
  if (MUSCLE_ALIASES[norm]) return MUSCLE_ALIASES[norm];

  // Try stripping parenthetical notes like "Pectoralis Major (Sternal)"
  const stripped = norm.replace(/\([^)]*\)/g, '').trim();
  if (MUSCLE_ALIASES[stripped]) return MUSCLE_ALIASES[stripped];

  // Try matching known alias keys by containment
  for (const [aliasKey, entry] of Object.entries(MUSCLE_ALIASES)) {
    if (norm.includes(aliasKey) || aliasKey.includes(stripped)) {
      return entry;
    }
  }
  return null;
}

export function resolveExerciseAnatomy(exercise: ExerciseLibraryItem): ExerciseAnatomyMapping {
  const primaryLabels =
    exercise.primaryMuscles && exercise.primaryMuscles.length > 0
      ? exercise.primaryMuscles
      : [exercise.primaryMuscle];

  const secondaryLabels =
    exercise.secondaryMuscleLabels && exercise.secondaryMuscleLabels.length > 0
      ? exercise.secondaryMuscleLabels
      : exercise.secondaryMuscles || [];

  const primaryKeys = new Set<string>();
  const secondaryKeys = new Set<string>();
  const resolvedItems: ResolvedMuscleItem[] = [];
  const unmappedMuscles: string[] = [];

  const processList = (labels: string[], role: 'primary' | 'secondary') => {
    for (const label of labels) {
      if (!label) continue;
      const alias = lookupAlias(label);
      if (!alias) {
        unmappedMuscles.push(label);
        resolvedItems.push({
          sourceLabel: label,
          role,
          catalogKeys: [],
          availableInModel: false,
          region: 'Unmapped',
          functionSummary: 'Not individually modeled in the current 3D anatomical catalog.',
        });
        continue;
      }

      const validKeys = alias.catalogKeys.filter((k) => Boolean(ANATOMY_BY_KEY[k]));
      for (const k of validKeys) {
        if (role === 'primary') {
          primaryKeys.add(k);
          secondaryKeys.delete(k); // primary wins if both map to the same group
        } else if (!primaryKeys.has(k)) {
          secondaryKeys.add(k);
        }
      }

      resolvedItems.push({
        sourceLabel: label,
        role,
        catalogKeys: validKeys,
        availableInModel: validKeys.length > 0,
        region: alias.region,
        functionSummary: alias.functionSummary,
        modelCoverageNote: alias.modelCoverageNote,
      });
    }
  };

  processList(primaryLabels, 'primary');
  processList(secondaryLabels, 'secondary');

  return {
    primaryKeys,
    secondaryKeys,
    resolvedItems,
    unmappedMuscles,
  };
}

export function getStructureInfo(key: string): AnatomyStructure | undefined {
  return ANATOMY_BY_KEY[key];
}

import { db } from './database';
import type { ExerciseCategory, ExerciseDifficulty, ExerciseLibraryItem, MuscleGroup } from './types';

export interface CatalogExerciseRaw {
  id: string;
  name: string;
  body_region: string;
  subregion?: string;
  equipment: string[];
  exercise_type: string;
  difficulty: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  muscle_targeting_notes?: string;
  instructions: string[];
  common_mistakes: string[];
  safety_cautions?: string[];
  availability?: { home: boolean; gym: boolean };
  tags?: string[];
  calorie_estimation?: {
    model_id: string;
    method: string;
    met_assumption: {
      source_status: 'to_be_configured' | 'configured';
      value: number | null;
      selection_guidance?: string;
    };
    caveats: string[];
  };
  images?: {
    demonstration?: { asset_id: string | null; uri: string | null; status: string; license_status: string };
    muscle_anatomy?: { asset_id: string | null; uri: string | null; status: string; license_status: string };
  };
}

export interface ExerciseCatalogRaw {
  schema_version: string;
  catalog_id: string;
  body_region: string;
  exercise_count: number;
  exercises: CatalogExerciseRaw[];
}

function mapRegionToMuscleGroup(region: string): MuscleGroup {
  const r = region.toLowerCase();
  if (r.includes('chest') || r.includes('pectoralis')) return 'Chest';
  if (r.includes('back') || r.includes('lat')) return 'Back';
  if (r.includes('shoulder') || r.includes('deltoid')) return 'Shoulders';
  if (r.includes('bicep')) return 'Biceps';
  if (r.includes('tricep')) return 'Triceps';
  if (r.includes('forearm')) return 'Forearms';
  if (r.includes('quad')) return 'Quadriceps';
  if (r.includes('hamstring')) return 'Hamstrings';
  if (r.includes('glute')) return 'Glutes';
  if (r.includes('calv')) return 'Calves';
  if (r.includes('abs')) return 'Abs';
  return 'Core';
}

function mapSecondaryMuscles(labels: string[]): MuscleGroup[] {
  const mapped = new Set<MuscleGroup>();
  for (const label of labels) {
    const l = label.toLowerCase();
    if (l.includes('deltoid') || l.includes('shoulder')) mapped.add('Shoulders');
    else if (l.includes('tricep')) mapped.add('Triceps');
    else if (l.includes('bicep')) mapped.add('Biceps');
    else if (l.includes('pectoralis')) mapped.add('Chest');
    else if (l.includes('core') || l.includes('abdom')) mapped.add('Core');
  }
  return Array.from(mapped);
}

export async function importExerciseCatalog(catalog: ExerciseCatalogRaw): Promise<{ imported: number; skipped: number }> {
  if (catalog.exercise_count !== catalog.exercises.length) {
    throw new Error(`Catalog ${catalog.catalog_id} count mismatch: expected ${catalog.exercise_count}, got ${catalog.exercises.length}`);
  }

  const existingIds = new Set(await db.exerciseLibrary.toCollection().primaryKeys());
  const now = new Date().toISOString();
  const toInsert: ExerciseLibraryItem[] = [];

  for (const raw of catalog.exercises) {
    if (existingIds.has(raw.id)) continue;

    toInsert.push({
      id: raw.id,
      name: raw.name,
      bodyRegion: raw.body_region,
      subregion: raw.subregion,
      primaryMuscle: mapRegionToMuscleGroup(raw.body_region),
      primaryMuscles: raw.primary_muscles,
      secondaryMuscles: mapSecondaryMuscles(raw.secondary_muscles),
      secondaryMuscleLabels: raw.secondary_muscles,
      muscleTargetingNotes: raw.muscle_targeting_notes,
      equipment: raw.equipment.join(', '),
      difficulty: (raw.difficulty as ExerciseDifficulty) || 'intermediate',
      category: (raw.exercise_type as ExerciseCategory) || 'compound',
      instructions: raw.instructions,
      formGuidance: raw.muscle_targeting_notes ?? '',
      commonMistakes: raw.common_mistakes,
      safetyCautions: raw.safety_cautions,
      availability: raw.availability,
      tags: raw.tags,
      calorieEstimation: raw.calorie_estimation
        ? {
            modelId: raw.calorie_estimation.model_id,
            method: raw.calorie_estimation.method,
            metAssumption: {
              sourceStatus: raw.calorie_estimation.met_assumption.source_status,
              value: raw.calorie_estimation.met_assumption.value,
              selectionGuidance: raw.calorie_estimation.met_assumption.selection_guidance,
            },
            caveats: raw.calorie_estimation.caveats,
          }
        : undefined,
      images: {
        demonstration: {
          assetId: raw.images?.demonstration?.asset_id ?? null,
          uri: raw.images?.demonstration?.uri ?? null,
          status: 'placeholder',
          licenseStatus: raw.images?.demonstration?.license_status ?? 'not sourced',
        },
        muscleAnatomy: {
          assetId: raw.images?.muscle_anatomy?.asset_id ?? null,
          uri: raw.images?.muscle_anatomy?.uri ?? null,
          status: 'placeholder',
          licenseStatus: raw.images?.muscle_anatomy?.license_status ?? 'not sourced',
        },
      },
      isFavorite: false,
      isCustom: false,
      createdAt: now,
    });
  }

  if (toInsert.length > 0) {
    await db.exerciseLibrary.bulkPut(toInsert);
  }

  return { imported: toInsert.length, skipped: catalog.exercises.length - toInsert.length };
}

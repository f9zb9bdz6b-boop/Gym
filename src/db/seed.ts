import { db } from './database';
import { importExerciseCatalog, type ExerciseCatalogRaw } from './catalogImporter';
import chestCatalog from '@/data/catalogs/chest_exercises.json';
import backCatalog from '@/data/catalogs/back_exercises.json';
import shoulderCatalog from '@/data/catalogs/shoulder_exercises.json';
import armCatalog from '@/data/catalogs/arm_exercises.json';
import legCatalog from '@/data/catalogs/leg_exercises.json';
import absCoreCatalog from '@/data/catalogs/abs_core_exercises.json';
import type {
  DailyGoal,
  ExerciseLibraryItem,
  FoodItem,
  WorkoutPlan,
} from './types';

const now = new Date().toISOString();

export const SEED_EXERCISES: ExerciseLibraryItem[] = [
  {
    id: 'ex-bench-press',
    name: 'Barbell Bench Press',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: 'Barbell',
    difficulty: 'intermediate',
    category: 'compound',
    instructions: [
      'Lie flat on a bench with eyes under the bar.',
      'Grip the bar slightly wider than shoulder-width.',
      'Unrack, lower the bar under control to mid-chest.',
      'Press explosively back to lockout while keeping shoulder blades retracted.',
    ],
    formGuidance: 'Keep feet planted, slight arch in lower back, elbows at ~45 degrees.',
    commonMistakes: ['Flaring elbows to 90 degrees', 'Bouncing bar off chest', 'Lifting hips off bench'],
    mediaPlaceholder: 'Placeholder: Barbell Bench Press diagram',
    isFavorite: true,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-incline-db-press',
    name: 'Incline Dumbbell Press',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: 'Dumbbells',
    difficulty: 'beginner',
    category: 'hypertrophy',
    instructions: [
      'Set bench to 30–45 degrees incline.',
      'Press dumbbells up from shoulder level until arms are extended.',
      'Lower slowly to a deep stretch.',
    ],
    formGuidance: 'Control the eccentric for 2–3 seconds.',
    commonMistakes: ['Setting bench too steep (>45 deg)', 'Clanking dumbbells together at top'],
    mediaPlaceholder: 'Placeholder: Incline Dumbbell Press diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-pull-up',
    name: 'Pull-Up',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    equipment: 'Bodyweight',
    difficulty: 'intermediate',
    category: 'compound',
    instructions: [
      'Grip pull-up bar slightly wider than shoulders with palms facing away.',
      'Pull chest toward the bar by driving elbows down.',
      'Lower with control to full arm extension.',
    ],
    formGuidance: 'Engage lats before bending elbows; avoid kipping.',
    commonMistakes: ['Half reps', 'Shrugging shoulders up', 'Swinging legs'],
    mediaPlaceholder: 'Placeholder: Pull-Up diagram',
    isFavorite: true,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-barbell-row',
    name: 'Bent-Over Barbell Row',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps', 'Core'],
    equipment: 'Barbell',
    difficulty: 'intermediate',
    category: 'compound',
    instructions: [
      'Hinge at hips to ~45 degrees with a flat back.',
      'Pull barbell toward lower ribcage.',
      'Squeeze shoulder blades and lower under control.',
    ],
    formGuidance: 'Keep spine neutral and core braced throughout.',
    commonMistakes: ['Rounding lower back', 'Using excessive body momentum'],
    mediaPlaceholder: 'Placeholder: Barbell Row diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-overhead-press',
    name: 'Standing Overhead Press',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Core'],
    equipment: 'Barbell',
    difficulty: 'intermediate',
    category: 'compound',
    instructions: [
      'Hold barbell at collarbone height with grip just outside shoulders.',
      'Brace core and glutes, press bar straight overhead.',
      'Lock out overhead with biceps near ears, then lower.',
    ],
    formGuidance: 'Tuck chin slightly as bar passes face, then push head through.',
    commonMistakes: ['Overarching lower back', 'Pressing bar forward instead of straight up'],
    mediaPlaceholder: 'Placeholder: Overhead Press diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: [],
    equipment: 'Dumbbells',
    difficulty: 'beginner',
    category: 'isolation',
    instructions: [
      'Stand with dumbbells at sides, slight bend in elbows.',
      'Raise arms out to the sides until parallel to the floor.',
      'Lower slowly without swinging.',
    ],
    formGuidance: 'Lead with elbows; imagine pouring water from pitchers slightly.',
    commonMistakes: ['Using too much weight and swinging', 'Shrugging traps'],
    mediaPlaceholder: 'Placeholder: Lateral Raise diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-barbell-curl',
    name: 'Barbell Bicep Curl',
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Barbell',
    difficulty: 'beginner',
    category: 'isolation',
    instructions: [
      'Stand tall holding barbell with underhand grip.',
      'Curl weight up while keeping elbows pinned at sides.',
      'Squeeze biceps at top and lower slowly.',
    ],
    formGuidance: 'Avoid swinging torso.',
    commonMistakes: ['Moving elbows forward', 'Dropping weight too fast'],
    mediaPlaceholder: 'Placeholder: Barbell Curl diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-tricep-pushdown',
    name: 'Cable Tricep Pushdown',
    primaryMuscle: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Cable Machine',
    difficulty: 'beginner',
    category: 'isolation',
    instructions: [
      'Attach rope or straight bar to high pulley.',
      'Keep elbows tucked at sides and extend arms fully downward.',
      'Control return to 90 degrees.',
    ],
    formGuidance: 'Only forearms should move.',
    commonMistakes: ['Flaring elbows', 'Leaning body weight onto bar'],
    mediaPlaceholder: 'Placeholder: Tricep Pushdown diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-wrist-curl',
    name: 'Dumbbell Wrist Curl',
    primaryMuscle: 'Forearms',
    secondaryMuscles: [],
    equipment: 'Dumbbells',
    difficulty: 'beginner',
    category: 'isolation',
    instructions: [
      'Rest forearms on thighs or bench with palms facing up.',
      'Curl wrists upward, squeeze, and lower slowly.',
    ],
    formGuidance: 'Use controlled full range of motion.',
    commonMistakes: ['Using excessive weight', 'Rushing reps'],
    mediaPlaceholder: 'Placeholder: Wrist Curl diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-squat',
    name: 'Barbell Back Squat',
    primaryMuscle: 'Quadriceps',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Core'],
    equipment: 'Barbell',
    difficulty: 'intermediate',
    category: 'compound',
    instructions: [
      'Position bar across upper traps, feet shoulder-width apart.',
      'Brace core, sit hips back and down until thighs are at least parallel.',
      'Drive through mid-foot to stand back up.',
    ],
    formGuidance: 'Keep knees tracking over toes and chest proud.',
    commonMistakes: ['Knees caving inward', 'Heels lifting off floor', 'Rounding lower back'],
    mediaPlaceholder: 'Placeholder: Back Squat diagram',
    isFavorite: true,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-rdl',
    name: 'Romanian Deadlift (RDL)',
    primaryMuscle: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Back'],
    equipment: 'Barbell',
    difficulty: 'intermediate',
    category: 'compound',
    instructions: [
      'Hold barbell at hip height with soft knee bend.',
      'Push hips straight back while keeping bar close to legs.',
      'Feel deep hamstring stretch, then drive hips forward.',
    ],
    formGuidance: 'Maintain a flat back throughout the hinge.',
    commonMistakes: ['Squatting instead of hinging', 'Rounding spine', 'Letting bar drift away from shins'],
    mediaPlaceholder: 'Placeholder: RDL diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-hip-thrust',
    name: 'Barbell Hip Thrust',
    primaryMuscle: 'Glutes',
    secondaryMuscles: ['Hamstrings'],
    equipment: 'Barbell',
    difficulty: 'beginner',
    category: 'compound',
    instructions: [
      'Rest upper back on bench with barbell padded across hips.',
      'Drive through heels to lift hips until torso is parallel to floor.',
      'Squeeze glutes at top for 1 second, then lower.',
    ],
    formGuidance: 'Keep chin tucked and ribs down.',
    commonMistakes: ['Hyperextending lower back at top'],
    mediaPlaceholder: 'Placeholder: Hip Thrust diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-calf-raise',
    name: 'Standing Calf Raise',
    primaryMuscle: 'Calves',
    secondaryMuscles: [],
    equipment: 'Machine',
    difficulty: 'beginner',
    category: 'isolation',
    instructions: [
      'Stand with balls of feet on edge of platform.',
      'Lower heels for a full stretch, then press up onto toes.',
    ],
    formGuidance: 'Pause 1 second at bottom and top to eliminate bounce.',
    commonMistakes: ['Bouncing through reps'],
    mediaPlaceholder: 'Placeholder: Calf Raise diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-hanging-leg-raise',
    name: 'Hanging Leg Raise',
    primaryMuscle: 'Abs',
    secondaryMuscles: ['Core', 'Forearms'],
    equipment: 'Bodyweight',
    difficulty: 'intermediate',
    category: 'isolation',
    instructions: [
      'Hang from pull-up bar with straight arms.',
      'Raise legs up toward 90 degrees by curling pelvis.',
      'Lower slowly without swinging.',
    ],
    formGuidance: 'Focus on posterior pelvic tilt rather than just hip flexion.',
    commonMistakes: ['Swinging momentum'],
    mediaPlaceholder: 'Placeholder: Hanging Leg Raise diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'ex-plank',
    name: 'Forearm Plank',
    primaryMuscle: 'Core',
    secondaryMuscles: ['Abs', 'Shoulders'],
    equipment: 'Bodyweight',
    difficulty: 'beginner',
    category: 'stability' as unknown as ExerciseLibraryItem['category'],
    instructions: [
      'Support body on forearms and toes in a straight line.',
      'Brace abs and glutes tightly.',
      'Hold for target duration.',
    ],
    formGuidance: 'Do not let hips sag or pike up.',
    commonMistakes: ['Sagging lower back', 'Holding breath'],
    mediaPlaceholder: 'Placeholder: Forearm Plank diagram',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
];

export const SEED_FOODS: FoodItem[] = [
  {
    id: 'food-paneer',
    name: 'Paneer (Low-Fat / Homemade)',
    category: 'Indian foods',
    servingSizeLabel: '100g',
    servingGrams: 100,
    calories: 265,
    proteinG: 18.3,
    carbsG: 1.2,
    fatG: 20.8,
    source: 'verified',
    sourceNote: 'IFCT / Standard Indian Food Composition',
    isFavorite: true,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-dal-tadka',
    name: 'Cooked Yellow Dal (Toor/Moong)',
    category: 'Indian foods',
    servingSizeLabel: '1 bowl (200g)',
    servingGrams: 200,
    calories: 210,
    proteinG: 11.5,
    carbsG: 30,
    fatG: 4.5,
    fiberG: 5.5,
    source: 'estimated',
    sourceNote: 'Standard home-cooked recipe estimate',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-roti',
    name: 'Whole Wheat Roti / Chapati',
    category: 'Indian foods',
    servingSizeLabel: '1 medium (40g)',
    servingGrams: 40,
    calories: 120,
    proteinG: 3.8,
    carbsG: 24,
    fatG: 0.8,
    fiberG: 3.2,
    source: 'verified',
    sourceNote: 'IFCT Whole Wheat Atta reference',
    isFavorite: true,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-basmati-rice',
    name: 'Cooked Basmati Rice',
    category: 'Grains',
    servingSizeLabel: '1 cup (160g)',
    servingGrams: 160,
    calories: 205,
    proteinG: 4.3,
    carbsG: 44.5,
    fatG: 0.4,
    source: 'verified',
    sourceNote: 'USDA FoodData Central',
    isFavorite: true,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-oats',
    name: 'Rolled Oats (Dry)',
    category: 'Grains',
    servingSizeLabel: '50g',
    servingGrams: 50,
    calories: 190,
    proteinG: 6.7,
    carbsG: 33.5,
    fatG: 3.4,
    fiberG: 5.1,
    source: 'verified',
    sourceNote: 'USDA FoodData Central',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-greek-yogurt',
    name: 'Greek Yogurt (Plain, Non-Fat)',
    category: 'Dairy',
    servingSizeLabel: '170g',
    servingGrams: 170,
    calories: 100,
    proteinG: 17,
    carbsG: 6,
    fatG: 0.7,
    source: 'verified',
    sourceNote: 'USDA FoodData Central',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-banana',
    name: 'Banana (Medium)',
    category: 'Fruits',
    servingSizeLabel: '1 medium (118g)',
    servingGrams: 118,
    calories: 105,
    proteinG: 1.3,
    carbsG: 27,
    fatG: 0.4,
    fiberG: 3.1,
    sugarG: 14.4,
    source: 'verified',
    sourceNote: 'USDA FoodData Central',
    isFavorite: true,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-broccoli',
    name: 'Steamed Broccoli',
    category: 'Vegetables',
    servingSizeLabel: '100g',
    servingGrams: 100,
    calories: 35,
    proteinG: 2.4,
    carbsG: 7.2,
    fatG: 0.4,
    fiberG: 3.3,
    source: 'verified',
    sourceNote: 'USDA FoodData Central',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-chicken-breast',
    name: 'Chicken Breast (Cooked, Skinless)',
    category: 'Meat',
    servingSizeLabel: '100g',
    servingGrams: 100,
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    source: 'verified',
    sourceNote: 'USDA FoodData Central',
    isFavorite: true,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-egg-whole',
    name: 'Whole Egg (Large, Boiled)',
    category: 'Eggs',
    servingSizeLabel: '1 large (50g)',
    servingGrams: 50,
    calories: 78,
    proteinG: 6.3,
    carbsG: 0.6,
    fatG: 5.3,
    source: 'verified',
    sourceNote: 'USDA FoodData Central',
    isFavorite: true,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-salmon',
    name: 'Atlantic Salmon (Cooked)',
    category: 'Seafood',
    servingSizeLabel: '100g',
    servingGrams: 100,
    calories: 206,
    proteinG: 22.1,
    carbsG: 0,
    fatG: 12.4,
    source: 'verified',
    sourceNote: 'USDA FoodData Central',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-almonds',
    name: 'Raw Almonds',
    category: 'Nuts',
    servingSizeLabel: '28g (23 almonds)',
    servingGrams: 28,
    calories: 164,
    proteinG: 6,
    carbsG: 6.1,
    fatG: 14.2,
    fiberG: 3.5,
    source: 'verified',
    sourceNote: 'USDA FoodData Central',
    isFavorite: false,
    isCustom: false,
    createdAt: now,
  },
  {
    id: 'food-whey',
    name: 'Whey Protein Isolate',
    category: 'Supplements',
    servingSizeLabel: '1 scoop (30g)',
    servingGrams: 30,
    calories: 115,
    proteinG: 25,
    carbsG: 1.5,
    fatG: 0.5,
    source: 'verified',
    sourceNote: 'Standard Whey Isolate nutrition label',
    isFavorite: true,
    isCustom: false,
    createdAt: now,
  },
];

function makeLegPlan(
  id: string,
  name: string,
  description: string,
  exercises: Array<{ exerciseId: string; exerciseName: string; targetSets: number; targetReps: string; restSeconds: number }>
): WorkoutPlan {
  return {
    id,
    name,
    splitType: 'Custom',
    description,
    days: [
      {
        id: `${id}-day-1`,
        dayName: name,
        isRestDay: false,
        exercises: exercises.map((ex, idx) => ({
          id: `${id}-ex-${idx + 1}`,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          restSeconds: ex.restSeconds,
        })),
      },
    ],
    isActive: false,
    isArchived: false,
    isTemplate: true,
    createdAt: now,
    updatedAt: now,
  };
}

export const SEED_WORKOUT_PLANS: WorkoutPlan[] = [
  // Quads
  makeLegPlan('plan-quads-a', 'Quads A — Squat strength', 'Quads', [
    { exerciseId: 'legs.barbell-back-squat', exerciseName: 'Barbell Back Squat', targetSets: 3, targetReps: '6-10', restSeconds: 120 },
    { exerciseId: 'legs.leg-press', exerciseName: 'Leg Press', targetSets: 2, targetReps: '8-12', restSeconds: 90 },
    { exerciseId: 'legs.leg-extension-machine', exerciseName: 'Leg Extension Machine', targetSets: 2, targetReps: '10-15', restSeconds: 60 },
  ]),
  makeLegPlan('plan-quads-b', 'Quads B — Dumbbell and unilateral', 'Quads', [
    { exerciseId: 'legs.goblet-squat', exerciseName: 'Goblet Squat', targetSets: 3, targetReps: '8-12', restSeconds: 90 },
    { exerciseId: 'legs.reverse-lunge', exerciseName: 'Reverse Lunge', targetSets: 2, targetReps: '8-12 each side', restSeconds: 90 },
    { exerciseId: 'legs.heel-elevated-goblet-squat', exerciseName: 'Heel-Elevated Goblet Squat', targetSets: 2, targetReps: '10-15', restSeconds: 90 },
  ]),
  makeLegPlan('plan-quads-c', 'Quads C — Machine and isometric', 'Quads', [
    { exerciseId: 'legs.hack-squat-machine', exerciseName: 'Hack Squat Machine', targetSets: 3, targetReps: '8-12', restSeconds: 120 },
    { exerciseId: 'legs.leg-extension-machine', exerciseName: 'Leg Extension Machine', targetSets: 2, targetReps: '10-15', restSeconds: 60 },
    { exerciseId: 'legs.wall-sit', exerciseName: 'Wall Sit', targetSets: 2, targetReps: '20-45 sec', restSeconds: 60 },
  ]),
  // Hamstrings
  makeLegPlan('plan-hamstrings-a', 'Hamstrings A — Hip hinge', 'Hamstrings', [
    { exerciseId: 'legs.barbell-romanian-deadlift-legs', exerciseName: 'Barbell Romanian Deadlift', targetSets: 3, targetReps: '6-10', restSeconds: 120 },
    { exerciseId: 'legs.seated-leg-curl', exerciseName: 'Seated Leg Curl', targetSets: 2, targetReps: '8-12', restSeconds: 60 },
    { exerciseId: 'legs.single-leg-romanian-deadlift', exerciseName: 'Single-Leg Romanian Deadlift', targetSets: 2, targetReps: '8-10 each side', restSeconds: 90 },
  ]),
  makeLegPlan('plan-hamstrings-b', 'Hamstrings B — Knee flexion', 'Hamstrings', [
    { exerciseId: 'legs.seated-leg-curl', exerciseName: 'Seated Leg Curl', targetSets: 3, targetReps: '8-12', restSeconds: 60 },
    { exerciseId: 'legs.lying-leg-curl', exerciseName: 'Lying Leg Curl', targetSets: 2, targetReps: '10-15', restSeconds: 60 },
    { exerciseId: 'legs.slider-leg-curl', exerciseName: 'Slider Leg Curl', targetSets: 2, targetReps: '8-12', restSeconds: 60 },
  ]),
  makeLegPlan('plan-hamstrings-c', 'Hamstrings C — Home setup', 'Hamstrings', [
    { exerciseId: 'legs.dumbbell-romanian-deadlift-legs', exerciseName: 'Dumbbell Romanian Deadlift', targetSets: 3, targetReps: '8-12', restSeconds: 90 },
    { exerciseId: 'legs.stability-ball-leg-curl', exerciseName: 'Stability-Ball Leg Curl', targetSets: 2, targetReps: '8-15', restSeconds: 60 },
    { exerciseId: 'legs.slider-leg-curl', exerciseName: 'Slider Leg Curl', targetSets: 2, targetReps: '8-12', restSeconds: 60 },
  ]),
  // Glutes
  makeLegPlan('plan-glutes-a', 'Glutes A — Hip thrust focus', 'Glutes', [
    { exerciseId: 'legs.barbell-hip-thrust', exerciseName: 'Barbell Hip Thrust', targetSets: 3, targetReps: '8-12', restSeconds: 120 },
    { exerciseId: 'legs.cable-glute-kickback', exerciseName: 'Cable Glute Kickback', targetSets: 2, targetReps: '10-15 each side', restSeconds: 60 },
    { exerciseId: 'legs.banded-glute-bridge', exerciseName: 'Banded Glute Bridge', targetSets: 2, targetReps: '12-20', restSeconds: 60 },
  ]),
  makeLegPlan('plan-glutes-b', 'Glutes B — Unilateral control', 'Glutes', [
    { exerciseId: 'legs.dumbbell-step-up-glute', exerciseName: 'High-Box Step-Up (Glute Emphasis)', targetSets: 3, targetReps: '8-12 each side', restSeconds: 90 },
    { exerciseId: 'legs.single-leg-hip-thrust', exerciseName: 'Single-Leg Hip Thrust', targetSets: 2, targetReps: '8-12 each side', restSeconds: 90 },
    { exerciseId: 'legs.clamshell', exerciseName: 'Side-Lying Clamshell', targetSets: 2, targetReps: '12-20 each side', restSeconds: 60 },
  ]),
  makeLegPlan('plan-glutes-c', 'Glutes C — Home equipment-light', 'Glutes', [
    { exerciseId: 'legs.dumbbell-glute-bridge', exerciseName: 'Dumbbell Glute Bridge', targetSets: 3, targetReps: '10-15', restSeconds: 90 },
    { exerciseId: 'legs.single-leg-glute-bridge', exerciseName: 'Single-Leg Glute Bridge', targetSets: 2, targetReps: '8-12 each side', restSeconds: 60 },
    { exerciseId: 'legs.frog-pump', exerciseName: 'Frog Pump', targetSets: 2, targetReps: '15-25', restSeconds: 60 },
  ]),
  // Calves
  makeLegPlan('plan-calves-a', 'Calves A — Straight-knee emphasis', 'Calves', [
    { exerciseId: 'legs.standing-calf-raise', exerciseName: 'Standing Calf Raise', targetSets: 3, targetReps: '8-15', restSeconds: 60 },
    { exerciseId: 'legs.leg-press-calf-raise', exerciseName: 'Leg Press Calf Raise', targetSets: 2, targetReps: '10-15', restSeconds: 60 },
    { exerciseId: 'legs.tibialis-raise', exerciseName: 'Tibialis Raise', targetSets: 2, targetReps: '12-20', restSeconds: 60 },
  ]),
  makeLegPlan('plan-calves-b', 'Calves B — Soleus emphasis', 'Calves', [
    { exerciseId: 'legs.seated-calf-raise', exerciseName: 'Seated Calf Raise', targetSets: 3, targetReps: '10-20', restSeconds: 60 },
    { exerciseId: 'legs.bent-knee-dumbbell-calf-raise', exerciseName: 'Bent-Knee Dumbbell Calf Raise', targetSets: 2, targetReps: '12-20', restSeconds: 60 },
    { exerciseId: 'legs.tibialis-raise', exerciseName: 'Tibialis Raise', targetSets: 2, targetReps: '12-20', restSeconds: 60 },
  ]),
  makeLegPlan('plan-calves-c', 'Calves C — Home and single-leg', 'Calves', [
    { exerciseId: 'legs.single-leg-calf-raise', exerciseName: 'Single-Leg Calf Raise', targetSets: 3, targetReps: '8-15 each side', restSeconds: 60 },
    { exerciseId: 'legs.calf-raise-on-stair', exerciseName: 'Calf Raise on Step', targetSets: 2, targetReps: '12-20', restSeconds: 60 },
    { exerciseId: 'legs.tibialis-raise', exerciseName: 'Tibialis Raise', targetSets: 2, targetReps: '12-20', restSeconds: 60 },
  ]),
  // Adductors
  makeLegPlan('plan-adductors-a', 'Adductors A — Machine focus', 'Adductors', [
    { exerciseId: 'legs.hip-adduction-machine', exerciseName: 'Hip Adduction Machine', targetSets: 3, targetReps: '10-15', restSeconds: 60 },
    { exerciseId: 'legs.lateral-lunge-adductor', exerciseName: 'Lateral Lunge', targetSets: 2, targetReps: '8-10 each side', restSeconds: 90 },
    { exerciseId: 'legs.sumo-squat-adductor', exerciseName: 'Sumo Squat', targetSets: 2, targetReps: '8-12', restSeconds: 90 },
  ]),
  makeLegPlan('plan-adductors-b', 'Adductors B — Lateral strength', 'Adductors', [
    { exerciseId: 'legs.lateral-lunge-adductor', exerciseName: 'Lateral Lunge', targetSets: 3, targetReps: '8-12 each side', restSeconds: 90 },
    { exerciseId: 'legs.cable-hip-adduction', exerciseName: 'Standing Cable Hip Adduction', targetSets: 2, targetReps: '10-15 each side', restSeconds: 60 },
    { exerciseId: 'legs.side-lying-hip-adduction', exerciseName: 'Side-Lying Hip Adduction', targetSets: 2, targetReps: '10-15 each side', restSeconds: 60 },
  ]),
  makeLegPlan('plan-adductors-c', 'Adductors C — Floor and supported', 'Adductors', [
    { exerciseId: 'legs.side-lying-hip-adduction', exerciseName: 'Side-Lying Hip Adduction', targetSets: 3, targetReps: '10-15 each side', restSeconds: 60 },
    { exerciseId: 'legs.sumo-squat-adductor', exerciseName: 'Sumo Squat', targetSets: 2, targetReps: '8-12', restSeconds: 90 },
    { exerciseId: 'legs.copenhagen-plank', exerciseName: 'Copenhagen Plank', targetSets: 2, targetReps: '10-20 sec each side', restSeconds: 60 },
  ]),
  // Abductors
  makeLegPlan('plan-abductors-a', 'Abductors A — Machine focus', 'Abductors', [
    { exerciseId: 'legs.hip-abduction-machine', exerciseName: 'Hip Abduction Machine', targetSets: 3, targetReps: '10-15', restSeconds: 60 },
    { exerciseId: 'legs.standing-cable-hip-abduction', exerciseName: 'Standing Cable Hip Abduction', targetSets: 2, targetReps: '10-15 each side', restSeconds: 60 },
    { exerciseId: 'legs.band-lateral-walk', exerciseName: 'Resistance-Band Lateral Walk', targetSets: 2, targetReps: '8-12 steps each direction', restSeconds: 60 },
  ]),
  makeLegPlan('plan-abductors-b', 'Abductors B — Cable and bodyweight', 'Abductors', [
    { exerciseId: 'legs.standing-cable-hip-abduction', exerciseName: 'Standing Cable Hip Abduction', targetSets: 3, targetReps: '10-15 each side', restSeconds: 60 },
    { exerciseId: 'legs.side-lying-leg-raise', exerciseName: 'Side-Lying Hip Abduction', targetSets: 2, targetReps: '10-15 each side', restSeconds: 60 },
    { exerciseId: 'legs.band-monster-walk', exerciseName: 'Resistance-Band Monster Walk', targetSets: 2, targetReps: '8-12 steps each direction', restSeconds: 60 },
  ]),
  makeLegPlan('plan-abductors-c', 'Abductors C — Home band session', 'Abductors', [
    { exerciseId: 'legs.band-lateral-walk', exerciseName: 'Resistance-Band Lateral Walk', targetSets: 3, targetReps: '8-12 steps each direction', restSeconds: 60 },
    { exerciseId: 'legs.standing-band-hip-abduction', exerciseName: 'Standing Band Hip Abduction', targetSets: 2, targetReps: '10-15 each side', restSeconds: 60 },
    { exerciseId: 'legs.side-lying-leg-raise', exerciseName: 'Side-Lying Hip Abduction', targetSets: 2, targetReps: '10-15 each side', restSeconds: 60 },
  ]),
  // Abdominals
  makeLegPlan('plan-abdominals-a', 'Abs A — Beginner control', 'Abdominals', [
    { exerciseId: 'abs-core.floor-crunch', exerciseName: 'Floor Crunch', targetSets: 2, targetReps: '8-15', restSeconds: 60 },
    { exerciseId: 'abs-core.reverse-crunch', exerciseName: 'Reverse Crunch', targetSets: 2, targetReps: '8-12', restSeconds: 60 },
    { exerciseId: 'abs-core.dead-bug', exerciseName: 'Dead Bug', targetSets: 2, targetReps: '6-10 each side', restSeconds: 60 },
  ]),
  makeLegPlan('plan-abdominals-b', 'Abs B — Cable and supported', 'Abdominals', [
    { exerciseId: 'abs-core.cable-crunch', exerciseName: 'Kneeling Cable Crunch', targetSets: 3, targetReps: '8-12', restSeconds: 60 },
    { exerciseId: 'abs-core.stability-ball-crunch', exerciseName: 'Stability-Ball Crunch', targetSets: 2, targetReps: '10-15', restSeconds: 60 },
    { exerciseId: 'abs-core.captains-chair-knee-raise', exerciseName: 'Captain’s Chair Knee Raise', targetSets: 2, targetReps: '8-12', restSeconds: 60 },
  ]),
  makeLegPlan('plan-abdominals-c', 'Abs C — Intermediate dynamic work', 'Abdominals', [
    { exerciseId: 'abs-core.weighted-crunch', exerciseName: 'Weighted Crunch', targetSets: 3, targetReps: '8-12', restSeconds: 60 },
    { exerciseId: 'abs-core.lying-leg-raise', exerciseName: 'Lying Leg Raise', targetSets: 2, targetReps: '8-12', restSeconds: 60 },
    { exerciseId: 'abs-core.bicycle-crunch', exerciseName: 'Bicycle Crunch', targetSets: 2, targetReps: '8-12 each side', restSeconds: 60 },
  ]),
  // Obliques
  makeLegPlan('plan-obliques-a', 'Obliques A — Cable rotation', 'Obliques', [
    { exerciseId: 'abs-core.cable-woodchop-high-low', exerciseName: 'High-to-Low Cable Wood Chop', targetSets: 2, targetReps: '8-12 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.cable-woodchop-low-high', exerciseName: 'Low-to-High Cable Wood Chop', targetSets: 2, targetReps: '8-12 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.side-crunch', exerciseName: 'Side-Lying Oblique Crunch', targetSets: 2, targetReps: '8-12 each side', restSeconds: 60 },
  ]),
  makeLegPlan('plan-obliques-b', 'Obliques B — Home rotation', 'Obliques', [
    { exerciseId: 'abs-core.standing-band-rotation', exerciseName: 'Standing Resistance-Band Rotation', targetSets: 3, targetReps: '8-12 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.russian-twist', exerciseName: 'Russian Twist', targetSets: 2, targetReps: '8-12 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.cross-body-mountain-climber', exerciseName: 'Cross-Body Mountain Climber', targetSets: 2, targetReps: '8-12 each side', restSeconds: 60 },
  ]),
  makeLegPlan('plan-obliques-c', 'Obliques C — Lateral flexion and control', 'Obliques', [
    { exerciseId: 'abs-core.dumbbell-side-bend', exerciseName: 'Dumbbell Side Bend', targetSets: 2, targetReps: '8-12 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.windshield-wiper-bent-knee', exerciseName: 'Bent-Knee Windshield Wiper', targetSets: 2, targetReps: '6-10 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.side-plank-hip-lift', exerciseName: 'Side Plank with Hip Lift', targetSets: 2, targetReps: '6-10 each side', restSeconds: 60 },
  ]),
  // Anti-Extension
  makeLegPlan('plan-anti-extension-a', 'Anti-extension A — Foundational', 'Anti-Extension', [
    { exerciseId: 'abs-core.dead-bug', exerciseName: 'Dead Bug', targetSets: 2, targetReps: '6-10 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.forearm-plank', exerciseName: 'Forearm Plank', targetSets: 2, targetReps: '15-40 sec', restSeconds: 60 },
    { exerciseId: 'abs-core.bear-plank-hold', exerciseName: 'Bear Plank Hold', targetSets: 2, targetReps: '15-30 sec', restSeconds: 60 },
  ]),
  makeLegPlan('plan-anti-extension-b', 'Anti-extension B — Rollout progression', 'Anti-Extension', [
    { exerciseId: 'abs-core.high-plank', exerciseName: 'High Plank', targetSets: 2, targetReps: '15-40 sec', restSeconds: 60 },
    { exerciseId: 'abs-core.kneeling-ab-wheel-rollout', exerciseName: 'Kneeling Ab Wheel Rollout', targetSets: 2, targetReps: '5-10', restSeconds: 60 },
    { exerciseId: 'abs-core.stability-ball-rollout', exerciseName: 'Stability-Ball Rollout', targetSets: 2, targetReps: '6-12', restSeconds: 60 },
  ]),
  makeLegPlan('plan-anti-extension-c', 'Anti-extension C — Advanced holds', 'Anti-Extension', [
    { exerciseId: 'abs-core.hollow-body-hold', exerciseName: 'Hollow-Body Hold', targetSets: 2, targetReps: '15-30 sec', restSeconds: 60 },
    { exerciseId: 'abs-core.body-saw-plank', exerciseName: 'Body Saw Plank', targetSets: 2, targetReps: '6-10 controlled reps', restSeconds: 60 },
    { exerciseId: 'abs-core.rkc-plank', exerciseName: 'RKC Plank', targetSets: 2, targetReps: '10-20 sec', restSeconds: 60 },
  ]),
  // Anti-Rotation
  makeLegPlan('plan-anti-rotation-a', 'Anti-rotation A — Pallof press', 'Anti-Rotation', [
    { exerciseId: 'abs-core.standing-pallof-press', exerciseName: 'Standing Pallof Press', targetSets: 2, targetReps: '8-12 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.half-kneeling-pallof-press', exerciseName: 'Half-Kneeling Pallof Press', targetSets: 2, targetReps: '8-12 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.plank-shoulder-tap', exerciseName: 'Plank Shoulder Tap', targetSets: 2, targetReps: '6-10 each side', restSeconds: 60 },
  ]),
  makeLegPlan('plan-anti-rotation-b', 'Anti-rotation B — Cable and band control', 'Anti-Rotation', [
    { exerciseId: 'abs-core.pallof-press-walkout', exerciseName: 'Pallof Press Walkout', targetSets: 2, targetReps: '4-8 steps each side', restSeconds: 60 },
    { exerciseId: 'abs-core.single-arm-cable-hold-core', exerciseName: 'Single-Arm Cable Anti-Rotation Hold', targetSets: 2, targetReps: '15-30 sec each side', restSeconds: 60 },
    { exerciseId: 'abs-core.quadruped-band-lift', exerciseName: 'Quadruped Band Anti-Rotation Lift', targetSets: 2, targetReps: '6-10 each side', restSeconds: 60 },
  ]),
  makeLegPlan('plan-anti-rotation-c', 'Anti-rotation C — Kneeling and loaded', 'Anti-Rotation', [
    { exerciseId: 'abs-core.tall-kneeling-pallof-press', exerciseName: 'Tall-Kneeling Pallof Press', targetSets: 2, targetReps: '8-12 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.bird-dog-row', exerciseName: 'Bird-Dog Dumbbell Row', targetSets: 2, targetReps: '6-8 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.renegade-row-core', exerciseName: 'Renegade Row (Core Stability)', targetSets: 2, targetReps: '5-8 each side', restSeconds: 60 },
  ]),
  // Anti-Lateral-Flexion
  makeLegPlan('plan-anti-lateral-a', 'Lateral stability A — Side support', 'Anti-Lateral-Flexion', [
    { exerciseId: 'abs-core.side-plank', exerciseName: 'Side Plank', targetSets: 2, targetReps: '15-40 sec each side', restSeconds: 60 },
    { exerciseId: 'abs-core.side-plank-hip-lift', exerciseName: 'Side Plank with Hip Lift', targetSets: 2, targetReps: '6-10 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.suitcase-carry', exerciseName: 'Suitcase Carry', targetSets: 2, targetReps: '20-40 m each side', restSeconds: 60 },
  ]),
  makeLegPlan('plan-anti-lateral-b', 'Lateral stability B — Loaded carry', 'Anti-Lateral-Flexion', [
    { exerciseId: 'abs-core.suitcase-march', exerciseName: 'Suitcase March', targetSets: 2, targetReps: '20-40 steps each side', restSeconds: 60 },
    { exerciseId: 'abs-core.offset-farmer-carry', exerciseName: 'Offset Farmer Carry', targetSets: 2, targetReps: '20-40 m', restSeconds: 60 },
    { exerciseId: 'abs-core.side-plank-reach-through', exerciseName: 'Side Plank Reach-Through', targetSets: 2, targetReps: '6-10 each side', restSeconds: 60 },
  ]),
  makeLegPlan('plan-anti-lateral-c', 'Lateral stability C — Advanced options', 'Anti-Lateral-Flexion', [
    { exerciseId: 'abs-core.standing-one-arm-overhead-carry', exerciseName: 'Single-Arm Overhead Carry', targetSets: 2, targetReps: '15-30 m each side', restSeconds: 60 },
    { exerciseId: 'abs-core.copenhagen-side-plank-core', exerciseName: 'Copenhagen Side Plank', targetSets: 2, targetReps: '10-20 sec each side', restSeconds: 60 },
    { exerciseId: 'abs-core.side-plank', exerciseName: 'Side Plank', targetSets: 2, targetReps: '15-40 sec each side', restSeconds: 60 },
  ]),
  // Spinal Stability
  makeLegPlan('plan-spinal-stability-a', 'Spinal stability A — Beginner coordination', 'Spinal Stability', [
    { exerciseId: 'abs-core.bird-dog-core', exerciseName: 'Bird Dog', targetSets: 2, targetReps: '6-10 each side', restSeconds: 60 },
    { exerciseId: 'abs-core.bird-dog-hold', exerciseName: 'Bird Dog Hold', targetSets: 2, targetReps: '10-20 sec each side', restSeconds: 60 },
    { exerciseId: 'abs-core.prone-cobra-hold', exerciseName: 'Prone Cobra Hold', targetSets: 2, targetReps: '10-20 sec', restSeconds: 60 },
  ]),
  makeLegPlan('plan-spinal-stability-b', 'Spinal stability B — Supported extension', 'Spinal Stability', [
    { exerciseId: 'abs-core.45-degree-back-extension-core', exerciseName: '45-Degree Back Extension', targetSets: 2, targetReps: '8-12', restSeconds: 60 },
    { exerciseId: 'abs-core.back-extension-machine-core', exerciseName: 'Back Extension Machine', targetSets: 2, targetReps: '8-12', restSeconds: 60 },
    { exerciseId: 'abs-core.quadruped-lumbar-extension', exerciseName: 'Quadruped Trunk Extension', targetSets: 2, targetReps: '6-10 each side', restSeconds: 60 },
  ]),
  makeLegPlan('plan-spinal-stability-c', 'Spinal stability C — Home bodyweight', 'Spinal Stability', [
    { exerciseId: 'abs-core.prone-back-extension', exerciseName: 'Prone Back Extension', targetSets: 2, targetReps: '8-12', restSeconds: 60 },
    { exerciseId: 'abs-core.superman-hold-core', exerciseName: 'Superman Hold', targetSets: 2, targetReps: '10-20 sec', restSeconds: 60 },
    { exerciseId: 'abs-core.hip-hinge-back-extension', exerciseName: 'Hip-Hinge Back Extension', targetSets: 2, targetReps: '8-12', restSeconds: 60 },
  ]),
];

export const SEED_GOALS: DailyGoal[] = [
  { id: 'goal-calories', title: 'Hit Daily Calorie Target', category: 'nutrition', targetValue: 1, unit: 'day', isActive: true, createdAt: now },
  { id: 'goal-protein', title: 'Hit Daily Protein Target', category: 'nutrition', targetValue: 1, unit: 'day', isActive: true, createdAt: now },
  { id: 'goal-water', title: 'Drink Target Water', category: 'wellness', targetValue: 3000, unit: 'ml', isActive: true, createdAt: now },
  { id: 'goal-steps', title: '8,000+ Daily Steps', category: 'fitness', targetValue: 8000, unit: 'steps', isActive: true, createdAt: now },
  { id: 'goal-sleep', title: '7.5+ Hours Sleep', category: 'wellness', targetValue: 7.5, unit: 'hrs', isActive: true, createdAt: now },
];

export async function ensureDatabaseSeeded(): Promise<void> {
  // Remove legacy ex-* seed exercises so only catalog & custom exercises remain
  const legacyKeys = (await db.exerciseLibrary.toCollection().primaryKeys()).filter((id) =>
    String(id).startsWith('ex-')
  );
  if (legacyKeys.length > 0) {
    await db.exerciseLibrary.bulkDelete(legacyKeys);
  }
  await importExerciseCatalog(chestCatalog as unknown as ExerciseCatalogRaw);
  await importExerciseCatalog(backCatalog as unknown as ExerciseCatalogRaw);
  await importExerciseCatalog(shoulderCatalog as unknown as ExerciseCatalogRaw);
  await importExerciseCatalog(armCatalog as unknown as ExerciseCatalogRaw);
  await importExerciseCatalog(legCatalog as unknown as ExerciseCatalogRaw);
  await importExerciseCatalog(absCoreCatalog as unknown as ExerciseCatalogRaw);

  const foodCount = await db.foodItems.count();
  if (foodCount === 0) {
    await db.foodItems.bulkAdd(SEED_FOODS);
  }

  const existingPlanIds = new Set(await db.workoutPlans.toCollection().primaryKeys());
  const missingPlans = SEED_WORKOUT_PLANS.filter((p) => !existingPlanIds.has(p.id));
  if (missingPlans.length > 0) {
    await db.workoutPlans.bulkAdd(missingPlans);
  }

  const goalCount = await db.dailyGoals.count();
  if (goalCount === 0) {
    await db.dailyGoals.bulkAdd(SEED_GOALS);
  }

  const settings = await db.appSettings.get('settings');
  if (!settings) {
    await db.appSettings.put({
      id: 'settings',
      weightUnit: 'kg',
      aiProvider: 'local_deterministic',
      aiConsentGranted: false,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    });
  }
}

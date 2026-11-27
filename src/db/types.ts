export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type FitnessExperience = 'beginner' | 'intermediate' | 'advanced';
export type FitnessObjective =
  | 'muscle_gain'
  | 'fat_loss'
  | 'maintenance'
  | 'recomposition'
  | 'strength'
  | 'general_fitness';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  bodyFatPercent?: number;
  activityLevel: ActivityLevel;
  experience: FitnessExperience;
  objective: FitnessObjective;
  workoutFrequencyPerWeek: number;
  availableEquipment: string[];
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BodyMetric {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPercent?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
  createdAt: string;
}

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Quadriceps'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Abs'
  | 'Core';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseCategory = 'strength' | 'hypertrophy' | 'compound' | 'isolation' | 'cardio' | 'mobility';

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: string;
  difficulty: ExerciseDifficulty;
  category: ExerciseCategory;
  instructions: string[];
  formGuidance: string;
  commonMistakes: string[];
  mediaPlaceholder?: string;
  notes?: string;
  isFavorite: boolean;
  isCustom: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export interface PlannedExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string; // e.g. "8-12" or "5"
  targetWeightKg?: number;
  restSeconds: number;
  notes?: string;
}

export interface WorkoutDayTemplate {
  id: string;
  dayName: string; // e.g., "Push Day", "Upper A"
  dayOfWeek?: number; // 0-6
  isRestDay: boolean;
  exercises: PlannedExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  splitType: 'PPL' | 'Upper/Lower' | 'Bro Split' | 'Full Body' | 'Custom';
  description?: string;
  days: WorkoutDayTemplate[];
  isActive: boolean;
  isArchived: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ScheduledWorkoutStatus = 'planned' | 'completed' | 'skipped' | 'rescheduled' | 'rest_day';

export interface ScheduledWorkout {
  id: string;
  date: string; // YYYY-MM-DD
  planId?: string;
  dayTemplateId?: string;
  title: string;
  status: ScheduledWorkoutStatus;
  exercises: PlannedExercise[];
  sessionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSession {
  id: string;
  scheduledWorkoutId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  startedAt: string; // ISO timestamp
  endedAt?: string; // ISO timestamp
  durationSeconds: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  totalVolumeKg: number;
  totalSets: number;
  exercisesCompleted: number;
  personalRecordsCount: number;
  notes?: string;
}

export interface ExerciseSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  isPR: boolean;
  restSeconds?: number;
  notes?: string;
  createdAt: string;
}

export type FoodCategory =
  | 'Indian foods'
  | 'Grains'
  | 'Dairy'
  | 'Fruits'
  | 'Vegetables'
  | 'Meat'
  | 'Eggs'
  | 'Seafood'
  | 'Nuts'
  | 'Packaged foods'
  | 'Homemade recipes'
  | 'Supplements';

export type NutritionSourceType = 'verified' | 'user_entered' | 'estimated';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSizeLabel: string; // e.g., "100g", "1 cup (240ml)", "1 scoop (30g)"
  servingGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  source: NutritionSourceType;
  sourceNote?: string;
  isFavorite: boolean;
  isCustom: boolean;
  createdAt: string;
}

export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Pre-workout' | 'Post-workout';

export interface MealFoodEntry {
  foodId: string;
  foodName: string;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface SavedMeal {
  id: string;
  name: string;
  category: MealCategory;
  isRecipe: boolean;
  items: MealFoodEntry[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  notes?: string;
  createdAt: string;
}

export interface FoodLog {
  id: string;
  date: string; // YYYY-MM-DD
  mealCategory: MealCategory;
  foodId?: string;
  foodName: string;
  servings: number;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: NutritionSourceType;
  createdAt: string;
}

export interface NutritionTarget {
  id: string; // 'active'
  caloriesTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  waterTargetMl: number;
  isManuallyCustomized: boolean;
  bmr: number;
  tdee: number;
  formulaNote: string;
  updatedAt: string;
}

export type ActivityType = 'Weight training' | 'Walking' | 'Running' | 'Cycling' | 'Swimming' | 'Cardio' | 'Other';

export interface ActivityLog {
  id: string;
  date: string; // YYYY-MM-DD
  type: ActivityType;
  durationMinutes: number;
  distanceKm?: number;
  steps?: number;
  estimatedCaloriesBurned: number;
  notes?: string;
  createdAt: string;
}

export interface DailyGoal {
  id: string;
  title: string;
  category: 'nutrition' | 'fitness' | 'wellness' | 'custom';
  targetValue: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
}

export interface GoalCompletion {
  id: string;
  goalId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  valueLogged?: number;
  updatedAt: string;
}

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD
  durationHours: number;
  quality: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: string;
}

export interface RecoveryLog {
  id: string;
  date: string; // YYYY-MM-DD
  waterMl: number;
  soreness: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  fatigue: 1 | 2 | 3 | 4 | 5;
  isRecoveryDay: boolean;
  moodNote?: string;
  updatedAt: string;
}

export interface ProgressPhoto {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  dataUrl: string; // Base64 local storage
  weightKg?: number;
  notes?: string;
  createdAt: string;
}

export interface AIConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  proposedFoodLogs?: Omit<FoodLog, 'id' | 'createdAt'>[];
  confirmed?: boolean;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIConversationMessage[];
  updatedAt: string;
  createdAt: string;
}

export interface AppSettings {
  id: string; // 'settings'
  weightUnit: 'kg' | 'lbs';
  aiProvider: 'local_deterministic' | 'ollama' | 'openai_compatible';
  aiEndpoint?: string;
  aiModel?: string;
  aiConsentGranted: boolean;
  schemaVersion: number;
  updatedAt: string;
}

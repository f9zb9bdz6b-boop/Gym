import Dexie, { type EntityTable } from 'dexie';
import type {
  UserProfile,
  BodyMetric,
  WorkoutPlan,
  ScheduledWorkout,
  WorkoutSession,
  ExerciseLibraryItem,
  ExerciseSet,
  FoodItem,
  SavedMeal,
  FoodLog,
  NutritionTarget,
  ActivityLog,
  DailyGoal,
  GoalCompletion,
  SleepLog,
  RecoveryLog,
  ProgressPhoto,
  AIConversation,
  AppSettings,
} from './types';

export class GymAppDatabase extends Dexie {
  userProfile!: EntityTable<UserProfile, 'id'>;
  bodyMetrics!: EntityTable<BodyMetric, 'id'>;
  workoutPlans!: EntityTable<WorkoutPlan, 'id'>;
  scheduledWorkouts!: EntityTable<ScheduledWorkout, 'id'>;
  workoutSessions!: EntityTable<WorkoutSession, 'id'>;
  exerciseLibrary!: EntityTable<ExerciseLibraryItem, 'id'>;
  exerciseSets!: EntityTable<ExerciseSet, 'id'>;
  foodItems!: EntityTable<FoodItem, 'id'>;
  meals!: EntityTable<SavedMeal, 'id'>;
  foodLogs!: EntityTable<FoodLog, 'id'>;
  nutritionTargets!: EntityTable<NutritionTarget, 'id'>;
  activityLogs!: EntityTable<ActivityLog, 'id'>;
  dailyGoals!: EntityTable<DailyGoal, 'id'>;
  goalCompletions!: EntityTable<GoalCompletion, 'id'>;
  sleepLogs!: EntityTable<SleepLog, 'id'>;
  recoveryLogs!: EntityTable<RecoveryLog, 'id'>;
  progressPhotos!: EntityTable<ProgressPhoto, 'id'>;
  aiConversations!: EntityTable<AIConversation, 'id'>;
  appSettings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('GymAppDB');

    this.version(1).stores({
      userProfile: 'id, updatedAt',
      bodyMetrics: 'id, date, createdAt',
      workoutPlans: 'id, splitType, isActive, isArchived, isTemplate',
      scheduledWorkouts: 'id, date, planId, status',
      workoutSessions: 'id, date, status, startedAt',
      exerciseLibrary: 'id, name, primaryMuscle, equipment, category, isFavorite, isCustom, lastUsedAt',
      exerciseSets: 'id, sessionId, exerciseId, completed, isPR, createdAt',
      foodItems: 'id, name, category, source, isFavorite, isCustom',
      meals: 'id, name, category, isRecipe',
      foodLogs: 'id, date, mealCategory, foodId, createdAt',
      nutritionTargets: 'id, updatedAt',
      activityLogs: 'id, date, type, createdAt',
      dailyGoals: 'id, category, isActive',
      goalCompletions: 'id, [goalId+date], goalId, date, completed',
      sleepLogs: 'id, date, createdAt',
      recoveryLogs: 'id, date, updatedAt',
      progressPhotos: 'id, date, createdAt',
      aiConversations: 'id, updatedAt, createdAt',
      appSettings: 'id, updatedAt',
    });
  }
}

export const db = new GymAppDatabase();

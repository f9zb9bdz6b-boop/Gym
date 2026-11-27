import { db } from '../database';
import type { FoodItem, FoodLog, MealCategory, SavedMeal } from '../types';
import { generateId } from '@/lib/utils';

export const nutritionRepo = {
  async getAllFoods(): Promise<FoodItem[]> {
    return db.foodItems.orderBy('name').toArray();
  },

  async saveCustomFood(food: Omit<FoodItem, 'id' | 'createdAt' | 'isCustom'>): Promise<FoodItem> {
    const record: FoodItem = {
      ...food,
      id: generateId(),
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    await db.foodItems.add(record);
    return record;
  },

  async toggleFoodFavorite(id: string): Promise<void> {
    const f = await db.foodItems.get(id);
    if (f) await db.foodItems.update(id, { isFavorite: !f.isFavorite });
  },

  async getFoodLogsByDate(date: string): Promise<FoodLog[]> {
    return db.foodLogs.where('date').equals(date).sortBy('createdAt');
  },

  async getFoodLogsRange(startDate: string, endDate: string): Promise<FoodLog[]> {
    return db.foodLogs.where('date').between(startDate, endDate, true, true).toArray();
  },

  async addFoodLog(log: Omit<FoodLog, 'id' | 'createdAt'>): Promise<FoodLog> {
    const record: FoodLog = {
      ...log,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await db.foodLogs.add(record);
    return record;
  },

  async updateFoodLog(id: string, updates: Partial<FoodLog>): Promise<void> {
    await db.foodLogs.update(id, updates);
  },

  async deleteFoodLog(id: string): Promise<void> {
    await db.foodLogs.delete(id);
  },

  async getSavedMeals(): Promise<SavedMeal[]> {
    return db.meals.orderBy('name').toArray();
  },

  async saveMeal(meal: Omit<SavedMeal, 'id' | 'createdAt'>): Promise<SavedMeal> {
    const record: SavedMeal = {
      ...meal,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await db.meals.add(record);
    return record;
  },

  async logSavedMeal(meal: SavedMeal, date: string, category?: MealCategory): Promise<void> {
    const now = new Date().toISOString();
    const logs: FoodLog[] = meal.items.map((item) => ({
      id: generateId(),
      date,
      mealCategory: category ?? meal.category,
      foodId: item.foodId,
      foodName: item.foodName,
      servings: item.servings,
      servingLabel: `${item.servings} serving(s)`,
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
      source: 'user_entered',
      createdAt: now,
    }));
    await db.foodLogs.bulkAdd(logs);
  },
};

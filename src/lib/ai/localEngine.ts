import { db } from '@/db/database';
import type { FoodLog, MealCategory } from '@/db/types';
import { todayISO, daysAgoISO } from '@/lib/utils';

export interface AIResponse {
  content: string;
  proposedFoodLogs?: Omit<FoodLog, 'id' | 'createdAt'>[];
}

export async function runLocalDeterministicAI(prompt: string): Promise<AIResponse> {
  const q = prompt.toLowerCase();
  const today = todayISO();

  const profile = await db.userProfile.get('primary');
  const targets = await db.nutritionTargets.get('active');
  const todayLogs = await db.foodLogs.where('date').equals(today).toArray();
  const activePlan = await db.workoutPlans.filter((p) => p.isActive).first();
  const allFoods = await db.foodItems.toArray();

  // 1. Food logging intent ("log ...", "ate ...", "had ...")
  if (q.includes('log ') || q.includes('ate ') || q.includes('had ')) {
    const mealCategory: MealCategory = q.includes('breakfast')
      ? 'Breakfast'
      : q.includes('lunch')
      ? 'Lunch'
      : q.includes('dinner')
      ? 'Dinner'
      : q.includes('pre-workout')
      ? 'Pre-workout'
      : q.includes('post-workout')
      ? 'Post-workout'
      : 'Snacks';

    const matched: Omit<FoodLog, 'id' | 'createdAt'>[] = [];
    for (const food of allFoods) {
      const simpleName = food.name.toLowerCase().split('(')[0].trim();
      const keywords = simpleName.split(' ').filter((w) => w.length > 2);
      if (keywords.some((kw) => q.includes(kw))) {
        // Check for quantity before keyword
        const qtyMatch = q.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:x|servings?|bowls?|cups?|scoops?)?\\s*${keywords[0]}`));
        const servings = qtyMatch ? Number(qtyMatch[1]) : 1;
        matched.push({
          date: today,
          mealCategory,
          foodId: food.id,
          foodName: food.name,
          servings,
          servingLabel: `${servings} × ${food.servingSizeLabel}`,
          calories: Math.round(food.calories * servings),
          proteinG: Number((food.proteinG * servings).toFixed(1)),
          carbsG: Number((food.carbsG * servings).toFixed(1)),
          fatG: Number((food.fatG * servings).toFixed(1)),
          source: food.source,
        });
      }
    }

    if (matched.length > 0) {
      return {
        content: `I parsed ${matched.length} item(s) for **${mealCategory}**. Please review and confirm below before I save them to your local database:`,
        proposedFoodLogs: matched,
      };
    }

    return {
      content:
        'I detected a food logging request, but could not match specific items from your local food database. Try naming foods like "eggs", "roti", "paneer", "chicken breast", "rice", or "whey".',
    };
  }

  // 2. Remaining protein / macros
  if (q.includes('protein') || q.includes('macro') || q.includes('eat today') || q.includes('calorie')) {
    const consumedCal = Math.round(todayLogs.reduce((s, l) => s + l.calories, 0));
    const consumedProt = Math.round(todayLogs.reduce((s, l) => s + l.proteinG, 0));
    const calTarget = targets?.caloriesTarget ?? 2200;
    const protTarget = targets?.proteinTargetG ?? 150;
    const remCal = Math.max(0, calTarget - consumedCal);
    const remProt = Math.max(0, protTarget - consumedProt);

    if (q.includes('indian')) {
      return {
        content:
          `Here is a sample **~2,500 kcal Indian high-protein day** (estimated):\n` +
          `• **Breakfast**: 3 Whole Eggs + 2 Whole Wheat Rotis + 150g Greek Yogurt (~620 kcal, 38g protein)\n` +
          `• **Lunch**: 150g Paneer + 1.5 cups Basmati Rice + 1 bowl Yellow Dal (~880 kcal, 45g protein)\n` +
          `• **Pre-workout**: 1 Banana + 28g Almonds (~270 kcal, 7g protein)\n` +
          `• **Dinner / Post-workout**: 150g Chicken Breast (or 100g Paneer) + 2 Rotis + 1 scoop Whey (~730 kcal, 75g protein)\n` +
          `*Total: ~2,500 kcal | ~165g Protein*`,
      };
    }

    return {
      content:
        `Today you have consumed **${consumedCal} / ${calTarget} kcal** and **${consumedProt}g / ${protTarget}g protein**.\n` +
        `• Remaining: **${remCal} kcal** and **${remProt}g protein**.\n` +
        (remProt > 20
          ? `• Quick suggestion: 1 scoop Whey Isolate (25g protein) or 100g Chicken Breast (31g protein) or 100g Paneer (18g protein).`
          : `• You are right on track for your protein target!`),
    };
  }

  // 3. Today's workout
  if (q.includes('workout') || q.includes('routine') || q.includes('split')) {
    if (activePlan) {
      const daysSummary = activePlan.days.map((d) => `• **${d.dayName}** (${d.exercises.length} exercises)`).join('\n');
      return {
        content: `Your active plan is **${activePlan.name}** (${activePlan.splitType}):\n${daysSummary}\n\nHead to the **WORKOUT** tab to start a live session!`,
      };
    }
    return {
      content: 'You do not have an active workout plan selected. Open **WORKOUT → Plans** to activate Push/Pull/Legs, Upper/Lower, or Full Body.',
    };
  }

  // 4. Analyze last 7 days
  if (q.includes('7 days') || q.includes('seven days') || q.includes('analyze') || q.includes('progress')) {
    const cutoff = daysAgoISO(7);
    const recentWorkouts = await db.workoutSessions
      .where('status')
      .equals('completed')
      .filter((s) => s.date >= cutoff)
      .toArray();
    const recentFood = await db.foodLogs.where('date').aboveOrEqual(cutoff).toArray();
    const totalVol = recentWorkouts.reduce((s, w) => s + w.totalVolumeKg, 0);

    return {
      content:
        `**7-Day Summary**:\n` +
        `• Completed Workouts: **${recentWorkouts.length}**\n` +
        `• Total Training Volume: **${totalVol.toLocaleString()} kg**\n` +
        `• Food Entries Logged: **${recentFood.length}**\n` +
        (recentWorkouts.length < (profile?.workoutFrequencyPerWeek ?? 3)
          ? `• Tip: You're slightly below your ${profile?.workoutFrequencyPerWeek ?? 3}x/week target. Schedule your next session in **WORKOUT**.`
          : `• Great consistency this week!`),
    };
  }

  // 5. Weight plateau
  if (q.includes('weight') && (q.includes('stop') || q.includes('plateau') || q.includes('stuck'))) {
    return {
      content:
        `If your weight has plateaued:\n` +
        `1. Check your **7-day average** rather than single-day fluctuations.\n` +
        `2. Verify food logging accuracy (weighing oils, grains, and cooked vs. raw portions).\n` +
        `3. If your goal is **${profile?.objective.replace('_', ' ') ?? 'muscle gain'}**, consider adjusting your daily target by ±150–200 kcal in **Calculators**.`,
    };
  }

  return {
    content:
      `I'm your offline-first **GYM APP AI Assistant**. You can ask me:\n` +
      `• "What workout do I have today?"\n` +
      `• "How much protein do I still need?"\n` +
      `• "Log my breakfast: 2 eggs and 2 roti"\n` +
      `• "Analyze my last 7 days"\n` +
      `• "Suggest a 2,500-calorie Indian diet"`,
  };
}

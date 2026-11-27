import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { nutritionRepo } from '@/db/repositories/nutritionRepo';
import type { FoodCategory, FoodItem, MealCategory } from '@/db/types';
import { todayISO } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AIInlinePanel } from '@/components/ui/AIInlinePanel';
import { askFitnessAI } from '@/lib/ai/aiService';
import { Plus, Search, Trash2, Calculator, Star, Utensils, Sparkles, Check } from 'lucide-react';

const MEAL_CATEGORIES: MealCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Pre-workout', 'Post-workout'];
const FOOD_CATEGORIES: FoodCategory[] = [
  'Indian foods', 'Grains', 'Dairy', 'Fruits', 'Vegetables', 'Meat',
  'Eggs', 'Seafood', 'Nuts', 'Packaged foods', 'Homemade recipes', 'Supplements',
];

export function NutritionHub() {
  const { setSubView, addToast } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [activeCategory, setActiveCategory] = useState<MealCategory>('Breakfast');
  const [search, setSearch] = useState('');
  const [servingsMap, setServingsMap] = useState<Record<string, number>>({});
  const [showCustomFood, setShowCustomFood] = useState(false);

  // Custom food form
  const [cfName, setCfName] = useState('');
  const [cfCat, setCfCat] = useState<FoodCategory>('Indian foods');
  const [cfServing, setCfServing] = useState('100g');
  const [cfCal, setCfCal] = useState(150);
  const [cfProt, setCfProt] = useState(10);
  const [cfCarb, setCfCarb] = useState(15);
  const [cfFat, setCfFat] = useState(5);

  // AI Quick-Log Meal
  const [aiMealInput, setAiMealInput] = useState('');
  const [aiMealLoading, setAiMealLoading] = useState(false);
  const [aiProposed, setAiProposed] = useState<Omit<import('@/db/types').FoodLog, 'id' | 'createdAt'>[] | null>(null);

  const targets = useLiveQuery(() => db.nutritionTargets.get('active'), []);
  const logs = useLiveQuery(() => db.foodLogs.where('date').equals(selectedDate).toArray(), [selectedDate]) ?? [];
  const foods = useLiveQuery(() => db.foodItems.orderBy('name').toArray(), []) ?? [];

  const totalCal = Math.round(logs.reduce((s, l) => s + l.calories, 0));
  const totalProt = Math.round(logs.reduce((s, l) => s + l.proteinG, 0));
  const totalCarb = Math.round(logs.reduce((s, l) => s + l.carbsG, 0));
  const totalFat = Math.round(logs.reduce((s, l) => s + l.fatG, 0));

  const calTarget = targets?.caloriesTarget ?? 2200;
  const protTarget = targets?.proteinTargetG ?? 150;
  const carbTarget = targets?.carbsTargetG ?? 220;
  const fatTarget = targets?.fatTargetG ?? 70;

  const filteredFoods = foods.filter(
    (f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogFood = async (food: FoodItem) => {
    const servings = servingsMap[food.id] ?? 1;
    await nutritionRepo.addFoodLog({
      date: selectedDate,
      mealCategory: activeCategory,
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
    addToast({ title: `Added ${food.name}`, description: `${activeCategory} · ${Math.round(food.calories * servings)} kcal` });
  };

  const handleCreateCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfName.trim()) return;
    await nutritionRepo.saveCustomFood({
      name: cfName.trim(),
      category: cfCat,
      servingSizeLabel: cfServing,
      servingGrams: 100,
      calories: Number(cfCal),
      proteinG: Number(cfProt),
      carbsG: Number(cfCarb),
      fatG: Number(cfFat),
      source: 'user_entered',
      isFavorite: false,
    });
    setCfName('');
    setShowCustomFood(false);
    addToast({ title: 'Custom food saved to database' });
  };

  const handleAIParseMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMealInput.trim() || aiMealLoading) return;
    setAiMealLoading(true);
    setAiProposed(null);
    try {
      const res = await askFitnessAI(`Log my ${activeCategory.toLowerCase()}: ${aiMealInput.trim()}`, 'Nutrition Tracker');
      if (res.proposedFoodLogs && res.proposedFoodLogs.length > 0) {
        setAiProposed(res.proposedFoodLogs.map((l) => ({ ...l, date: selectedDate, mealCategory: activeCategory })));
      } else {
        addToast({ title: 'Could not parse foods', description: res.content, type: 'info' });
      }
    } finally {
      setAiMealLoading(false);
    }
  };

  const handleConfirmAIProposed = async () => {
    if (!aiProposed) return;
    for (const item of aiProposed) {
      await nutritionRepo.addFoodLog(item);
    }
    addToast({ title: 'AI meal logged', description: `${aiProposed.length} item(s) saved to ${activeCategory}.` });
    setAiProposed(null);
    setAiMealInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Nutrition</h1>
          <p className="text-xs text-zinc-400">Track daily meals, macros, and verified food sources.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100"
          />
          <Button size="sm" variant="outline" onClick={() => setSubView('calculators')}>
            <Calculator className="h-4 w-4" /> Calculators
          </Button>
        </div>
      </div>

      {/* Macro Summary */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-zinc-400">Calories</p>
            <p className="text-xl font-bold text-white">{totalCal} <span className="text-xs font-normal text-zinc-500">/ {calTarget}</span></p>
            <ProgressBar value={totalCal} max={calTarget} className="mt-2" />
            <p className="text-[11px] text-zinc-500 mt-1">{Math.max(0, calTarget - totalCal)} kcal left</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Protein</p>
            <p className="text-xl font-bold text-lime-400">{totalProt}g <span className="text-xs font-normal text-zinc-500">/ {protTarget}g</span></p>
            <ProgressBar value={totalProt} max={protTarget} className="mt-2" />
            <p className="text-[11px] text-zinc-500 mt-1">{Math.max(0, protTarget - totalProt)}g left</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Carbs</p>
            <p className="text-xl font-bold text-sky-400">{totalCarb}g <span className="text-xs font-normal text-zinc-500">/ {carbTarget}g</span></p>
            <ProgressBar value={totalCarb} max={carbTarget} colorClass="bg-sky-400" className="mt-2" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Fat</p>
            <p className="text-xl font-bold text-amber-400">{totalFat}g <span className="text-xs font-normal text-zinc-500">/ {fatTarget}g</span></p>
            <ProgressBar value={totalFat} max={fatTarget} colorClass="bg-amber-400" className="mt-2" />
          </div>
        </div>
      </Card>

      {/* AI Meal Suggestions & Quick-Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-lime-400/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-lime-400" />
              <CardTitle>AI Quick-Log ({activeCategory})</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={handleAIParseMeal} className="flex gap-2">
            <input
              value={aiMealInput}
              onChange={(e) => setAiMealInput(e.target.value)}
              placeholder="e.g. 2 boiled eggs and 2 rotis"
              className="flex-1 h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-xs text-white placeholder:text-zinc-500"
            />
            <Button type="submit" size="sm" disabled={aiMealLoading || !aiMealInput.trim()}>
              {aiMealLoading ? 'Parsing...' : 'Parse'}
            </Button>
          </form>
          {aiProposed && (
            <div className="mt-3 rounded-xl bg-zinc-900 p-3 border border-zinc-800 space-y-2">
              {aiProposed.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-zinc-200">
                  <span>{item.foodName} ({item.servingLabel})</span>
                  <span className="text-lime-400 font-semibold">{item.calories} kcal · {item.proteinG}g P</span>
                </div>
              ))}
              <Button size="sm" className="w-full" onClick={handleConfirmAIProposed}>
                <Check className="h-3.5 w-3.5" /> Confirm &amp; Save to {activeCategory}
              </Button>
            </div>
          )}
        </Card>

        <AIInlinePanel
          title="AI Macro & Meal Advisor"
          prompt="Based on my remaining calories and protein for today, suggest 2 practical high-protein meal options."
          contextHint="Nutrition Hub"
          buttonLabel="Suggest Meals"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Daily Meal Logs */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {MEAL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-lime-400 text-zinc-950 font-semibold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{activeCategory} Logs</CardTitle>
              <Badge>
                {Math.round(logs.filter((l) => l.mealCategory === activeCategory).reduce((s, l) => s + l.calories, 0))} kcal
              </Badge>
            </CardHeader>
            <div className="space-y-2">
              {logs.filter((l) => l.mealCategory === activeCategory).length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">No foods logged for {activeCategory} yet.</p>
              ) : (
                logs
                  .filter((l) => l.mealCategory === activeCategory)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-xl bg-zinc-900/70 px-3 py-2.5 border border-zinc-800/60"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{log.foodName}</p>
                        <p className="text-[11px] text-zinc-400">
                          {log.servingLabel} · {log.calories} kcal · P {log.proteinG}g · C {log.carbsG}g · F {log.fatG}g
                        </p>
                      </div>
                      <button
                        onClick={() => nutritionRepo.deleteFoodLog(log.id)}
                        className="text-zinc-500 hover:text-red-400 cursor-pointer p-1"
                        aria-label="Delete food log"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>

        {/* Right: Food Database Search & Custom Food */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Indian foods, grains, protein..."
                className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50"
              />
            </div>
            <Button size="md" variant="outline" onClick={() => setShowCustomFood(!showCustomFood)}>
              <Plus className="h-4 w-4" /> Custom
            </Button>
          </div>

          {showCustomFood && (
            <Card>
              <form onSubmit={handleCreateCustomFood} className="space-y-3">
                <CardTitle>Add Custom Food</CardTitle>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Food Name" value={cfName} onChange={(e) => setCfName(e.target.value)} required />
                  <Select label="Category" value={cfCat} onChange={(e) => setCfCat(e.target.value as FoodCategory)}>
                    {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <Input label="Serving" value={cfServing} onChange={(e) => setCfServing(e.target.value)} />
                  <Input label="Kcal" type="number" value={cfCal} onChange={(e) => setCfCal(Number(e.target.value))} />
                  <Input label="Prot (g)" type="number" value={cfProt} onChange={(e) => setCfProt(Number(e.target.value))} />
                  <Input label="Carb (g)" type="number" value={cfCarb} onChange={(e) => setCfCarb(Number(e.target.value))} />
                  <Input label="Fat (g)" type="number" value={cfFat} onChange={(e) => setCfFat(Number(e.target.value))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCustomFood(false)}>Cancel</Button>
                  <Button type="submit" size="sm">Save Food</Button>
                </div>
              </form>
            </Card>
          )}

          <Card className="max-h-[460px] overflow-y-auto space-y-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-lime-400" />
                <CardTitle>Food Database</CardTitle>
              </div>
              <span className="text-[11px] text-zinc-500">{filteredFoods.length} items</span>
            </CardHeader>
            {filteredFoods.map((food) => (
              <div
                key={food.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-zinc-900/70 p-3 border border-zinc-800/60"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => nutritionRepo.toggleFoodFavorite(food.id)}
                      className="text-zinc-500 hover:text-amber-400 cursor-pointer"
                    >
                      <Star className={`h-3.5 w-3.5 ${food.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <p className="text-xs font-semibold text-white truncate">{food.name}</p>
                    <Badge variant={food.source === 'verified' ? 'lime' : 'warning'}>{food.source}</Badge>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {food.servingSizeLabel} · {food.calories} kcal · P {food.proteinG}g · C {food.carbsG}g · F {food.fatG}g
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={servingsMap[food.id] ?? 1}
                    onChange={(e) => setServingsMap((m) => ({ ...m, [food.id]: Number(e.target.value) }))}
                    className="w-14 h-8 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-xs text-white text-center"
                    aria-label="Servings"
                  />
                  <Button size="sm" onClick={() => handleLogFood(food)}>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

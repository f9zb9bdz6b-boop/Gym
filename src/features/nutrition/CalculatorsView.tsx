import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { profileRepo } from '@/db/repositories/profileRepo';
import {
  ACTIVITY_MULTIPLIERS,
  calculateBMI,
  calculateBMR,
  calculateDailyCalorieTarget,
  calculateHydrationMl,
  calculateMacroTargets,
  calculateTDEE,
  calculateWeightProgression,
} from '@/lib/calculators';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Calculator, Check } from 'lucide-react';

export function CalculatorsView() {
  const { addToast } = useAppStore();
  const profile = useLiveQuery(() => db.userProfile.get('primary'), []);
  const targets = useLiveQuery(() => db.nutritionTargets.get('active'), []);

  const [manualCal, setManualCal] = useState<string>('');
  const [manualProt, setManualProt] = useState<string>('');
  const [manualCarb, setManualCarb] = useState<string>('');
  const [manualFat, setManualFat] = useState<string>('');

  if (!profile) {
    return (
      <Card className="text-center py-8 text-xs text-zinc-400">
        Complete your profile first to run personalized calculations.
      </Card>
    );
  }

  const bmr = calculateBMR(profile.currentWeightKg, profile.heightCm, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const calPlan = calculateDailyCalorieTarget(tdee, profile.objective);
  const macros = calculateMacroTargets(profile.currentWeightKg, calPlan.calories, profile.objective);
  const bmi = calculateBMI(profile.currentWeightKg, profile.heightCm);
  const hydrationMl = calculateHydrationMl(profile.currentWeightKg);
  const progression = calculateWeightProgression(profile.currentWeightKg, profile.targetWeightKg, calPlan.adjustment);

  const handleApplyManual = async (e: React.FormEvent) => {
    e.preventDefault();
    await profileRepo.saveNutritionTargets({
      caloriesTarget: manualCal ? Number(manualCal) : targets?.caloriesTarget ?? calPlan.calories,
      proteinTargetG: manualProt ? Number(manualProt) : targets?.proteinTargetG ?? macros.proteinG,
      carbsTargetG: manualCarb ? Number(manualCarb) : targets?.carbsTargetG ?? macros.carbsG,
      fatTargetG: manualFat ? Number(manualFat) : targets?.fatTargetG ?? macros.fatG,
      isManuallyCustomized: true,
    });
    addToast({ title: 'Manual targets saved', description: 'Profile updates will not overwrite your custom targets.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Calorie & Nutrition Calculators</h1>
        <p className="text-xs text-zinc-400">
          Based on Mifflin-St Jeor BMR &amp; configurable activity multipliers. All values are estimates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>BMR &amp; TDEE</CardTitle>
            <Badge variant="lime">Mifflin-St Jeor</Badge>
          </CardHeader>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Basal Metabolic Rate (BMR)</span>
              <strong className="text-white">{bmr} kcal/day</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Activity Multiplier</span>
              <strong className="text-zinc-200">{ACTIVITY_MULTIPLIERS[profile.activityLevel].factor}×</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-800">
              <span className="text-zinc-300 font-medium">Maintenance (TDEE)</span>
              <strong className="text-lime-400 text-sm">{tdee} kcal/day</strong>
            </div>
            <p className="text-[11px] text-zinc-500 pt-1">
              Assumes standard body composition; does not directly measure lean mass.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objective Target</CardTitle>
            <Badge>{profile.objective.replace('_', ' ')}</Badge>
          </CardHeader>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Recommended Intake</span>
              <strong className="text-lime-400 text-sm">{calPlan.calories} kcal/day</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Surplus / Deficit</span>
              <strong className="text-white">{calPlan.adjustment >= 0 ? `+${calPlan.adjustment}` : calPlan.adjustment} kcal</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Macros (P / C / F)</span>
              <strong className="text-zinc-200">{macros.proteinG}g / {macros.carbsG}g / {macros.fatG}g</strong>
            </div>
            <p className="text-[11px] text-zinc-500 pt-1">{calPlan.explanation}</p>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>BMI, Hydration &amp; Pace</CardTitle>
            <Calculator className="h-4 w-4 text-lime-400" />
          </CardHeader>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Body Mass Index (BMI)</span>
              <strong className="text-white">{bmi.bmi} ({bmi.category})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Daily Hydration Estimate</span>
              <strong className="text-sky-400">{hydrationMl} ml</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Est. Weekly Change</span>
              <strong className="text-zinc-200">{progression.weeklyChangeKg} kg/wk</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Est. Time to Target</span>
              <strong className="text-zinc-200">
                {progression.estimatedWeeks ? `~${progression.estimatedWeeks} weeks` : 'Maintenance / N/A'}
              </strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Manual Override */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Manual Target Override</CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">
              Customize your daily targets. Manual targets are preserved when you update your profile.
            </p>
          </div>
          {targets?.isManuallyCustomized && <Badge variant="warning">Customized</Badge>}
        </CardHeader>
        <form onSubmit={handleApplyManual} className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
          <Input label="Calories (kcal)" type="number" placeholder={String(targets?.caloriesTarget ?? calPlan.calories)} value={manualCal} onChange={(e) => setManualCal(e.target.value)} />
          <Input label="Protein (g)" type="number" placeholder={String(targets?.proteinTargetG ?? macros.proteinG)} value={manualProt} onChange={(e) => setManualProt(e.target.value)} />
          <Input label="Carbs (g)" type="number" placeholder={String(targets?.carbsTargetG ?? macros.carbsG)} value={manualCarb} onChange={(e) => setManualCarb(e.target.value)} />
          <Input label="Fat (g)" type="number" placeholder={String(targets?.fatTargetG ?? macros.fatG)} value={manualFat} onChange={(e) => setManualFat(e.target.value)} />
          <Button type="submit" className="w-full">
            <Check className="h-4 w-4" /> Save Custom
          </Button>
        </form>
      </Card>
    </div>
  );
}

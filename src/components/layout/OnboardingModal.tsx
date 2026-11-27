import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { profileRepo } from '@/db/repositories/profileRepo';
import { useAppStore } from '@/stores/useAppStore';
import { Dumbbell, Sparkles } from 'lucide-react';

const onboardingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce.number().int().min(13).max(100),
  gender: z.enum(['male', 'female', 'other']),
  heightCm: z.coerce.number().min(100).max(250),
  currentWeightKg: z.coerce.number().min(30).max(300),
  targetWeightKg: z.coerce.number().min(30).max(300),
  bodyFatPercent: z.coerce.number().min(3).max(60).optional().or(z.literal('')),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  objective: z.enum(['muscle_gain', 'fat_loss', 'maintenance', 'recomposition', 'strength', 'general_fitness']),
  workoutFrequencyPerWeek: z.coerce.number().int().min(1).max(7),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbells', 'Cable Machine', 'Machines', 'Bodyweight', 'Kettlebells', 'Resistance Bands'];

export function OnboardingModal() {
  const { setShowOnboarding, addToast } = useAppStore();
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['Barbell', 'Dumbbells', 'Bodyweight']);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema) as never,
    defaultValues: {
      name: '',
      age: 25,
      gender: 'male',
      heightCm: 175,
      currentWeightKg: 75,
      targetWeightKg: 78,
      activityLevel: 'moderate',
      experience: 'intermediate',
      objective: 'muscle_gain',
      workoutFrequencyPerWeek: 4,
    },
  });

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment((prev) => (prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]));
  };

  const onSubmit = async (data: OnboardingValues) => {
    setSaving(true);
    try {
      await profileRepo.saveProfile({
        name: data.name,
        age: data.age,
        gender: data.gender,
        heightCm: data.heightCm,
        currentWeightKg: data.currentWeightKg,
        targetWeightKg: data.targetWeightKg,
        bodyFatPercent: data.bodyFatPercent === '' ? undefined : Number(data.bodyFatPercent),
        activityLevel: data.activityLevel,
        experience: data.experience,
        objective: data.objective,
        workoutFrequencyPerWeek: data.workoutFrequencyPerWeek,
        availableEquipment: selectedEquipment,
        onboardingCompleted: true,
      });
      addToast({ title: 'Welcome to GYM APP!', description: 'Your local profile and targets are ready.' });
      setShowOnboarding(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl my-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-400 text-zinc-950">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Welcome to GYM APP</h2>
            <p className="text-xs text-zinc-400">
              100% local & private. Set up your profile to calculate your BMR, TDEE, and personalized targets.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Your Name" placeholder="e.g. Alex" {...register('name')} error={errors.name?.message} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Age" type="number" {...register('age')} error={errors.age?.message} />
              <Select label="Gender" {...register('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="Height (cm)" type="number" step="0.5" {...register('heightCm')} error={errors.heightCm?.message} />
            <Input label="Current Weight (kg)" type="number" step="0.1" {...register('currentWeightKg')} error={errors.currentWeightKg?.message} />
            <Input label="Target Weight (kg)" type="number" step="0.1" {...register('targetWeightKg')} error={errors.targetWeightKg?.message} />
            <Input label="Body Fat % (opt)" type="number" step="0.1" placeholder="e.g. 15" {...register('bodyFatPercent')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Fitness Objective" {...register('objective')}>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="fat_loss">Fat Loss</option>
              <option value="recomposition">Body Recomposition</option>
              <option value="strength">Strength Improvement</option>
              <option value="maintenance">Weight Maintenance</option>
              <option value="general_fitness">General Fitness</option>
            </Select>
            <Select label="Activity Level" {...register('activityLevel')}>
              <option value="sedentary">Sedentary (Desk job)</option>
              <option value="light">Lightly Active (1-3 days/wk)</option>
              <option value="moderate">Moderately Active (3-5 days/wk)</option>
              <option value="active">Very Active (6-7 days/wk)</option>
              <option value="very_active">Extra Active (Physical job + training)</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Experience Level" {...register('experience')}>
              <option value="beginner">Beginner (&lt; 1 year)</option>
              <option value="intermediate">Intermediate (1–3 years)</option>
              <option value="advanced">Advanced (3+ years)</option>
            </Select>
            <Input
              label="Workouts per Week"
              type="number"
              min={1}
              max={7}
              {...register('workoutFrequencyPerWeek')}
              error={errors.workoutFrequencyPerWeek?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Available Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const active = selectedEquipment.includes(eq);
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => toggleEquipment(eq)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${
                      active
                        ? 'bg-lime-400/15 text-lime-300 border-lime-400/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {eq}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Sparkles className="h-3.5 w-3.5 text-lime-400" />
              Stored locally in IndexedDB
            </span>
            <Button type="submit" disabled={saving}>
              {saving ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

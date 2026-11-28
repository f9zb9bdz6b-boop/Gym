import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { generateExerciseDetailsWithAI } from '@/lib/ai/aiService';
import type { ExerciseDifficulty, ExerciseLibraryItem, MuscleGroup } from '@/db/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/stores/useAppStore';
import { Search, Star, Plus, X, Dumbbell, Sparkles, Pencil } from 'lucide-react';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Core',
];

export function ExerciseLibraryView({ onSelectExercise }: { onSelectExercise?: (ex: ExerciseLibraryItem) => void }) {
  const { addToast } = useAppStore();
  const exercises = useLiveQuery(() => db.exerciseLibrary.orderBy('name').toArray(), []) ?? [];
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedEx, setSelectedEx] = useState<ExerciseLibraryItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>('Chest');
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState('Barbell');
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty>('intermediate');
  const [caloriesPerSet, setCaloriesPerSet] = useState<number>(8);
  const [instructionsText, setInstructionsText] = useState('');
  const [formGuidance, setFormGuidance] = useState('');
  const [mistakesText, setMistakesText] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrimaryMuscle('Chest');
    setSecondaryMuscles([]);
    setEquipment('Barbell');
    setDifficulty('intermediate');
    setCaloriesPerSet(8);
    setInstructionsText('');
    setFormGuidance('');
    setMistakesText('');
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (ex: ExerciseLibraryItem) => {
    setEditingId(ex.id);
    setName(ex.name);
    setPrimaryMuscle(ex.primaryMuscle);
    setSecondaryMuscles(ex.secondaryMuscles ?? []);
    setEquipment(ex.equipment);
    setDifficulty(ex.difficulty);
    setCaloriesPerSet(ex.caloriesBurnedPerSet ?? 8);
    setInstructionsText(ex.instructions.join('\n'));
    setFormGuidance(ex.formGuidance);
    setMistakesText(ex.commonMistakes.join('\n'));
    setShowForm(true);
  };

  const toggleSecondary = (m: MuscleGroup) => {
    if (m === primaryMuscle) return;
    setSecondaryMuscles((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const handleAutoFillAI = async () => {
    if (!name.trim()) {
      addToast({ title: 'Enter an exercise name first', type: 'error' });
      return;
    }
    setAiGenerating(true);
    try {
      const res = await generateExerciseDetailsWithAI({
        name: name.trim(),
        primaryMuscle,
        secondaryMuscles,
        equipment,
      });
      setInstructionsText(res.instructions.join('\n'));
      setFormGuidance(res.formGuidance);
      setMistakesText(res.commonMistakes.join('\n'));
      addToast({
        title: res.usedGemini ? 'Generated with Gemini' : 'Generated with Local Engine',
        description: 'You can customize any field before or after saving.',
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let instructions = instructionsText.split('\n').map((s) => s.trim()).filter(Boolean);
    let guidance = formGuidance.trim();
    let mistakes = mistakesText.split('\n').map((s) => s.trim()).filter(Boolean);

    // Auto-generate via Gemini/local if user left them blank
    if (instructions.length === 0 || !guidance || mistakes.length === 0) {
      setAiGenerating(true);
      try {
        const ai = await generateExerciseDetailsWithAI({
          name: name.trim(),
          primaryMuscle,
          secondaryMuscles,
          equipment,
        });
        if (instructions.length === 0) instructions = ai.instructions;
        if (!guidance) guidance = ai.formGuidance;
        if (mistakes.length === 0) mistakes = ai.commonMistakes;
      } finally {
        setAiGenerating(false);
      }
    }

    if (editingId) {
      await workoutRepo.updateExercise(editingId, {
        name: name.trim(),
        primaryMuscle,
        secondaryMuscles,
        equipment,
        difficulty,
        caloriesBurnedPerSet: Number(caloriesPerSet) || 8,
        instructions,
        formGuidance: guidance,
        commonMistakes: mistakes,
      });
      addToast({ title: 'Exercise updated' });
    } else {
      await workoutRepo.saveCustomExercise({
        name: name.trim(),
        primaryMuscle,
        secondaryMuscles,
        equipment,
        difficulty,
        category: 'hypertrophy',
        caloriesBurnedPerSet: Number(caloriesPerSet) || 8,
        instructions,
        formGuidance: guidance,
        commonMistakes: mistakes,
        mediaPlaceholder: 'Custom Exercise',
        isFavorite: false,
      });
      addToast({ title: 'Custom exercise added' });
    }

    setShowForm(false);
    resetForm();
  };

  const filtered = exercises.filter((ex) => {
    const matchSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = muscleFilter === 'ALL' || ex.primaryMuscle === muscleFilter;
    const matchFav = !onlyFavorites || ex.isFavorite;
    return matchSearch && matchMuscle && matchFav;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Exercise Library</h2>
          <p className="text-xs text-zinc-400">
            {exercises.length} exercises · Add custom exercises with Gemini auto-guidance &amp; edit anytime
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Custom Exercise
        </Button>
      </div>

      {showForm && (
        <Card className="border-lime-400/30">
          <form onSubmit={handleSave} className="space-y-4">
            <CardHeader>
              <CardTitle>{editingId ? 'Customize Exercise' : 'Add Custom Exercise'}</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAutoFillAI}
                disabled={aiGenerating}
              >
                <Sparkles className={`h-3.5 w-3.5 text-lime-400 ${aiGenerating ? 'animate-spin' : ''}`} />
                {aiGenerating ? 'Generating...' : 'Auto-Fill with Gemini'}
              </Button>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input label="Exercise Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Select label="Primary Muscle" value={primaryMuscle} onChange={(e) => setPrimaryMuscle(e.target.value as MuscleGroup)}>
                {MUSCLE_GROUPS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
              <Input label="Equipment" value={equipment} onChange={(e) => setEquipment(e.target.value)} />
              <Input
                label="Calories Burned / Set"
                type="number"
                min={1}
                value={caloriesPerSet}
                onChange={(e) => setCaloriesPerSet(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Secondary Muscle Groups</label>
              <div className="flex flex-wrap gap-1.5">
                {MUSCLE_GROUPS.filter((m) => m !== primaryMuscle).map((m) => {
                  const active = secondaryMuscles.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleSecondary(m)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-colors ${
                        active
                          ? 'bg-lime-400/15 text-lime-300 border-lime-400/40'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Instructions (one step per line — auto-filled if blank)
                </label>
                <textarea
                  rows={3}
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  placeholder="Step 1...&#10;Step 2..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-100 placeholder:text-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Common Mistakes (one per line — auto-filled if blank)
                </label>
                <textarea
                  rows={3}
                  value={mistakesText}
                  onChange={(e) => setMistakesText(e.target.value)}
                  placeholder="Mistake 1...&#10;Mistake 2..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-100 placeholder:text-zinc-500"
                />
              </div>
            </div>

            <Input
              label="Form Guidance (auto-filled if blank)"
              value={formGuidance}
              onChange={(e) => setFormGuidance(e.target.value)}
              placeholder="Key posture & tempo cues..."
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={aiGenerating}>
                {editingId ? 'Save Changes' : 'Save Exercise'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap gap-1.5">
        {(['ALL', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms'] as const).map((region) => (
          <button
            key={region}
            onClick={() => setMuscleFilter(region)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              muscleFilter === region
                ? 'bg-lime-400 text-zinc-950'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {region === 'ALL' ? `All (${exercises.length})` : `${region} (${exercises.filter((e) => e.primaryMuscle === region).length})`}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises or equipment..."
            className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50"
          />
        </div>
        <select
          value={muscleFilter}
          onChange={(e) => setMuscleFilter(e.target.value)}
          className="h-10 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 text-sm text-zinc-100"
        >
          <option value="ALL">All Muscles</option>
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <Button
          variant={onlyFavorites ? 'primary' : 'outline'}
          size="md"
          onClick={() => setOnlyFavorites(!onlyFavorites)}
        >
          <Star className="h-4 w-4" /> Favorites
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ex) => (
          <Card key={ex.id} className="hover:border-zinc-700 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => setSelectedEx(ex)}
                  className="text-left font-semibold text-sm text-white hover:text-lime-400 cursor-pointer"
                >
                  {ex.name}
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEdit(ex)}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                    aria-label="Edit exercise"
                    title="Customize exercise"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => workoutRepo.toggleExerciseFavorite(ex.id)}
                    className="text-zinc-500 hover:text-amber-400 cursor-pointer"
                    aria-label="Toggle favorite"
                  >
                    <Star className={`h-4 w-4 ${ex.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="lime">{ex.primaryMuscle}</Badge>
                {ex.subregion && <Badge>{ex.subregion}</Badge>}
                {ex.secondaryMuscles?.map((m) => <Badge key={m}>{m}</Badge>)}
                <Badge>{ex.equipment}</Badge>
                {ex.calorieEstimation?.metAssumption.sourceStatus === 'to_be_configured' ? (
                  <Badge>MET: To be configured</Badge>
                ) : ex.caloriesBurnedPerSet ? (
                  <Badge variant="warning">~{ex.caloriesBurnedPerSet} kcal/set</Badge>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-800/70">
              <button
                onClick={() => setSelectedEx(ex)}
                className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                View form &amp; cues
              </button>
              {onSelectExercise && (
                <Button size="sm" onClick={() => onSelectExercise(ex)}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {selectedEx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-lime-400" />
                <CardTitle>{selectedEx.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => { setSelectedEx(null); openEdit(selectedEx); }}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <button onClick={() => setSelectedEx(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <div className="space-y-4 text-xs">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="lime">{selectedEx.primaryMuscle}</Badge>
                {selectedEx.subregion && <Badge>{selectedEx.subregion}</Badge>}
                {selectedEx.secondaryMuscles.map((m) => <Badge key={m}>{m}</Badge>)}
                <Badge>{selectedEx.equipment}</Badge>
              </div>
              {selectedEx.primaryMuscles && (
                <div>
                  <p className="font-semibold text-zinc-200 mb-1">Primary &amp; Secondary Muscles</p>
                  <p className="text-zinc-300">Primary: {selectedEx.primaryMuscles.join(', ')}</p>
                  {selectedEx.secondaryMuscleLabels && selectedEx.secondaryMuscleLabels.length > 0 && (
                    <p className="text-zinc-400">Secondary: {selectedEx.secondaryMuscleLabels.join(', ')}</p>
                  )}
                </div>
              )}
              {selectedEx.safetyCautions && selectedEx.safetyCautions.length > 0 && (
                <div>
                  <p className="font-semibold text-amber-300 mb-1">Safety Cautions</p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400">
                    {selectedEx.safetyCautions.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
              {selectedEx.calorieEstimation?.metAssumption.sourceStatus === 'to_be_configured' && (
                <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800 text-zinc-400">
                  <p className="font-semibold text-zinc-200 mb-0.5">Calorie Estimation</p>
                  <p>Not configured yet (requires documented MET value &amp; source).</p>
                </div>
              )}
              <div>
                <p className="font-semibold text-zinc-200 mb-1">Instructions</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                  {selectedEx.instructions.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </div>
              <div>
                <p className="font-semibold text-zinc-200 mb-1">Form Guidance</p>
                <p className="text-zinc-400">{selectedEx.formGuidance}</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-200 mb-1">Common Mistakes</p>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  {selectedEx.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

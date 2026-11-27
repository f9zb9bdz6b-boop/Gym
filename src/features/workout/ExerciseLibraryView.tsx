import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import type { ExerciseLibraryItem, MuscleGroup } from '@/db/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/stores/useAppStore';
import { Search, Star, Plus, X, Dumbbell } from 'lucide-react';

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
  const [showCreate, setShowCreate] = useState(false);

  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('Chest');
  const [newEquip, setNewEquip] = useState('Barbell');
  const [newGuidance, setNewGuidance] = useState('');

  const filtered = exercises.filter((ex) => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) || ex.equipment.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = muscleFilter === 'ALL' || ex.primaryMuscle === muscleFilter;
    const matchFav = !onlyFavorites || ex.isFavorite;
    return matchSearch && matchMuscle && matchFav;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await workoutRepo.saveCustomExercise({
      name: newName.trim(),
      primaryMuscle: newMuscle,
      secondaryMuscles: [],
      equipment: newEquip,
      difficulty: 'intermediate',
      category: 'hypertrophy',
      instructions: [newGuidance || 'Perform with controlled form and full range of motion.'],
      formGuidance: newGuidance || 'Maintain neutral spine and controlled tempo.',
      commonMistakes: ['Using excessive momentum'],
      mediaPlaceholder: 'Custom Exercise',
      isFavorite: false,
    });
    setNewName('');
    setNewGuidance('');
    setShowCreate(false);
    addToast({ title: 'Custom exercise added' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Exercise Library</h2>
          <p className="text-xs text-zinc-400">{exercises.length} exercises across 12 muscle groups</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" /> Custom Exercise
        </Button>
      </div>

      {showCreate && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3">
            <CardTitle>Create Custom Exercise</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Exercise Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <Select label="Primary Muscle" value={newMuscle} onChange={(e) => setNewMuscle(e.target.value as MuscleGroup)}>
                {MUSCLE_GROUPS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
              <Input label="Equipment" value={newEquip} onChange={(e) => setNewEquip(e.target.value)} />
            </div>
            <Input label="Form Guidance" value={newGuidance} onChange={(e) => setNewGuidance(e.target.value)} placeholder="Key cues..." />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" size="sm">Save Exercise</Button>
            </div>
          </form>
        </Card>
      )}

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
                <button
                  onClick={() => workoutRepo.toggleExerciseFavorite(ex.id)}
                  className="text-zinc-500 hover:text-amber-400 cursor-pointer"
                  aria-label="Toggle favorite"
                >
                  <Star className={`h-4 w-4 ${ex.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="lime">{ex.primaryMuscle}</Badge>
                <Badge>{ex.equipment}</Badge>
                <Badge>{ex.difficulty}</Badge>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-800/70">
              <button
                onClick={() => setSelectedEx(ex)}
                className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                View form & cues
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
              <button onClick={() => setSelectedEx(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <div className="space-y-4 text-xs">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="lime">{selectedEx.primaryMuscle}</Badge>
                {selectedEx.secondaryMuscles.map((m) => <Badge key={m}>{m}</Badge>)}
                <Badge>{selectedEx.equipment}</Badge>
              </div>
              <div className="rounded-xl bg-zinc-900 p-3 border border-zinc-800 text-zinc-400 italic">
                {selectedEx.mediaPlaceholder ?? 'Demonstration asset placeholder'}
              </div>
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

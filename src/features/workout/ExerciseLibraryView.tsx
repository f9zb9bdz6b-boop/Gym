import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { generateExerciseDetailsWithAI } from '@/lib/ai/aiService';
import { ExerciseDetailView } from './ExerciseDetailView';
import { ExerciseQuickPreviewModal } from './ExerciseQuickPreviewModal';
import { VisualMuscleSelector } from './VisualMuscleSelector';
import type { ExerciseCategory, ExerciseDifficulty, ExerciseLibraryItem, MuscleGroup } from '@/db/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/useAppStore';
import {
  Activity,
  ChevronRight,
  Clock,
  Dumbbell,
  Eye,
  Flame,
  Image as ImageIcon,
  Layers,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Adductors', 'Abductors',
  'Abdominals', 'Obliques', 'Spinal Stability', 'Anti-Extension', 'Anti-Rotation', 'Anti-Lateral-Flexion',
];

const BODY_REGIONS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Adductors',
  'Abductors',
  'Abdominals',
  'Obliques',
  'Spinal Stability',
  'Anti-Extension',
  'Anti-Rotation',
  'Anti-Lateral-Flexion',
] as const;

type SortOption = 'alphabetical' | 'popularity' | 'newest';
const RECENT_STORAGE_KEY = 'gym_app_recent_exercises';

function getRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function recordRecentId(id: string): string[] {
  const prev = getRecentIds().filter((x) => x !== id);
  const next = [id, ...prev].slice(0, 10);
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
  return next;
}

function matchesRegion(ex: ExerciseLibraryItem, region: string): boolean {
  if (region === 'ALL') return true;
  if (region === 'Quadriceps') {
    return ex.primaryMuscle === 'Quadriceps' || ex.subregion === 'Quads' || ex.subregion === 'Quadriceps';
  }
  return ex.primaryMuscle === region || ex.subregion === region;
}

export function ExerciseLibraryView({ onSelectExercise }: { onSelectExercise?: (ex: ExerciseLibraryItem) => void }) {
  const { addToast } = useAppStore();
  const exercises = useLiveQuery(() => db.exerciseLibrary.orderBy('name').toArray(), []) ?? [];

  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [showFilters, setShowFilters] = useState(false);
  const [showMuscleSelector, setShowMuscleSelector] = useState(false);

  const [recentIds, setRecentIds] = useState<string[]>(() => getRecentIds());
  const [previewEx, setPreviewEx] = useState<ExerciseLibraryItem | null>(null);
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

  const openDetails = (ex: ExerciseLibraryItem) => {
    setRecentIds(recordRecentId(ex.id));
    setSelectedEx(ex);
  };

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

  const equipmentOptions = useMemo(() => {
    const set = new Set(exercises.map((e) => e.equipment).filter(Boolean));
    return Array.from(set).sort();
  }, [exercises]);

  const categoryOptions: ExerciseCategory[] = [
    'strength', 'hypertrophy', 'compound', 'isolation', 'isometric', 'cardio', 'mobility',
  ];

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of BODY_REGIONS) {
      counts[r] = exercises.filter((ex) => matchesRegion(ex, r)).length;
    }
    return counts;
  }, [exercises]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = exercises.filter((ex) => {
      if (onlyFavorites && !ex.isFavorite) return false;
      if (!matchesRegion(ex, muscleFilter)) return false;
      if (equipmentFilter !== 'ALL' && ex.equipment !== equipmentFilter) return false;
      if (difficultyFilter !== 'ALL' && ex.difficulty !== difficultyFilter) return false;
      if (categoryFilter !== 'ALL' && ex.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscle.toLowerCase().includes(q) ||
        (ex.subregion && ex.subregion.toLowerCase().includes(q)) ||
        ex.equipment.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'popularity') {
        const scoreA = (a.isFavorite ? 2 : 0) + (a.lastUsedAt ? 1 : 0);
        const scoreB = (b.isFavorite ? 2 : 0) + (b.lastUsedAt ? 1 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
      } else if (sortBy === 'newest') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      return a.name.localeCompare(b.name);
    });
  }, [exercises, search, onlyFavorites, muscleFilter, equipmentFilter, difficultyFilter, categoryFilter, sortBy]);

  const hasActiveFilters =
    search.trim() !== '' ||
    muscleFilter !== 'ALL' ||
    equipmentFilter !== 'ALL' ||
    difficultyFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    onlyFavorites;

  const clearAllFilters = () => {
    setSearch('');
    setMuscleFilter('ALL');
    setEquipmentFilter('ALL');
    setDifficultyFilter('ALL');
    setCategoryFilter('ALL');
    setOnlyFavorites(false);
  };

  // Discovery sections (only shown when no active filter narrows the catalog)
  const favoriteExercises = useMemo(() => exercises.filter((e) => e.isFavorite).slice(0, 6), [exercises]);
  const recentExercises = useMemo(
    () => recentIds.map((id) => exercises.find((e) => e.id === id)).filter((e): e is ExerciseLibraryItem => Boolean(e)).slice(0, 6),
    [recentIds, exercises]
  );
  const popularExercises = useMemo(
    () => exercises.filter((e) => e.isFavorite || e.lastUsedAt).slice(0, 6),
    [exercises]
  );
  const recentlyAddedExercises = useMemo(
    () => exercises.filter((e) => e.isCustom).slice(0, 6),
    [exercises]
  );
  const recommendedExercises = useMemo(
    () => exercises.filter((e) => e.category === 'compound' || e.category === 'strength').slice(0, 6),
    [exercises]
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 p-6 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/25 bg-lime-400/10 px-3 py-1 text-xs font-medium text-lime-300">
              <Dumbbell className="h-3.5 w-3.5" />
              Exercise Discovery
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Exercise <span className="text-lime-400">Library</span>
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Explore {exercises.length} exercises across {BODY_REGIONS.length} anatomical regions with
              step-by-step form guidance, safety cues, and muscle targeting.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-lime-400" />
                <strong className="text-white">{exercises.length}</strong> Exercises
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-purple-400" />
                <strong className="text-white">{BODY_REGIONS.length}</strong> Body Regions
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto lg:min-w-[380px]">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, muscle, or equipment..."
                className="pl-10 bg-zinc-950/90 border-zinc-800 h-11 rounded-2xl"
              />
            </div>
            <Button onClick={openCreate} className="h-11 rounded-2xl shrink-0">
              <Plus className="h-4 w-4" /> Custom
            </Button>
          </div>
        </div>
      </section>

      {/* Body Region Explorer */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white">Browse by Body Region</h2>
            <p className="text-xs text-zinc-400">Select a region to filter exercises</p>
          </div>
          <div className="flex items-center gap-2">
            {muscleFilter !== 'ALL' && (
              <Button size="sm" variant="ghost" onClick={() => setMuscleFilter('ALL')}>
                All Regions
              </Button>
            )}
            <Button
              size="sm"
              variant={showMuscleSelector ? 'primary' : 'outline'}
              onClick={() => setShowMuscleSelector((v) => !v)}
            >
              <Activity className="h-3.5 w-3.5" />
              {showMuscleSelector ? 'Hide Body Map' : 'Body Map'}
            </Button>
          </div>
        </div>

        {showMuscleSelector && (
          <VisualMuscleSelector selectedRegion={muscleFilter} onSelectRegion={setMuscleFilter} />
        )}

        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-2.5 overflow-x-auto pb-2 md:pb-0">
          {BODY_REGIONS.map((region) => {
            const active = muscleFilter === region;
            const count = regionCounts[region] ?? 0;
            return (
              <button
                key={region}
                onClick={() => setMuscleFilter(active ? 'ALL' : region)}
                className={`group shrink-0 w-40 md:w-auto rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                  active
                    ? 'border-lime-400/50 bg-lime-400/10 shadow-sm'
                    : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold truncate ${active ? 'text-lime-300' : 'text-white'}`}>
                    {region}
                  </span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                      active ? 'text-lime-300' : 'text-zinc-500'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">{count} exercises</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Discovery Sections (when browsing unfiltered) */}
      {!hasActiveFilters && (
        <div className="space-y-6">
          {recentExercises.length > 0 && (
            <DiscoveryStrip
              title="Recently Viewed"
              icon={Clock}
              items={recentExercises}
              onOpen={openDetails}
            />
          )}
          {favoriteExercises.length > 0 && (
            <DiscoveryStrip
              title="Your Favourites"
              icon={Star}
              items={favoriteExercises}
              onOpen={openDetails}
            />
          )}
          {popularExercises.length > 0 && (
            <DiscoveryStrip
              title="Popular Exercises"
              icon={Flame}
              items={popularExercises}
              onOpen={openDetails}
            />
          )}
          {recentlyAddedExercises.length > 0 && (
            <DiscoveryStrip
              title="Recently Added"
              icon={Plus}
              items={recentlyAddedExercises}
              onOpen={openDetails}
            />
          )}
          {recommendedExercises.length > 0 && (
            <DiscoveryStrip
              title="Recommended Compound & Strength"
              icon={Sparkles}
              items={recommendedExercises}
              onOpen={openDetails}
            />
          )}
        </div>
      )}

      {/* Filter & Sort Bar */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">
              {muscleFilter === 'ALL' ? 'All Exercises' : muscleFilter}
            </h2>
            <span className="text-xs text-zinc-400">({filtered.length})</span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-lime-300 hover:text-lime-200 ml-2 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={onlyFavorites ? 'primary' : 'outline'}
              onClick={() => setOnlyFavorites((v) => !v)}
            >
              <Star className={`h-3.5 w-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
              Favourites
            </Button>
            <Button
              size="sm"
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </Button>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-8 text-xs w-auto bg-zinc-900 border-zinc-800"
            >
              <option value="alphabetical">Sort: A–Z</option>
              <option value="popularity">Sort: Popularity</option>
              <option value="newest">Sort: Newest</option>
            </Select>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <Select
              label="Equipment"
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
            >
              <option value="ALL">All Equipment</option>
              {equipmentOptions.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </Select>
            <Select
              label="Difficulty"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <option value="ALL">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
            <Select
              label="Exercise Type"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Exercise Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-10 text-center space-y-2">
            <p className="text-sm font-medium text-zinc-300">No exercises match your filters</p>
            <p className="text-xs text-zinc-500">Try clearing your search or switching body regions.</p>
            <Button size="sm" variant="outline" onClick={clearAllFilters} className="mt-2">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-4">
            {filtered.map((ex) => {
              const demoUri = ex.images?.demonstration?.uri || null;
              return (
                <div
                  key={ex.id}
                  className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/50 overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition-all"
                >
                  <div>
                    <div
                      onClick={() => openDetails(ex)}
                      className="relative aspect-video bg-zinc-950 flex items-center justify-center cursor-pointer overflow-hidden border-b border-zinc-800/70"
                    >
                      {demoUri ? (
                        <img
                          src={demoUri}
                          alt={ex.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-600 gap-1">
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                            {ex.subregion || ex.primaryMuscle}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          workoutRepo.toggleExerciseFavorite(ex.id);
                        }}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 border border-zinc-700/60 flex items-center justify-center text-zinc-300 hover:text-amber-400 cursor-pointer"
                        aria-label="Toggle favorite"
                      >
                        <Star className={`h-3.5 w-3.5 ${ex.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>

                    <div className="p-3.5 space-y-1.5">
                      <button
                        onClick={() => openDetails(ex)}
                        className="text-left text-xs md:text-sm font-semibold text-white hover:text-lime-300 line-clamp-1 cursor-pointer"
                      >
                        {ex.name}
                      </button>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">
                        {ex.primaryMuscle} · {ex.equipment}
                      </p>
                      {ex.difficulty && (
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{ex.difficulty}</p>
                      )}
                    </div>
                  </div>

                  <div className="px-3.5 pb-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewEx(ex)}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(ex)}
                        className="text-zinc-500 hover:text-white cursor-pointer p-1"
                        aria-label="Edit exercise"
                        title="Edit exercise"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {onSelectExercise && (
                        <Button size="sm" onClick={() => onSelectExercise(ex)}>
                          <Plus className="h-3 w-3" /> Add
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Custom / Edit Exercise Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingId ? 'Customize Exercise' : 'Create Custom Exercise'}</CardTitle>
              <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label="Exercise Name"
                    placeholder="e.g. Cable Bayesian Curl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <Button type="button" variant="outline" onClick={handleAutoFillAI} disabled={aiGenerating}>
                  <Sparkles className="h-3.5 w-3.5 text-lime-400" />
                  {aiGenerating ? 'Generating...' : 'AI Fill'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Primary Muscle"
                  value={primaryMuscle}
                  onChange={(e) => setPrimaryMuscle(e.target.value as MuscleGroup)}
                >
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Equipment"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="Barbell, Dumbbell, Cable..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as ExerciseDifficulty)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
                <Input
                  label="Est. Calories / Set"
                  type="number"
                  value={caloriesPerSet}
                  onChange={(e) => setCaloriesPerSet(Number(e.target.value))}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-400 mb-1.5">Secondary Muscles</p>
                <div className="flex flex-wrap gap-1.5">
                  {MUSCLE_GROUPS.filter((m) => m !== primaryMuscle).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => toggleSecondary(m)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium cursor-pointer border ${
                        secondaryMuscles.includes(m)
                          ? 'bg-lime-400/15 border-lime-400/40 text-lime-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">
                  Instructions (one step per line — leave blank to auto-generate)
                </label>
                <textarea
                  rows={3}
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  placeholder="Step 1...&#10;Step 2..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100 focus:border-lime-400 focus:outline-none"
                />
              </div>
              <Input
                label="Form Guidance (leave blank to auto-generate)"
                value={formGuidance}
                onChange={(e) => setFormGuidance(e.target.value)}
                placeholder="Keep elbows tucked..."
              />
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">
                  Common Mistakes (one per line — leave blank to auto-generate)
                </label>
                <textarea
                  rows={2}
                  value={mistakesText}
                  onChange={(e) => setMistakesText(e.target.value)}
                  placeholder="Using momentum..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100 focus:border-lime-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={aiGenerating}>
                  {aiGenerating ? 'Saving...' : editingId ? 'Save Changes' : 'Create Exercise'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {previewEx && (
        <ExerciseQuickPreviewModal
          exercise={previewEx}
          onClose={() => setPreviewEx(null)}
          onViewFullDetails={(ex) => openDetails(ex)}
          onSelectExercise={onSelectExercise}
        />
      )}

      {selectedEx && (
        <ExerciseDetailView
          exercise={selectedEx}
          allExercises={exercises}
          onClose={() => setSelectedEx(null)}
          onEdit={(ex) => openEdit(ex)}
          onSelectExercise={onSelectExercise}
          onNavigateExercise={(ex) => openDetails(ex)}
        />
      )}
    </div>
  );
}

function DiscoveryStrip({
  title,
  icon: Icon,
  items,
  onOpen,
}: {
  title: string;
  icon: typeof Star;
  items: ExerciseLibraryItem[];
  onOpen: (ex: ExerciseLibraryItem) => void;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-lime-400" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onOpen(ex)}
            className="shrink-0 w-52 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-3 text-left hover:border-zinc-700 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <p className="text-xs font-semibold text-white line-clamp-1">{ex.name}</p>
            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
              {ex.subregion || ex.primaryMuscle} · {ex.equipment}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

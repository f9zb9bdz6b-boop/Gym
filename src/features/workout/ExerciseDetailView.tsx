import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  Image as ImageIcon,
  Info,
  ListChecks,
  Pencil,
  Plus,
  ShieldAlert,
  Sparkles,
  Star,
  Wind,
  X,
  XCircle,
} from 'lucide-react';
import type { ExerciseLibraryItem } from '@/db/types';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { generateExerciseDetailsWithAI } from '@/lib/ai/aiService';
import { resolveExerciseImage } from '@/data/exerciseImages';
import { ExerciseImage } from '@/components/ui/ExerciseImage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AnatomyViewerPanel } from '@/features/anatomy/components/AnatomyViewerPanel';

type DetailTab = 'overview' | 'anatomy' | 'instructions' | 'safety' | 'met';
type GallerySlot = 'starting' | 'mid' | 'finishing' | 'angles' | 'video';

interface ExerciseDetailViewProps {
  exercise: ExerciseLibraryItem;
  allExercises: ExerciseLibraryItem[];
  onClose: () => void;
  onEdit: (exercise: ExerciseLibraryItem) => void;
  onSelectExercise?: (exercise: ExerciseLibraryItem) => void;
  onNavigateExercise: (exercise: ExerciseLibraryItem) => void;
}

const TABS: { id: DetailTab; label: string; icon: typeof Dumbbell }[] = [
  { id: 'overview', label: 'Overview', icon: Dumbbell },
  { id: 'anatomy', label: 'Muscle Anatomy', icon: Activity },
  { id: 'instructions', label: 'Instructions', icon: ListChecks },
  { id: 'safety', label: 'Safety & Mistakes', icon: ShieldAlert },
  { id: 'met', label: 'MET & Calories', icon: Flame },
];

const GALLERY_SLOTS: { id: GallerySlot; label: string }[] = [
  { id: 'starting', label: 'Starting' },
  { id: 'mid', label: 'Mid-Movement' },
  { id: 'finishing', label: 'Finishing' },
  { id: 'angles', label: 'Angles' },
  { id: 'video', label: 'Video' },
];

export function ExerciseDetailView({
  exercise,
  allExercises,
  onClose,
  onEdit,
  onSelectExercise,
  onNavigateExercise,
}: ExerciseDetailViewProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [gallerySlot, setGallerySlot] = useState<GallerySlot>('starting');
  const [bodyWeightKg, setBodyWeightKg] = useState<number>(75);
  const [durationMin, setDurationMin] = useState<number>(15);
  const [compareTarget, setCompareTarget] = useState<ExerciseLibraryItem | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);

  const relatedExercises = useMemo(() => {
    return allExercises
      .filter(
        (ex) =>
          ex.id !== exercise.id &&
          (ex.primaryMuscle === exercise.primaryMuscle || ex.subregion === exercise.subregion)
      )
      .slice(0, 4);
  }, [allExercises, exercise]);

  const alternativeExercises = useMemo(() => {
    return allExercises
      .filter(
        (ex) =>
          ex.id !== exercise.id &&
          ex.primaryMuscle === exercise.primaryMuscle &&
          ex.equipment !== exercise.equipment
      )
      .slice(0, 3);
  }, [allExercises, exercise]);

  const suggestedPrescription = useMemo(() => {
    if (exercise.category === 'isometric') {
      return { sets: '3–4', reps: '30–45s hold', rest: '45–60s' };
    }
    if (exercise.category === 'compound' || exercise.category === 'strength') {
      return { sets: '3–4', reps: '6–10', rest: '90–120s' };
    }
    return { sets: '3', reps: '10–15', rest: '60s' };
  }, [exercise.category]);

  const metValue =
    exercise.calorieEstimation?.metAssumption.sourceStatus === 'configured' &&
    typeof exercise.calorieEstimation.metAssumption.value === 'number'
      ? exercise.calorieEstimation.metAssumption.value
      : null;

  const estimatedCalories =
    metValue !== null ? Math.round(((metValue * 3.5 * bodyWeightKg) / 200) * durationMin) : null;

  const resolvedDemo = resolveExerciseImage(exercise);
  const demoUri = resolvedDemo.src;
  const anatomyUri = exercise.images?.muscleAnatomy?.uri || null;

  async function handleAskAI() {
    setAiLoading(true);
    setAiTip(null);
    try {
      const res = await generateExerciseDetailsWithAI({
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscles: exercise.secondaryMuscles || [],
        equipment: exercise.equipment,
      });
      setAiTip(res.formGuidance || res.instructions.join(' '));
    } catch {
      setAiTip('Focus on controlled tempo, full range of motion, and steady breathing.');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${exercise.name} details`}
    >
      <div className="relative flex flex-col w-full h-full md:h-auto md:max-h-[92vh] md:max-w-5xl bg-zinc-950 md:rounded-3xl border border-zinc-800/80 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-6 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-lime-400/10 border border-lime-400/25 flex items-center justify-center shrink-0">
              <Dumbbell className="h-4 w-4 text-lime-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-white truncate">{exercise.name}</h2>
                <Badge variant="lime">{exercise.subregion || exercise.primaryMuscle}</Badge>
              </div>
              <p className="text-xs text-zinc-400 truncate capitalize">
                {exercise.equipment} · {exercise.difficulty} · {exercise.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => workoutRepo.toggleExerciseFavorite(exercise.id)}
              className="h-9 w-9 rounded-xl border border-zinc-800 bg-zinc-900/70 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-zinc-700 transition-colors cursor-pointer"
              aria-label="Toggle favorite"
              title="Toggle favorite"
            >
              <Star className={`h-4 w-4 ${exercise.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(exercise);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            {onSelectExercise && (
              <Button size="sm" onClick={() => onSelectExercise(exercise)}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add to Workout</span>
              </Button>
            )}
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-zinc-800 bg-zinc-900/70 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 px-4 py-2.5 md:px-6 border-b border-zinc-800/70 bg-zinc-900/40 overflow-x-auto shrink-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-lime-400/15 text-lime-300 border border-lime-400/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Media Gallery */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="relative aspect-video rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden flex items-center justify-center">
                    {demoUri ? (
                      <ExerciseImage
                        src={demoUri}
                        alt={resolvedDemo.alt}
                        imgClassName="object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                        <div className="h-12 w-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-zinc-500" />
                        </div>
                        <p className="text-sm font-medium text-zinc-300">
                          {GALLERY_SLOTS.find((s) => s.id === gallerySlot)?.label} View
                        </p>
                        <p className="text-xs text-zinc-500 max-w-xs">
                          No licensed demonstration asset configured for this exercise yet.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {GALLERY_SLOTS.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setGallerySlot(slot.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          gallerySlot === slot.id
                            ? 'bg-zinc-800 text-lime-300 border border-lime-400/30'
                            : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metadata & Prescription */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Suggested Prescription
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3 text-center">
                        <p className="text-[11px] text-zinc-500">Sets</p>
                        <p className="text-sm font-bold text-white mt-0.5">{suggestedPrescription.sets}</p>
                      </div>
                      <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3 text-center">
                        <p className="text-[11px] text-zinc-500">Reps / Hold</p>
                        <p className="text-sm font-bold text-lime-300 mt-0.5">{suggestedPrescription.reps}</p>
                      </div>
                      <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3 text-center">
                        <p className="text-[11px] text-zinc-500">Rest</p>
                        <p className="text-sm font-bold text-white mt-0.5">{suggestedPrescription.rest}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Muscles Targeted
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-zinc-500 block mb-1">Primary</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(exercise.primaryMuscles?.length
                            ? exercise.primaryMuscles
                            : [exercise.primaryMuscle]
                          ).map((m) => (
                            <Badge key={m} variant="lime">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {(exercise.secondaryMuscleLabels?.length || exercise.secondaryMuscles?.length) ? (
                        <div>
                          <span className="text-zinc-500 block mb-1">Secondary</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(exercise.secondaryMuscleLabels?.length
                              ? exercise.secondaryMuscleLabels
                              : exercise.secondaryMuscles
                            ).map((m) => (
                              <Badge key={m}>{m}</Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* AI Exercise Assistant */}
                  <div className="rounded-2xl border border-purple-500/25 bg-purple-500/5 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-semibold text-purple-200">AI Exercise Coach</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleAskAI} disabled={aiLoading}>
                        {aiLoading ? 'Thinking...' : 'Get Coaching Tip'}
                      </Button>
                    </div>
                    {aiTip && <p className="text-xs text-zinc-300 leading-relaxed pt-1">{aiTip}</p>}
                  </div>
                </div>
              </div>

              {/* Related & Alternative Exercises + Comparison */}
              {(relatedExercises.length > 0 || alternativeExercises.length > 0) && (
                <div className="space-y-3 pt-2 border-t border-zinc-800/70">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Related &amp; Alternative Exercises</h3>
                    {compareTarget && (
                      <button
                        onClick={() => setCompareTarget(null)}
                        className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Close comparison
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {relatedExercises.map((rel) => (
                      <div
                        key={rel.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3.5 flex flex-col justify-between gap-3 hover:border-zinc-700 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white line-clamp-1">{rel.name}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5 capitalize">
                            {rel.equipment} · {rel.difficulty}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => setCompareTarget(rel)}
                            className="inline-flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200 cursor-pointer"
                          >
                            <ArrowLeftRight className="h-3 w-3" /> Compare
                          </button>
                          <button
                            onClick={() => onNavigateExercise(rel)}
                            className="inline-flex items-center gap-1 text-[11px] text-lime-300 hover:text-lime-200 cursor-pointer"
                          >
                            Open <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {compareTarget && (
                    <div className="rounded-2xl border border-purple-500/30 bg-zinc-900/80 p-4 space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                        Exercise Comparison
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-zinc-500 font-medium">Attribute</div>
                        <div className="text-white font-semibold">{exercise.name}</div>
                        <div className="text-white font-semibold">{compareTarget.name}</div>

                        <div className="text-zinc-500">Equipment</div>
                        <div className="text-zinc-300 capitalize">{exercise.equipment}</div>
                        <div className="text-zinc-300 capitalize">{compareTarget.equipment}</div>

                        <div className="text-zinc-500">Difficulty</div>
                        <div className="text-zinc-300 capitalize">{exercise.difficulty}</div>
                        <div className="text-zinc-300 capitalize">{compareTarget.difficulty}</div>

                        <div className="text-zinc-500">Category</div>
                        <div className="text-zinc-300 capitalize">{exercise.category}</div>
                        <div className="text-zinc-300 capitalize">{compareTarget.category}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. MUSCLE ANATOMY */}
          {activeTab === 'anatomy' && (
            <div className="space-y-4">
              {anatomyUri && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden max-w-xs">
                  <img src={anatomyUri} alt={`${exercise.name} anatomy`} className="w-full h-auto" />
                </div>
              )}
              <AnatomyViewerPanel exercise={exercise} />
            </div>
          )}

          {/* 3. INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-3">
                <h3 className="text-sm font-semibold text-white">Step-by-Step Execution</h3>
                {exercise.instructions.length > 0 ? (
                  <div className="space-y-3">
                    {exercise.instructions.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"
                      >
                        <div className="h-7 w-7 rounded-full bg-lime-400/15 border border-lime-400/30 text-lime-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-xs md:text-sm text-zinc-200 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No step-by-step instructions recorded.</p>
                )}
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-lime-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider">Form Guidance</h4>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {exercise.formGuidance || 'Maintain neutral posture and control both concentric and eccentric phases.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-teal-300">
                    <Wind className="h-4 w-4" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider">Breathing Technique</h4>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Inhale during the lowering (eccentric) phase, brace your core, and exhale steadily through the exertion (concentric) phase.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. SAFETY & COMMON MISTAKES */}
          {activeTab === 'safety' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">Safety Precautions</h3>
                </div>
                {exercise.safetyCautions && exercise.safetyCautions.length > 0 ? (
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {exercise.safetyCautions.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-400">
                    Warm up thoroughly and stop immediately if you feel sharp joint pain.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-300">
                  <XCircle className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">Common Mistakes</h3>
                </div>
                {exercise.commonMistakes.length > 0 ? (
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {exercise.commonMistakes.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-400 mt-0.5">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-400">No common mistakes recorded.</p>
                )}
              </div>

              <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4 space-y-2 md:col-span-2">
                <div className="flex items-center gap-2 text-lime-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">Recommended Corrections</h3>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {exercise.formGuidance || 'Reduce load if form breaks down, keep joints stacked, and prioritize full range of motion.'}
                </p>
              </div>
            </div>
          )}

          {/* 5. MET & CALORIES */}
          {activeTab === 'met' && (
            <div className="space-y-6">
              {metValue === null ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-zinc-200">
                    <Info className="h-5 w-5 text-lime-400" />
                    <h3 className="text-sm font-semibold">MET Value Not Configured</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    A verified MET value and source reference have not been configured for{' '}
                    <span className="text-zinc-200 font-medium">{exercise.name}</span>. To keep calorie
                    estimates transparent and accurate, no numeric estimate is shown until a documented MET
                    value is provided.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-400">Estimated Energy Expenditure</p>
                        <p className="text-3xl font-bold text-lime-300 mt-1">
                          ~{estimatedCalories} <span className="text-sm font-normal text-zinc-400">kcal</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-400">Verified MET</p>
                        <p className="text-xl font-bold text-white mt-1">{metValue.toFixed(1)} METs</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <label className="space-y-1.5 text-xs">
                        <span className="text-zinc-400">Body Weight (kg)</span>
                        <input
                          type="number"
                          min={30}
                          max={250}
                          value={bodyWeightKg}
                          onChange={(e) => setBodyWeightKg(Math.max(30, Number(e.target.value) || 75))}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1.5 text-xs">
                        <span className="text-zinc-400">Duration (minutes)</span>
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={durationMin}
                          onChange={(e) => setDurationMin(Math.max(1, Number(e.target.value) || 15))}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3 text-xs">
                    <h4 className="font-semibold text-white">Calculation &amp; Source</h4>
                    <p className="text-zinc-400 leading-relaxed">
                      Formula: <code className="text-lime-300">Calories = MET × 3.5 × weight(kg) ÷ 200 × min</code>
                    </p>
                    {exercise.calorieEstimation?.metAssumption.sourceName && (
                      <p className="text-zinc-400">
                        Source: <span className="text-zinc-200">{exercise.calorieEstimation.metAssumption.sourceName}</span>
                      </p>
                    )}
                    <p className="text-zinc-500">
                      Note: This is an estimate based on standard MET tables, not a directly measured value.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

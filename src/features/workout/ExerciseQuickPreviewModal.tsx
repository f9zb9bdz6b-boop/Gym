import { ArrowRight, Dumbbell, Image as ImageIcon, Star, X } from 'lucide-react';
import type { ExerciseLibraryItem } from '@/db/types';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { Button } from '@/components/ui/Button';

interface ExerciseQuickPreviewModalProps {
  exercise: ExerciseLibraryItem;
  onClose: () => void;
  onViewFullDetails: (exercise: ExerciseLibraryItem) => void;
  onSelectExercise?: (exercise: ExerciseLibraryItem) => void;
}

export function ExerciseQuickPreviewModal({
  exercise,
  onClose,
  onViewFullDetails,
  onSelectExercise,
}: ExerciseQuickPreviewModalProps) {
  const demoUri = exercise.images?.demonstration?.uri || null;
  const shortDesc =
    exercise.formGuidance ||
    exercise.instructions?.[0] ||
    `Targets ${exercise.primaryMuscle} using ${exercise.equipment}.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Quick preview: ${exercise.name}`}
    >
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="relative aspect-video bg-zinc-900 flex items-center justify-center border-b border-zinc-800/80">
          {demoUri ? (
            <img src={demoUri} alt={exercise.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
              <div className="h-11 w-11 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                <ImageIcon className="h-5 w-5" />
              </div>
              <span className="text-xs">{exercise.subregion || exercise.primaryMuscle}</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 border border-zinc-700/70 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>

          <button
            onClick={() => workoutRepo.toggleExerciseFavorite(exercise.id)}
            className="absolute top-3 left-3 h-8 w-8 rounded-full bg-black/60 border border-zinc-700/70 flex items-center justify-center text-zinc-300 hover:text-amber-400 cursor-pointer"
            aria-label="Toggle favorite"
          >
            <Star className={`h-4 w-4 ${exercise.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-lime-300 font-medium mb-1">
              <Dumbbell className="h-3.5 w-3.5" />
              <span>{exercise.subregion || exercise.primaryMuscle}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 capitalize">{exercise.equipment}</span>
            </div>
            <h3 className="text-lg font-bold text-white">{exercise.name}</h3>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{shortDesc}</p>

          <div className="flex items-center gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => {
                onClose();
                onViewFullDetails(exercise);
              }}
            >
              View Full Details <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            {onSelectExercise && (
              <Button variant="outline" onClick={() => onSelectExercise(exercise)}>
                Add
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

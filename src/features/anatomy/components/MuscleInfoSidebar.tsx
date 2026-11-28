import { ANATOMY_BY_KEY, ATTRIBUTION } from 'open-anatomy-3d';
import { AlertCircle, CheckCircle2, Info, Layers, X } from 'lucide-react';
import type { ExerciseLibraryItem } from '@/db/types';
import type { ExerciseAnatomyMapping } from '../utils/muscleResolver';
import { getMuscleRole } from '../utils/anatomyColorManager';

interface MuscleInfoSidebarProps {
  exercise: ExerciseLibraryItem;
  mapping: ExerciseAnatomyMapping;
  selectedKey: string | null;
  onSelectKey: (key: string | null) => void;
}

export function MuscleInfoSidebar({
  exercise,
  mapping,
  selectedKey,
  onSelectKey,
}: MuscleInfoSidebarProps) {
  const selectedStructure = selectedKey ? ANATOMY_BY_KEY[selectedKey] : null;
  const selectedRole = selectedKey
    ? getMuscleRole(selectedKey, mapping.primaryKeys, mapping.secondaryKeys)
    : 'none';

  const matchingResolved = selectedKey
    ? mapping.resolvedItems.find((item) => item.catalogKeys.includes(selectedKey))
    : undefined;

  const primaryItems = mapping.resolvedItems.filter((i) => i.role === 'primary');
  const secondaryItems = mapping.resolvedItems.filter((i) => i.role === 'secondary');

  return (
    <div className="space-y-4">
      {/* Selected Muscle Inspector */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Selected Structure
            </h3>
          </div>
          {selectedKey && (
            <button
              onClick={() => onSelectKey(null)}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {selectedStructure ? (
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-white">{selectedStructure.label}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                  selectedRole === 'primary'
                    ? 'bg-lime-400/15 text-lime-300 border-lime-400/30'
                    : selectedRole === 'secondary'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {selectedRole === 'primary'
                  ? 'Primary Target'
                  : selectedRole === 'secondary'
                  ? 'Secondary Target'
                  : 'Anatomical Exploration'}
              </span>
            </div>

            <div className="text-zinc-400 space-y-1">
              <p>
                <span className="text-zinc-500">System:</span>{' '}
                <span className="capitalize text-zinc-300">{selectedStructure.system}</span>
                {matchingResolved && (
                  <>
                    {' · '}
                    <span className="text-zinc-300">{matchingResolved.region}</span>
                  </>
                )}
              </p>
              {matchingResolved ? (
                <>
                  <p className="text-zinc-300 leading-relaxed">{matchingResolved.functionSummary}</p>
                  <p className="text-zinc-400 leading-relaxed">
                    <span className="text-zinc-500">Role in {exercise.name}:</span>{' '}
                    {selectedRole === 'primary'
                      ? `Primary mover (${matchingResolved.sourceLabel}).`
                      : `Synergist / stabilizer (${matchingResolved.sourceLabel}).`}
                  </p>
                  {matchingResolved.modelCoverageNote && (
                    <p className="text-[11px] text-amber-300/90 flex items-start gap-1.5 pt-1">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{matchingResolved.modelCoverageNote}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-zinc-400 leading-relaxed">
                  Not listed as a primary or secondary target for {exercise.name}. You can continue exploring
                  surrounding structures on the 3D model.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-400 leading-relaxed">
            Hover over or click any muscle on the 3D body to inspect its anatomical name, role in{' '}
            <span className="text-zinc-200 font-medium">{exercise.name}</span>, and function.
          </p>
        )}
      </div>

      {/* Exercise Muscle Breakdown */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Muscle Breakdown
        </h3>

        <div className="space-y-2">
          <p className="text-xs font-medium text-lime-300">Primary Muscles</p>
          <div className="space-y-1.5">
            {primaryItems.map((item) => (
              <button
                key={`p-${item.sourceLabel}`}
                onClick={() => item.catalogKeys[0] && onSelectKey(item.catalogKeys[0])}
                className="w-full text-left rounded-xl border border-lime-400/20 bg-lime-400/5 px-3 py-2 hover:bg-lime-400/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">{item.sourceLabel}</span>
                  {item.availableInModel ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-lime-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  )}
                </div>
                {item.modelCoverageNote && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">{item.modelCoverageNote}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-purple-300">Secondary Muscles</p>
          {secondaryItems.length > 0 ? (
            <div className="space-y-1.5">
              {secondaryItems.map((item) => (
                <button
                  key={`s-${item.sourceLabel}`}
                  onClick={() => item.catalogKeys[0] && onSelectKey(item.catalogKeys[0])}
                  className="w-full text-left rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2 hover:bg-purple-500/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-200">{item.sourceLabel}</span>
                    {item.availableInModel ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  {item.modelCoverageNote && (
                    <p className="text-[11px] text-zinc-400 mt-0.5">{item.modelCoverageNote}</p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No secondary muscles recorded.</p>
          )}
        </div>

        {exercise.muscleTargetingNotes && (
          <div className="pt-2 border-t border-zinc-800/80 text-xs text-zinc-400 leading-relaxed">
            {exercise.muscleTargetingNotes}
          </div>
        )}
      </div>

      {/* Attribution & Educational Notice */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3.5 space-y-1.5 text-[11px] text-zinc-500">
        <p className="font-semibold text-zinc-400">3D Anatomy Attribution &amp; License</p>
        <p className="leading-relaxed">{ATTRIBUTION}</p>
        <p className="text-zinc-500">
          For educational and exercise visualization purposes only — not intended for medical diagnosis.
        </p>
      </div>
    </div>
  );
}

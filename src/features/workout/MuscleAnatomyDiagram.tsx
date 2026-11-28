import { useMemo, useState } from 'react';
import type { ExerciseLibraryItem } from '@/db/types';

export type AnatomyRegionId =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'adductors'
  | 'abductors'
  | 'traps'
  | 'lats'
  | 'lower_back'
  | 'triceps'
  | 'glutes'
  | 'hamstrings'
  | 'calves';

interface RegionMeta {
  id: AnatomyRegionId;
  label: string;
  view: 'front' | 'back' | 'both';
  keywords: string[];
}

const ANATOMY_REGIONS: RegionMeta[] = [
  { id: 'chest', label: 'Chest (Pectorals)', view: 'front', keywords: ['chest', 'pectoral', 'pec'] },
  { id: 'shoulders', label: 'Shoulders (Deltoids)', view: 'both', keywords: ['shoulder', 'deltoid', 'delt'] },
  { id: 'biceps', label: 'Biceps', view: 'front', keywords: ['bicep', 'brachialis'] },
  { id: 'forearms', label: 'Forearms', view: 'both', keywords: ['forearm', 'brachioradialis', 'wrist', 'flexor', 'extensor'] },
  { id: 'abs', label: 'Abdominals & Core', view: 'front', keywords: ['ab', 'core', 'rectus', 'transverse', 'anti-extension', 'anti-rotation'] },
  { id: 'obliques', label: 'Obliques', view: 'front', keywords: ['oblique', 'anti-lateral'] },
  { id: 'quads', label: 'Quadriceps', view: 'front', keywords: ['quad', 'rectus femoris', 'vastus'] },
  { id: 'adductors', label: 'Adductors', view: 'front', keywords: ['adductor', 'groin'] },
  { id: 'abductors', label: 'Abductors', view: 'both', keywords: ['abductor', 'tensor fasciae', 'gluteus medius'] },
  { id: 'traps', label: 'Upper Back & Traps', view: 'back', keywords: ['trap', 'rhomboid', 'upper back'] },
  { id: 'lats', label: 'Lats (Latissimus Dorsi)', view: 'back', keywords: ['lat', 'back'] },
  { id: 'lower_back', label: 'Lower Back & Spinal', view: 'back', keywords: ['lower back', 'erector', 'spinal', 'lumbar'] },
  { id: 'triceps', label: 'Triceps', view: 'back', keywords: ['tricep'] },
  { id: 'glutes', label: 'Glutes', view: 'back', keywords: ['glute'] },
  { id: 'hamstrings', label: 'Hamstrings', view: 'back', keywords: ['hamstring', 'biceps femoris', 'semitendinosus'] },
  { id: 'calves', label: 'Calves', view: 'back', keywords: ['calf', 'calves', 'gastrocnemius', 'soleus'] },
];

function matchesAny(textList: string[], keywords: string[]): boolean {
  const joined = textList.join(' ').toLowerCase();
  return keywords.some((kw) => joined.includes(kw));
}

export function MuscleAnatomyDiagram({ exercise }: { exercise: ExerciseLibraryItem }) {
  const [selectedRegion, setSelectedRegion] = useState<AnatomyRegionId | null>(null);

  const { primarySet, secondarySet } = useMemo(() => {
    const primaryTexts = [
      exercise.primaryMuscle,
      exercise.subregion || '',
      ...(exercise.primaryMuscles || []),
    ].filter(Boolean);

    const secondaryTexts = [
      ...(exercise.secondaryMuscles || []),
      ...(exercise.secondaryMuscleLabels || []),
    ].filter(Boolean);

    const pSet = new Set<AnatomyRegionId>();
    const sSet = new Set<AnatomyRegionId>();

    for (const region of ANATOMY_REGIONS) {
      if (matchesAny(primaryTexts, region.keywords)) {
        pSet.add(region.id);
      } else if (matchesAny(secondaryTexts, region.keywords)) {
        sSet.add(region.id);
      }
    }

    return { primarySet: pSet, secondarySet: sSet };
  }, [exercise]);

  const activeRegion = useMemo(() => {
    if (selectedRegion) {
      return ANATOMY_REGIONS.find((r) => r.id === selectedRegion) || null;
    }
    const firstPrimary = ANATOMY_REGIONS.find((r) => primarySet.has(r.id));
    return firstPrimary || ANATOMY_REGIONS[0];
  }, [selectedRegion, primarySet]);

  const getRegionFill = (id: AnatomyRegionId) => {
    const isSelected = activeRegion?.id === id;
    if (primarySet.has(id)) {
      return isSelected ? '#a3e635' : '#84cc16';
    }
    if (secondarySet.has(id)) {
      return isSelected ? '#c084fc' : '#a855f7';
    }
    return isSelected ? '#3f3f46' : '#27272a';
  };

  const getRegionOpacity = (id: AnatomyRegionId) => {
    if (primarySet.has(id)) return 0.92;
    if (secondarySet.has(id)) return 0.78;
    return activeRegion?.id === id ? 0.7 : 0.45;
  };

  const getRole = (id: AnatomyRegionId): 'Primary' | 'Secondary' | 'Not Targeted' => {
    if (primarySet.has(id)) return 'Primary';
    if (secondarySet.has(id)) return 'Secondary';
    return 'Not Targeted';
  };

  const activeRole = activeRegion ? getRole(activeRegion.id) : 'Not Targeted';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
            Primary Muscle
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            Secondary Muscle
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-500">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            Tap any muscle
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Front View */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 flex flex-col items-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Anterior (Front)
          </span>
          <svg viewBox="0 0 200 360" className="w-full max-w-[200px] h-auto select-none">
            {/* Head & Neck */}
            <circle cx="100" cy="28" r="16" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
            <rect x="92" y="44" width="16" height="14" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />

            {/* Shoulders */}
            <path
              d="M62 60 Q75 54 88 58 L84 78 L56 76 Z"
              fill={getRegionFill('shoulders')}
              fillOpacity={getRegionOpacity('shoulders')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('shoulders')}
            />
            <path
              d="M138 60 Q125 54 112 58 L116 78 L144 76 Z"
              fill={getRegionFill('shoulders')}
              fillOpacity={getRegionOpacity('shoulders')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('shoulders')}
            />

            {/* Chest */}
            <path
              d="M72 60 L128 60 L124 96 Q100 102 76 96 Z"
              fill={getRegionFill('chest')}
              fillOpacity={getRegionOpacity('chest')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('chest')}
            />

            {/* Biceps */}
            <rect
              x="48"
              y="78"
              width="14"
              height="44"
              rx="6"
              fill={getRegionFill('biceps')}
              fillOpacity={getRegionOpacity('biceps')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('biceps')}
            />
            <rect
              x="138"
              y="78"
              width="14"
              height="44"
              rx="6"
              fill={getRegionFill('biceps')}
              fillOpacity={getRegionOpacity('biceps')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('biceps')}
            />

            {/* Forearms */}
            <rect
              x="44"
              y="124"
              width="12"
              height="48"
              rx="5"
              fill={getRegionFill('forearms')}
              fillOpacity={getRegionOpacity('forearms')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('forearms')}
            />
            <rect
              x="144"
              y="124"
              width="12"
              height="48"
              rx="5"
              fill={getRegionFill('forearms')}
              fillOpacity={getRegionOpacity('forearms')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('forearms')}
            />

            {/* Abs */}
            <rect
              x="82"
              y="98"
              width="36"
              height="68"
              rx="6"
              fill={getRegionFill('abs')}
              fillOpacity={getRegionOpacity('abs')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('abs')}
            />

            {/* Obliques */}
            <path
              d="M70 98 L80 98 L80 164 L68 156 Z"
              fill={getRegionFill('obliques')}
              fillOpacity={getRegionOpacity('obliques')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('obliques')}
            />
            <path
              d="M120 98 L130 98 L132 156 L120 164 Z"
              fill={getRegionFill('obliques')}
              fillOpacity={getRegionOpacity('obliques')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('obliques')}
            />

            {/* Abductors (outer hip) */}
            <path
              d="M64 166 L74 168 L72 204 L62 198 Z"
              fill={getRegionFill('abductors')}
              fillOpacity={getRegionOpacity('abductors')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('abductors')}
            />
            <path
              d="M126 168 L136 166 L138 198 L128 204 Z"
              fill={getRegionFill('abductors')}
              fillOpacity={getRegionOpacity('abductors')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('abductors')}
            />

            {/* Adductors (inner thigh) */}
            <path
              d="M88 176 L98 176 L96 226 L88 220 Z"
              fill={getRegionFill('adductors')}
              fillOpacity={getRegionOpacity('adductors')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('adductors')}
            />
            <path
              d="M102 176 L112 176 L112 220 L104 226 Z"
              fill={getRegionFill('adductors')}
              fillOpacity={getRegionOpacity('adductors')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('adductors')}
            />

            {/* Quads */}
            <rect
              x="70"
              y="174"
              width="20"
              height="76"
              rx="8"
              fill={getRegionFill('quads')}
              fillOpacity={getRegionOpacity('quads')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('quads')}
            />
            <rect
              x="110"
              y="174"
              width="20"
              height="76"
              rx="8"
              fill={getRegionFill('quads')}
              fillOpacity={getRegionOpacity('quads')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('quads')}
            />

            {/* Lower legs */}
            <rect x="73" y="256" width="15" height="72" rx="6" fill="#18181b" stroke="#27272a" strokeWidth="1" />
            <rect x="112" y="256" width="15" height="72" rx="6" fill="#18181b" stroke="#27272a" strokeWidth="1" />
          </svg>
        </div>

        {/* Rear View */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 flex flex-col items-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Posterior (Rear)
          </span>
          <svg viewBox="0 0 200 360" className="w-full max-w-[200px] h-auto select-none">
            {/* Head & Neck */}
            <circle cx="100" cy="28" r="16" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
            <rect x="92" y="44" width="16" height="14" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />

            {/* Traps */}
            <path
              d="M74 58 L126 58 L118 82 L82 82 Z"
              fill={getRegionFill('traps')}
              fillOpacity={getRegionOpacity('traps')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('traps')}
            />

            {/* Shoulders */}
            <path
              d="M56 64 L74 60 L74 82 L54 78 Z"
              fill={getRegionFill('shoulders')}
              fillOpacity={getRegionOpacity('shoulders')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('shoulders')}
            />
            <path
              d="M144 64 L126 60 L126 82 L146 78 Z"
              fill={getRegionFill('shoulders')}
              fillOpacity={getRegionOpacity('shoulders')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('shoulders')}
            />

            {/* Lats */}
            <path
              d="M72 84 L128 84 L120 130 L80 130 Z"
              fill={getRegionFill('lats')}
              fillOpacity={getRegionOpacity('lats')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('lats')}
            />

            {/* Lower Back */}
            <rect
              x="82"
              y="132"
              width="36"
              height="32"
              rx="6"
              fill={getRegionFill('lower_back')}
              fillOpacity={getRegionOpacity('lower_back')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('lower_back')}
            />

            {/* Triceps */}
            <rect
              x="48"
              y="80"
              width="14"
              height="44"
              rx="6"
              fill={getRegionFill('triceps')}
              fillOpacity={getRegionOpacity('triceps')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('triceps')}
            />
            <rect
              x="138"
              y="80"
              width="14"
              height="44"
              rx="6"
              fill={getRegionFill('triceps')}
              fillOpacity={getRegionOpacity('triceps')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('triceps')}
            />

            {/* Forearms */}
            <rect
              x="44"
              y="126"
              width="12"
              height="48"
              rx="5"
              fill={getRegionFill('forearms')}
              fillOpacity={getRegionOpacity('forearms')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('forearms')}
            />
            <rect
              x="144"
              y="126"
              width="12"
              height="48"
              rx="5"
              fill={getRegionFill('forearms')}
              fillOpacity={getRegionOpacity('forearms')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('forearms')}
            />

            {/* Glutes */}
            <rect
              x="70"
              y="166"
              width="28"
              height="34"
              rx="10"
              fill={getRegionFill('glutes')}
              fillOpacity={getRegionOpacity('glutes')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('glutes')}
            />
            <rect
              x="102"
              y="166"
              width="28"
              height="34"
              rx="10"
              fill={getRegionFill('glutes')}
              fillOpacity={getRegionOpacity('glutes')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('glutes')}
            />

            {/* Hamstrings */}
            <rect
              x="72"
              y="202"
              width="22"
              height="52"
              rx="8"
              fill={getRegionFill('hamstrings')}
              fillOpacity={getRegionOpacity('hamstrings')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('hamstrings')}
            />
            <rect
              x="106"
              y="202"
              width="22"
              height="52"
              rx="8"
              fill={getRegionFill('hamstrings')}
              fillOpacity={getRegionOpacity('hamstrings')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('hamstrings')}
            />

            {/* Calves */}
            <rect
              x="74"
              y="260"
              width="17"
              height="58"
              rx="7"
              fill={getRegionFill('calves')}
              fillOpacity={getRegionOpacity('calves')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('calves')}
            />
            <rect
              x="109"
              y="260"
              width="17"
              height="58"
              rx="7"
              fill={getRegionFill('calves')}
              fillOpacity={getRegionOpacity('calves')}
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:brightness-125"
              onClick={() => setSelectedRegion('calves')}
            />
          </svg>
        </div>
      </div>

      {/* Selected Muscle Inspector */}
      {activeRegion && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-white">{activeRegion.label}</h4>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                activeRole === 'Primary'
                  ? 'bg-lime-400/15 text-lime-300 border border-lime-400/30'
                  : activeRole === 'Secondary'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {activeRole}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {activeRole === 'Primary'
              ? `Primary mover for ${exercise.name}. ${exercise.muscleTargetingNotes || 'Focus on controlled tension through the full range of motion.'}`
              : activeRole === 'Secondary'
              ? `Acts as a synergist or stabilizer during ${exercise.name} to support joint alignment and force transfer.`
              : `Not a primary or secondary target for ${exercise.name}.`}
          </p>
        </div>
      )}
    </div>
  );
}

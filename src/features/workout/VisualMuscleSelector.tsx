interface VisualMuscleSelectorProps {
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
}

const FRONT_ZONES: { label: string; region: string; d?: string; rect?: [number, number, number, number, number] }[] = [
  { label: 'Shoulders', region: 'Shoulders', d: 'M58 60 Q75 54 88 58 L84 78 L54 76 Z' },
  { label: 'Shoulders', region: 'Shoulders', d: 'M142 60 Q125 54 112 58 L116 78 L146 76 Z' },
  { label: 'Chest', region: 'Chest', d: 'M72 60 L128 60 L124 96 Q100 102 76 96 Z' },
  { label: 'Biceps', region: 'Biceps', rect: [48, 78, 14, 44, 6] },
  { label: 'Biceps', region: 'Biceps', rect: [138, 78, 14, 44, 6] },
  { label: 'Forearms', region: 'Forearms', rect: [44, 124, 12, 48, 5] },
  { label: 'Forearms', region: 'Forearms', rect: [144, 124, 12, 48, 5] },
  { label: 'Abdominals', region: 'Abdominals', rect: [82, 98, 36, 68, 6] },
  { label: 'Obliques', region: 'Obliques', d: 'M70 98 L80 98 L80 164 L68 156 Z' },
  { label: 'Obliques', region: 'Obliques', d: 'M120 98 L130 98 L132 156 L120 164 Z' },
  { label: 'Abductors', region: 'Abductors', d: 'M64 166 L74 168 L72 204 L62 198 Z' },
  { label: 'Abductors', region: 'Abductors', d: 'M126 168 L136 166 L138 198 L128 204 Z' },
  { label: 'Adductors', region: 'Adductors', d: 'M88 176 L98 176 L96 226 L88 220 Z' },
  { label: 'Adductors', region: 'Adductors', d: 'M102 176 L112 176 L112 220 L104 226 Z' },
  { label: 'Quadriceps', region: 'Quadriceps', rect: [70, 174, 20, 76, 8] },
  { label: 'Quadriceps', region: 'Quadriceps', rect: [110, 174, 20, 76, 8] },
];

const BACK_ZONES: { label: string; region: string; d?: string; rect?: [number, number, number, number, number] }[] = [
  { label: 'Back', region: 'Back', d: 'M72 60 L128 60 L120 130 L80 130 Z' },
  { label: 'Shoulders', region: 'Shoulders', d: 'M56 64 L74 60 L74 82 L54 78 Z' },
  { label: 'Shoulders', region: 'Shoulders', d: 'M144 64 L126 60 L126 82 L146 78 Z' },
  { label: 'Spinal Stability', region: 'Spinal Stability', rect: [82, 132, 36, 32, 6] },
  { label: 'Triceps', region: 'Triceps', rect: [48, 80, 14, 44, 6] },
  { label: 'Triceps', region: 'Triceps', rect: [138, 80, 14, 44, 6] },
  { label: 'Forearms', region: 'Forearms', rect: [44, 126, 12, 48, 5] },
  { label: 'Forearms', region: 'Forearms', rect: [144, 126, 12, 48, 5] },
  { label: 'Glutes', region: 'Glutes', rect: [70, 166, 28, 34, 10] },
  { label: 'Glutes', region: 'Glutes', rect: [102, 166, 28, 34, 10] },
  { label: 'Hamstrings', region: 'Hamstrings', rect: [72, 202, 22, 52, 8] },
  { label: 'Hamstrings', region: 'Hamstrings', rect: [106, 202, 22, 52, 8] },
  { label: 'Calves', region: 'Calves', rect: [74, 260, 17, 58, 7] },
  { label: 'Calves', region: 'Calves', rect: [109, 260, 17, 58, 7] },
];

export function VisualMuscleSelector({ selectedRegion, onSelectRegion }: VisualMuscleSelectorProps) {
  const renderZones = (zones: typeof FRONT_ZONES) =>
    zones.map((z, idx) => {
      const active = selectedRegion === z.region;
      const fill = active ? '#a3e635' : '#27272a';
      const opacity = active ? 0.95 : 0.7;
      const commonProps = {
        key: `${z.region}-${idx}`,
        fill,
        fillOpacity: opacity,
        stroke: active ? '#ecfccb' : '#09090b',
        strokeWidth: active ? 1.5 : 1.2,
        className: 'cursor-pointer transition-all hover:fill-lime-400/80',
        onClick: () => onSelectRegion(active ? 'ALL' : z.region),
      };

      if (z.d) return <path {...commonProps} d={z.d} />;
      if (z.rect) {
        const [x, y, width, height, rx] = z.rect;
        return <rect {...commonProps} x={x} y={y} width={width} height={height} rx={rx} />;
      }
      return null;
    });

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Interactive Muscle Selector</h3>
          <p className="text-xs text-zinc-400">Click any muscle region to filter exercises</p>
        </div>
        {selectedRegion !== 'ALL' && (
          <button
            onClick={() => onSelectRegion('ALL')}
            className="text-xs text-lime-300 hover:text-lime-200 cursor-pointer"
          >
            Reset ({selectedRegion})
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Front</span>
          <svg viewBox="0 0 200 340" className="w-full max-w-[150px] h-auto">
            <circle cx="100" cy="28" r="15" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
            {renderZones(FRONT_ZONES)}
          </svg>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Back</span>
          <svg viewBox="0 0 200 340" className="w-full max-w-[150px] h-auto">
            <circle cx="100" cy="28" r="15" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
            {renderZones(BACK_ZONES)}
          </svg>
        </div>
      </div>
    </div>
  );
}

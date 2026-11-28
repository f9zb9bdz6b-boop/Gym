import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { ANATOMY_BY_KEY, type AnatomySex, type AnatomySystem } from 'open-anatomy-3d';
import { Eye, Layers, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { ExerciseLibraryItem } from '@/db/types';
import { useExerciseAnatomy } from '../hooks/useExerciseAnatomy';
import { getMuscleRole } from '../utils/anatomyColorManager';
import type { AnatomyLayers, CameraPreset } from './AnatomyScene';
import { MuscleInfoSidebar } from './MuscleInfoSidebar';

const LazyAnatomyScene = lazy(() => import('./AnatomyScene'));

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2'))
    );
  } catch {
    return false;
  }
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const DEFAULT_LAYERS: AnatomyLayers = {
  muscles: true,
  skeleton: true,
  skin: false,
  joints: false,
  organs: false,
  vessels: false,
  nerves: false,
};

const LAYER_CONTROLS: { key: AnatomySystem; label: string }[] = [
  { key: 'muscles', label: 'Muscles' },
  { key: 'skeleton', label: 'Skeleton' },
  { key: 'skin', label: 'Skin' },
];

export function AnatomyViewerPanel({ exercise }: { exercise: ExerciseLibraryItem }) {
  const mapping = useExerciseAnatomy(exercise);
  const [sex, setSex] = useState<AnatomySex>('male');
  const [layers, setLayers] = useState<AnatomyLayers>(DEFAULT_LAYERS);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [presetTrigger, setPresetTrigger] = useState<{ preset: CameraPreset; seq: number } | null>(null);
  const [zoomDelta, setZoomDelta] = useState<{ factor: number; seq: number } | null>(null);
  const [loadState, setLoadState] = useState<{ progress: number; active: boolean }>({
    progress: 0,
    active: true,
  });
  const [webglSupported] = useState(() => isWebGLAvailable());

  // Clear outdated muscle selection when switching exercises (keeps camera angle!)
  useEffect(() => {
    setSelectedKey(null);
    setHoveredKey(null);
  }, [exercise.id]);

  const handleProgress = useCallback((progress: number, active: boolean) => {
    setLoadState({ progress, active });
  }, []);

  const triggerPreset = (preset: CameraPreset) => {
    setPresetTrigger((prev) => ({ preset, seq: (prev?.seq ?? 0) + 1 }));
  };

  const triggerZoom = (factor: number) => {
    setZoomDelta((prev) => ({ factor, seq: (prev?.seq ?? 0) + 1 }));
  };

  const toggleLayer = (key: AnatomySystem) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hoveredStructure = hoveredKey ? ANATOMY_BY_KEY[hoveredKey] : null;
  const hoveredRole = hoveredKey
    ? getMuscleRole(hoveredKey, mapping.primaryKeys, mapping.secondaryKeys)
    : 'none';

  const fallbackView = (
    <div className="flex flex-col items-center justify-center h-full min-h-[380px] p-6 text-center space-y-2 bg-zinc-950/90">
      <Layers className="h-8 w-8 text-zinc-500" />
      <p className="text-sm font-semibold text-zinc-200">3D Anatomy Unavailable</p>
      <p className="text-xs text-zinc-400 max-w-sm">
        WebGL is disabled or the 3D model could not be loaded. Use the Muscle Breakdown panel to inspect
        targeted primary and secondary muscles.
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left/Central 3D Anatomy Viewer */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        <div className="relative h-[420px] sm:h-[500px] lg:h-[560px] rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/70 via-zinc-950 to-black overflow-hidden">
          {/* Top Bar: Sex Toggle + Layer Controls */}
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="inline-flex items-center rounded-xl border border-zinc-800 bg-zinc-950/85 backdrop-blur-md p-1 pointer-events-auto">
              {(['male', 'female'] as AnatomySex[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setSex(option)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                    sex === option
                      ? 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/85 backdrop-blur-md p-1 pointer-events-auto">
              <Eye className="h-3.5 w-3.5 text-zinc-500 ml-1.5 mr-0.5" />
              {LAYER_CONTROLS.map((layer) => (
                <button
                  key={layer.key}
                  onClick={() => toggleLayer(layer.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    layers[layer.key]
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hover Tooltip */}
          {hoveredStructure && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 rounded-xl border border-zinc-700/80 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 text-xs shadow-lg pointer-events-none flex items-center gap-2">
              <span className="font-semibold text-white">{hoveredStructure.label}</span>
              {hoveredRole !== 'none' && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    hoveredRole === 'primary'
                      ? 'bg-lime-400/20 text-lime-300'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}
                >
                  {hoveredRole === 'primary' ? 'Primary' : 'Secondary'}
                </span>
              )}
            </div>
          )}

          {/* Loading Indicator */}
          {webglSupported && loadState.active && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/75 backdrop-blur-sm pointer-events-none gap-2">
              <div className="w-48 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-lime-400 transition-all duration-200"
                  style={{ width: `${Math.max(8, Math.round(loadState.progress))}%` }}
                />
              </div>
              <span className="text-xs text-zinc-300">
                Loading 3D Anatomy ({Math.round(loadState.progress)}%)
              </span>
            </div>
          )}

          {/* 3D Canvas */}
          {webglSupported ? (
            <SceneErrorBoundary fallback={fallbackView}>
              <Suspense fallback={null}>
                <LazyAnatomyScene
                  sex={sex}
                  layers={layers}
                  primaryKeys={mapping.primaryKeys}
                  secondaryKeys={mapping.secondaryKeys}
                  selectedKey={selectedKey}
                  hoveredKey={hoveredKey}
                  presetTrigger={presetTrigger}
                  zoomDelta={zoomDelta}
                  onHover={setHoveredKey}
                  onSelect={(k) => setSelectedKey((prev) => (prev === k ? null : k))}
                  onProgress={handleProgress}
                />
              </Suspense>
            </SceneErrorBoundary>
          ) : (
            fallbackView
          )}

          {/* Bottom Floating View & Zoom Controls */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
            <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/85 backdrop-blur-md p-1 overflow-x-auto pointer-events-auto">
              {(['front', 'rear', 'left', 'right'] as CameraPreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => triggerPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
              <button
                onClick={() => triggerPreset('front')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-lime-300 hover:bg-zinc-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Reset camera"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/85 backdrop-blur-md p-1 pointer-events-auto shrink-0">
              <button
                onClick={() => triggerZoom(1.18)}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => triggerZoom(1 / 1.18)}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Anatomical Legend & Model Scope Note */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-zinc-200">
              <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
              Primary
            </span>
            <span className="inline-flex items-center gap-1.5 text-zinc-200">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              Secondary
            </span>
            <span className="inline-flex items-center gap-1.5 text-zinc-200">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              Selected
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Superficial 3D muscle groups (41 structures) · Drag to rotate, scroll/pinch to zoom
          </span>
        </div>
      </div>

      {/* Right Panel: Muscle Breakdown & Selected Info */}
      <div className="lg:col-span-4">
        <MuscleInfoSidebar
          exercise={exercise}
          mapping={mapping}
          selectedKey={selectedKey}
          onSelectKey={setSelectedKey}
        />
      </div>
    </div>
  );
}

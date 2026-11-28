import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Bvh, OrbitControls, PerspectiveCamera, useGLTF, useProgress } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { ANATOMY_BY_KEY, modelUrl, type AnatomySex, type AnatomySystem } from 'open-anatomy-3d';
import { ANATOMY_COLORS } from '../utils/anatomyColorManager';

export type CameraPreset = 'front' | 'rear' | 'left' | 'right';
export type AnatomyLayers = Record<AnatomySystem, boolean>;

const BODY_CENTER = new THREE.Vector3(0, 0.92, 0);
const DEFAULT_DISTANCE = 2.75;

const PRESET_POSITIONS: Record<CameraPreset, [number, number, number]> = {
  front: [0, 0.96, DEFAULT_DISTANCE],
  rear: [0, 0.96, -DEFAULT_DISTANCE],
  left: [-DEFAULT_DISTANCE, 0.96, 0],
  right: [DEFAULT_DISTANCE, 0.96, 0],
};

interface AnatomyModelMeshProps {
  sex: AnatomySex;
  layers: AnatomyLayers;
  primaryKeys: ReadonlySet<string>;
  secondaryKeys: ReadonlySet<string>;
  selectedKey: string | null;
  hoveredKey: string | null;
  onHover: (key: string | null) => void;
  onSelect: (key: string) => void;
}

function resolveMeshAnatomyKey(obj: THREE.Object3D): string | null {
  let curr: THREE.Object3D | null = obj;
  while (curr) {
    if (curr.userData?.anatomyKey) return curr.userData.anatomyKey as string;
    if (curr.name && ANATOMY_BY_KEY[curr.name]) return curr.name;
    curr = curr.parent;
  }
  return null;
}

function AnatomyModelMesh({
  sex,
  layers,
  primaryKeys,
  secondaryKeys,
  selectedKey,
  hoveredKey,
  onHover,
  onSelect,
}: AnatomyModelMeshProps) {
  const url = modelUrl(sex);
  const { scene } = useGLTF(url);

  const { root, parts, systemGroups } = useMemo(() => {
    const cloned = scene.clone(true);
    const partMap = new Map<
      string,
      { key: string; system: AnatomySystem; meshes: THREE.Mesh[]; materials: THREE.MeshStandardMaterial[] }
    >();
    const sysMap = new Map<AnatomySystem, THREE.Object3D[]>();

    cloned.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const key = resolveMeshAnatomyKey(obj);
      const meta = key ? ANATOMY_BY_KEY[key] : undefined;
      const system: AnatomySystem = meta?.system || 'muscles';

      if (!sysMap.has(system)) sysMap.set(system, []);
      sysMap.get(system)!.push(obj);

      const baseMat = obj.material instanceof THREE.MeshStandardMaterial
        ? obj.material.clone()
        : new THREE.MeshStandardMaterial({ color: meta?.color || '#a33b34', roughness: 0.45 });

      if (system === 'muscles') {
        baseMat.color.set(meta?.color || '#a33b34').lerp(new THREE.Color('#8f2d27'), 0.25);
        baseMat.roughness = 0.38;
        baseMat.metalness = 0.08;
      } else if (system === 'skeleton') {
        baseMat.color.set('#e8e2d5');
        baseMat.roughness = 0.42;
        baseMat.metalness = 0.04;
      } else {
        baseMat.roughness = system === 'skin' ? 0.65 : 0.45;
        baseMat.metalness = 0.05;
      }
      baseMat.userData.baseColor = baseMat.color.clone();
      obj.material = baseMat;

      if (key) {
        obj.userData.anatomyKey = key;
        obj.userData.system = system;
        if (!partMap.has(key)) {
          partMap.set(key, { key, system, meshes: [], materials: [] });
        }
        const entry = partMap.get(key)!;
        entry.meshes.push(obj);
        entry.materials.push(baseMat);
      }
    });

    return { root: cloned, parts: partMap, systemGroups: sysMap };
  }, [scene]);

  useEffect(() => {
    for (const [sys, objs] of systemGroups.entries()) {
      const visible = layers[sys] ?? false;
      for (const o of objs) {
        o.visible = visible;
      }
    }
  }, [layers, systemGroups]);

  const primaryColor = useMemo(() => new THREE.Color(ANATOMY_COLORS.primary), []);
  const secondaryColor = useMemo(() => new THREE.Color(ANATOMY_COLORS.secondary), []);
  const selectedColor = useMemo(() => new THREE.Color(ANATOMY_COLORS.selected), []);
  const hoverColor = useMemo(() => new THREE.Color(ANATOMY_COLORS.hovered), []);

  useFrame(({ clock }) => {
    const pulse = 0.62 + 0.18 * Math.sin(clock.elapsedTime * 3);
    for (const part of parts.values()) {
      const isSelected = part.key === selectedKey;
      const isHovered = part.key === hoveredKey;
      const isPrimary = primaryKeys.has(part.key);
      const isSecondary = secondaryKeys.has(part.key);

      for (const mat of part.materials) {
        const baseCol = (mat.userData.baseColor as THREE.Color | undefined) || mat.color;
        if (isSelected) {
          mat.color.copy(baseCol).lerp(selectedColor, 0.55);
          mat.emissive.copy(selectedColor);
          mat.emissiveIntensity = 0.9;
        } else if (isHovered) {
          const hoverTint = isPrimary ? primaryColor : isSecondary ? secondaryColor : hoverColor;
          mat.color.copy(baseCol).lerp(hoverTint, 0.45);
          mat.emissive.copy(hoverTint);
          mat.emissiveIntensity = 0.8;
        } else if (isPrimary) {
          mat.color.copy(baseCol).lerp(primaryColor, 0.65);
          mat.emissive.copy(primaryColor);
          mat.emissiveIntensity = pulse;
        } else if (isSecondary) {
          mat.color.copy(baseCol).lerp(secondaryColor, 0.55);
          mat.emissive.copy(secondaryColor);
          mat.emissiveIntensity = pulse * 0.82;
        } else {
          mat.color.copy(baseCol);
          mat.emissiveIntensity = 0;
        }

        const baseOpacity = part.system === 'skin' ? 0.22 : 1;
        const wantOpacity = isSelected || isHovered || isPrimary || isSecondary ? 1 : baseOpacity;
        if (mat.opacity !== wantOpacity) {
          mat.opacity = wantOpacity;
          mat.transparent = wantOpacity < 1;
          mat.depthWrite = wantOpacity >= 1;
          mat.needsUpdate = true;
        }
      }
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const key = resolveMeshAnatomyKey(e.object);
    if (key) onHover(key);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const key = resolveMeshAnatomyKey(e.object);
    if (key) onSelect(key);
  };

  return (
    <primitive
      object={root}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

interface CameraRigProps {
  presetTrigger: { preset: CameraPreset; seq: number } | null;
  zoomDelta: { factor: number; seq: number } | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

function CameraRig({ presetTrigger, zoomDelta, controlsRef }: CameraRigProps) {
  const { camera } = useThree();
  const targetPos = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (!presetTrigger) return;
    const coords = PRESET_POSITIONS[presetTrigger.preset];
    targetPos.current = new THREE.Vector3(...coords);
  }, [presetTrigger]);

  useEffect(() => {
    if (!zoomDelta || !controlsRef.current) return;
    const offset = camera.position.clone().sub(BODY_CENTER);
    const nextLen = THREE.MathUtils.clamp(offset.length() * zoomDelta.factor, 1.15, 4.5);
    offset.setLength(nextLen);
    camera.position.copy(BODY_CENTER).add(offset);
    controlsRef.current.update();
  }, [zoomDelta, camera, controlsRef]);

  useFrame(() => {
    if (!targetPos.current || !controlsRef.current) return;
    camera.position.lerp(targetPos.current, 0.16);
    controlsRef.current.target.lerp(BODY_CENTER, 0.16);
    controlsRef.current.update();
    if (camera.position.distanceTo(targetPos.current) < 0.02) {
      camera.position.copy(targetPos.current);
      targetPos.current = null;
    }
  });

  return null;
}

function LoadingReporter({ onProgress }: { onProgress: (pct: number, active: boolean) => void }) {
  const { progress, active } = useProgress();
  useEffect(() => {
    onProgress(progress, active);
  }, [progress, active, onProgress]);
  return null;
}

interface AnatomySceneProps {
  sex: AnatomySex;
  layers: AnatomyLayers;
  primaryKeys: ReadonlySet<string>;
  secondaryKeys: ReadonlySet<string>;
  selectedKey: string | null;
  hoveredKey: string | null;
  presetTrigger: { preset: CameraPreset; seq: number } | null;
  zoomDelta: { factor: number; seq: number } | null;
  onHover: (key: string | null) => void;
  onSelect: (key: string) => void;
  onProgress: (pct: number, active: boolean) => void;
}

export default function AnatomyScene({
  sex,
  layers,
  primaryKeys,
  secondaryKeys,
  selectedKey,
  hoveredKey,
  presetTrigger,
  zoomDelta,
  onHover,
  onSelect,
  onProgress,
}: AnatomySceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      className="w-full h-full"
    >
      <PerspectiveCamera makeDefault position={[0, 0.96, DEFAULT_DISTANCE]} fov={32} near={0.05} far={50} />
      <hemisphereLight args={['#f8fafc', '#27272a', 0.95]} />
      <directionalLight position={[3, 4.5, 3.5]} intensity={2.1} color="#fff7ed" />
      <directionalLight position={[-3.5, 2.5, -2.5]} intensity={1.15} color="#a5f3fc" />
      <directionalLight position={[0, 1.5, -4]} intensity={1.0} color="#c4b5fd" />

      <LoadingReporter onProgress={onProgress} />

      <Suspense fallback={null}>
        <Bvh firstHitOnly={false}>
          <AnatomyModelMesh
            sex={sex}
            layers={layers}
            primaryKeys={primaryKeys}
            secondaryKeys={secondaryKeys}
            selectedKey={selectedKey}
            hoveredKey={hoveredKey}
            onHover={onHover}
            onSelect={onSelect}
          />
        </Bvh>
      </Suspense>

      <CameraRig presetTrigger={presetTrigger} zoomDelta={zoomDelta} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={BODY_CENTER}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={1.15}
        maxDistance={4.5}
        minPolarAngle={Math.PI * 0.12}
        maxPolarAngle={Math.PI * 0.88}
        rotateSpeed={0.75}
        zoomSpeed={0.85}
      />
    </Canvas>
  );
}

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
        : new THREE.MeshStandardMaterial({ color: meta?.color || '#9a443b', roughness: 0.55 });

      baseMat.roughness = system === 'skin' ? 0.65 : 0.48;
      baseMat.metalness = 0.05;
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
    const pulse = 0.42 + 0.18 * Math.sin(clock.elapsedTime * 3);
    for (const part of parts.values()) {
      const isSelected = part.key === selectedKey;
      const isHovered = part.key === hoveredKey;
      const isPrimary = primaryKeys.has(part.key);
      const isSecondary = secondaryKeys.has(part.key);

      for (const mat of part.materials) {
        if (isSelected) {
          mat.emissive.copy(selectedColor);
          mat.emissiveIntensity = 0.78;
        } else if (isHovered) {
          mat.emissive.copy(isPrimary ? primaryColor : isSecondary ? secondaryColor : hoverColor);
          mat.emissiveIntensity = 0.65;
        } else if (isPrimary) {
          mat.emissive.copy(primaryColor);
          mat.emissiveIntensity = pulse;
        } else if (isSecondary) {
          mat.emissive.copy(secondaryColor);
          mat.emissiveIntensity = pulse * 0.85;
        } else {
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
    <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }} className="w-full h-full">
      <PerspectiveCamera makeDefault position={[0, 0.96, DEFAULT_DISTANCE]} fov={32} near={0.05} far={50} />
      <hemisphereLight args={['#ffffff', '#8c7a6b', 1.15]} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.7} />
      <directionalLight position={[-3, 2, -2]} intensity={0.85} />
      <directionalLight position={[0, 1.5, -4]} intensity={0.7} />

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

import imageMapRaw from './exerciseImageMap.json';
import type { ExerciseLibraryItem } from '@/db/types';

export type ExerciseImageStatus = 'matched' | 'manually_verified' | 'unavailable';

export interface ExerciseImageEntry {
  image: string | null;
  imageAlt: string;
  imageSource: string;
  imageStatus: ExerciseImageStatus;
  matchedId?: string;
}

const IMAGE_MAP = imageMapRaw as Record<string, ExerciseImageEntry>;

export function getExerciseImageEntry(id: string): ExerciseImageEntry | undefined {
  return IMAGE_MAP[id];
}

export function resolveExerciseImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('/')) {
    return relativePath;
  }
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${relativePath}`;
}

export function resolveExerciseImage(exercise: Pick<ExerciseLibraryItem, 'id' | 'name' | 'image' | 'imageAlt' | 'images'>): {
  src: string | null;
  alt: string;
} {
  const mapped = IMAGE_MAP[exercise.id];
  const rawPath = exercise.image ?? exercise.images?.demonstration?.uri ?? mapped?.image ?? null;
  return {
    src: resolveExerciseImageUrl(rawPath),
    alt: exercise.imageAlt || mapped?.imageAlt || `${exercise.name} exercise demonstration`,
  };
}

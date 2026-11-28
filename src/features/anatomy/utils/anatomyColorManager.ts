export const ANATOMY_COLORS = {
  primary: '#a3e635',     // Neon lime
  secondary: '#a855f7',   // Purple / violet
  selected: '#22d3ee',    // Bright cyan accent
  hovered: '#facc15',     // Bright highlight on hover
  unselectedMuscle: '#7f3a36',
} as const;

export type MuscleRoleInExercise = 'primary' | 'secondary' | 'none';

export function getMuscleRole(
  key: string,
  primaryKeys: ReadonlySet<string>,
  secondaryKeys: ReadonlySet<string>
): MuscleRoleInExercise {
  if (primaryKeys.has(key)) return 'primary';
  if (secondaryKeys.has(key)) return 'secondary';
  return 'none';
}

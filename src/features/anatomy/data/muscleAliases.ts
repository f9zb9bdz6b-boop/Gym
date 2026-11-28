export interface MuscleAliasEntry {
  /** Open Anatomy 3D catalog keys (bilateral or midline) */
  catalogKeys: string[];
  /** Human-readable anatomical region */
  region: string;
  /** Primary anatomical function */
  functionSummary: string;
  /** Honest note if the 3D model groups this muscle under a broader structure */
  modelCoverageNote?: string;
}

/**
 * Centralized mapping from exercise muscle names, scientific names,
 * muscle heads, and body regions to open-anatomy-3d catalog keys.
 */
export const MUSCLE_ALIASES: Record<string, MuscleAliasEntry> = {
  // Chest
  chest: {
    catalogKeys: ['chest_muscles_l', 'chest_muscles_r'],
    region: 'Chest (Anterior Thorax)',
    functionSummary: 'Horizontal adduction, flexion, and internal rotation of the humerus.',
  },
  pectorals: {
    catalogKeys: ['chest_muscles_l', 'chest_muscles_r'],
    region: 'Chest (Anterior Thorax)',
    functionSummary: 'Horizontal adduction, flexion, and internal rotation of the humerus.',
  },
  'pectoralis major': {
    catalogKeys: ['chest_muscles_l', 'chest_muscles_r'],
    region: 'Chest (Anterior Thorax)',
    functionSummary: 'Primary pressing and horizontal adduction mover of the upper arm.',
  },
  'clavicular pectoralis': {
    catalogKeys: ['chest_muscles_l', 'chest_muscles_r'],
    region: 'Upper Chest',
    functionSummary: 'Shoulder flexion and upper-chest horizontal adduction.',
    modelCoverageNote: 'Grouped under Chest (Pectoral) Muscle in the 3D model.',
  },
  'sternal pectoralis': {
    catalogKeys: ['chest_muscles_l', 'chest_muscles_r'],
    region: 'Mid/Lower Chest',
    functionSummary: 'Horizontal adduction and shoulder extension from flexed positions.',
    modelCoverageNote: 'Grouped under Chest (Pectoral) Muscle in the 3D model.',
  },

  // Back & Spine
  back: {
    catalogKeys: ['back_muscles_l', 'back_muscles_r'],
    region: 'Posterior Torso',
    functionSummary: 'Shoulder extension, adduction, scapular retraction, and spinal extension.',
  },
  lats: {
    catalogKeys: ['back_muscles_l', 'back_muscles_r'],
    region: 'Back (Latissimus Dorsi)',
    functionSummary: 'Shoulder extension, adduction, and internal rotation.',
    modelCoverageNote: 'Grouped under Back Muscles in the 3D model.',
  },
  'latissimus dorsi': {
    catalogKeys: ['back_muscles_l', 'back_muscles_r'],
    region: 'Back (Latissimus Dorsi)',
    functionSummary: 'Pulls the humerus down and back during vertical and horizontal pulling.',
    modelCoverageNote: 'Grouped under Back Muscles in the 3D model.',
  },
  rhomboids: {
    catalogKeys: ['back_muscles_l', 'back_muscles_r'],
    region: 'Upper Back',
    functionSummary: 'Retracts and stabilizes the scapulae.',
    modelCoverageNote: 'Grouped under Back Muscles in the 3D model.',
  },
  'erector spinae': {
    catalogKeys: ['back_muscles_l', 'back_muscles_r'],
    region: 'Lower Back / Spine',
    functionSummary: 'Extends and stabilizes the vertebral column against flexion.',
    modelCoverageNote: 'Grouped under Back Muscles in the 3D model.',
  },
  'lower back': {
    catalogKeys: ['back_muscles_l', 'back_muscles_r'],
    region: 'Lumbar Spine',
    functionSummary: 'Spinal extension and anti-flexion stabilization.',
    modelCoverageNote: 'Grouped under Back Muscles in the 3D model.',
  },
  'spinal stability': {
    catalogKeys: ['back_muscles_l', 'back_muscles_r', 'abdominal_muscles'],
    region: 'Trunk & Spine',
    functionSummary: 'Maintains neutral spinal alignment under external load.',
    modelCoverageNote: 'Represented by Back Muscles and Abdominal Wall Muscles in the 3D model.',
  },
  traps: {
    catalogKeys: ['trapezius_l', 'trapezius_r'],
    region: 'Upper Back & Neck',
    functionSummary: 'Elevates, retracts, and rotates the scapulae.',
  },
  trapezius: {
    catalogKeys: ['trapezius_l', 'trapezius_r'],
    region: 'Upper Back & Neck',
    functionSummary: 'Controls scapular elevation, upward rotation, and retraction.',
  },

  // Shoulders
  shoulders: {
    catalogKeys: ['deltoid_l', 'deltoid_r'],
    region: 'Shoulder (Deltoid)',
    functionSummary: 'Shoulder abduction, flexion, and extension.',
  },
  deltoid: {
    catalogKeys: ['deltoid_l', 'deltoid_r'],
    region: 'Shoulder (Deltoid)',
    functionSummary: 'Abducts, flexes, and extends the glenohumeral joint.',
  },
  deltoids: {
    catalogKeys: ['deltoid_l', 'deltoid_r'],
    region: 'Shoulder (Deltoid)',
    functionSummary: 'Abducts, flexes, and extends the glenohumeral joint.',
  },
  'anterior deltoid': {
    catalogKeys: ['deltoid_l', 'deltoid_r'],
    region: 'Front Shoulder',
    functionSummary: 'Shoulder flexion and horizontal adduction.',
    modelCoverageNote: 'Individual deltoid heads are grouped under Deltoid (Shoulder) in the 3D model.',
  },
  'lateral deltoid': {
    catalogKeys: ['deltoid_l', 'deltoid_r'],
    region: 'Side Shoulder',
    functionSummary: 'Shoulder abduction in the frontal plane.',
    modelCoverageNote: 'Individual deltoid heads are grouped under Deltoid (Shoulder) in the 3D model.',
  },
  'posterior deltoid': {
    catalogKeys: ['deltoid_l', 'deltoid_r'],
    region: 'Rear Shoulder',
    functionSummary: 'Horizontal abduction and external rotation of the shoulder.',
    modelCoverageNote: 'Individual deltoid heads are grouped under Deltoid (Shoulder) in the 3D model.',
  },
  'rotator cuff': {
    catalogKeys: ['rotator_cuff_l', 'rotator_cuff_r'],
    region: 'Deep Shoulder',
    functionSummary: 'Dynamically stabilizes the humeral head in the glenoid fossa.',
  },

  // Arms
  biceps: {
    catalogKeys: ['upper_arm_muscles_l', 'upper_arm_muscles_r'],
    region: 'Anterior Upper Arm',
    functionSummary: 'Elbow flexion and forearm supination.',
    modelCoverageNote: 'Grouped under Upper Arm Muscles in the 3D model.',
  },
  'biceps brachii': {
    catalogKeys: ['upper_arm_muscles_l', 'upper_arm_muscles_r'],
    region: 'Anterior Upper Arm',
    functionSummary: 'Elbow flexion, forearm supination, and weak shoulder flexion.',
    modelCoverageNote: 'Grouped under Upper Arm Muscles in the 3D model.',
  },
  brachialis: {
    catalogKeys: ['upper_arm_muscles_l', 'upper_arm_muscles_r'],
    region: 'Anterior Upper Arm',
    functionSummary: 'Pure elbow flexor regardless of forearm rotation.',
    modelCoverageNote: 'Grouped under Upper Arm Muscles in the 3D model.',
  },
  triceps: {
    catalogKeys: ['upper_arm_muscles_l', 'upper_arm_muscles_r'],
    region: 'Posterior Upper Arm',
    functionSummary: 'Elbow extension and shoulder extension assistance.',
    modelCoverageNote: 'Grouped under Upper Arm Muscles in the 3D model.',
  },
  'triceps brachii': {
    catalogKeys: ['upper_arm_muscles_l', 'upper_arm_muscles_r'],
    region: 'Posterior Upper Arm',
    functionSummary: 'Primary extensor of the elbow joint.',
    modelCoverageNote: 'Grouped under Upper Arm Muscles in the 3D model.',
  },
  forearms: {
    catalogKeys: ['forearm_muscles_l', 'forearm_muscles_r'],
    region: 'Forearm',
    functionSummary: 'Wrist flexion/extension, pronation/supination, and grip strength.',
  },
  forearm: {
    catalogKeys: ['forearm_muscles_l', 'forearm_muscles_r'],
    region: 'Forearm',
    functionSummary: 'Wrist control and grip stabilization.',
  },
  brachioradialis: {
    catalogKeys: ['forearm_muscles_l', 'forearm_muscles_r'],
    region: 'Lateral Forearm',
    functionSummary: 'Flexes the elbow, strongest in neutral (hammer) grip.',
    modelCoverageNote: 'Grouped under Forearm Muscles in the 3D model.',
  },
  'wrist flexors': {
    catalogKeys: ['forearm_muscles_l', 'forearm_muscles_r'],
    region: 'Anterior Forearm',
    functionSummary: 'Flexes the wrist and assists with finger grip.',
    modelCoverageNote: 'Grouped under Forearm Muscles in the 3D model.',
  },
  'wrist extensors': {
    catalogKeys: ['forearm_muscles_l', 'forearm_muscles_r'],
    region: 'Posterior Forearm',
    functionSummary: 'Extends the wrist and stabilizes during gripping.',
    modelCoverageNote: 'Grouped under Forearm Muscles in the 3D model.',
  },

  // Core & Abs
  abs: {
    catalogKeys: ['abdominal_muscles'],
    region: 'Anterior Core',
    functionSummary: 'Spinal flexion, pelvic tilt, and anterior trunk bracing.',
  },
  abdominals: {
    catalogKeys: ['abdominal_muscles'],
    region: 'Anterior Core',
    functionSummary: 'Spinal flexion and intra-abdominal pressure stabilization.',
  },
  'rectus abdominis': {
    catalogKeys: ['abdominal_muscles'],
    region: 'Anterior Core',
    functionSummary: 'Flexes the lumbar spine and resists spinal extension.',
    modelCoverageNote: 'Grouped under Abdominal Wall Muscles in the 3D model.',
  },
  'transverse abdominis': {
    catalogKeys: ['abdominal_muscles'],
    region: 'Deep Core',
    functionSummary: 'Compresses the abdominal wall and stabilizes the lumbar spine.',
    modelCoverageNote: 'Grouped under Abdominal Wall Muscles in the 3D model.',
  },
  core: {
    catalogKeys: ['abdominal_muscles'],
    region: 'Trunk / Core',
    functionSummary: 'Transfers force and stabilizes the spine and pelvis.',
  },
  obliques: {
    catalogKeys: ['abdominal_muscles'],
    region: 'Lateral Core',
    functionSummary: 'Trunk rotation, lateral flexion, and anti-rotation stability.',
    modelCoverageNote: 'Grouped under Abdominal Wall Muscles in the 3D model.',
  },
  'anti-extension': {
    catalogKeys: ['abdominal_muscles'],
    region: 'Anterior Core',
    functionSummary: 'Resists lumbar hyperextension under load.',
    modelCoverageNote: 'Represented by Abdominal Wall Muscles in the 3D model.',
  },
  'anti-rotation': {
    catalogKeys: ['abdominal_muscles'],
    region: 'Core & Obliques',
    functionSummary: 'Resists rotational torque through the torso.',
    modelCoverageNote: 'Represented by Abdominal Wall Muscles in the 3D model.',
  },
  'anti-lateral-flexion': {
    catalogKeys: ['abdominal_muscles'],
    region: 'Lateral Core',
    functionSummary: 'Resists side-bending under unilateral load.',
    modelCoverageNote: 'Represented by Abdominal Wall Muscles in the 3D model.',
  },

  // Legs & Glutes
  quadriceps: {
    catalogKeys: ['quadriceps_l', 'quadriceps_r'],
    region: 'Anterior Thigh',
    functionSummary: 'Knee extension and hip flexion assistance (rectus femoris).',
  },
  quads: {
    catalogKeys: ['quadriceps_l', 'quadriceps_r'],
    region: 'Anterior Thigh',
    functionSummary: 'Primary extensors of the knee joint.',
  },
  hamstrings: {
    catalogKeys: ['hamstrings_l', 'hamstrings_r'],
    region: 'Posterior Thigh',
    functionSummary: 'Knee flexion and hip extension.',
  },
  glutes: {
    catalogKeys: ['gluteal_l', 'gluteal_r'],
    region: 'Posterior Hip',
    functionSummary: 'Hip extension, abduction, and external rotation.',
  },
  'gluteus maximus': {
    catalogKeys: ['gluteal_l', 'gluteal_r'],
    region: 'Posterior Hip',
    functionSummary: 'Primary hip extensor and external rotator.',
    modelCoverageNote: 'Grouped under Gluteal Muscles in the 3D model.',
  },
  'gluteus medius': {
    catalogKeys: ['gluteal_l', 'gluteal_r'],
    region: 'Lateral Hip',
    functionSummary: 'Hip abduction and pelvic stabilization in single-leg stance.',
    modelCoverageNote: 'Grouped under Gluteal Muscles in the 3D model.',
  },
  abductors: {
    catalogKeys: ['gluteal_l', 'gluteal_r'],
    region: 'Lateral Hip',
    functionSummary: 'Moves the thigh away from the midline and stabilizes the pelvis.',
    modelCoverageNote: 'Represented by Gluteal Muscles in the 3D model.',
  },
  adductors: {
    catalogKeys: ['adductors_l', 'adductors_r'],
    region: 'Medial Thigh',
    functionSummary: 'Hip adduction and frontal-plane hip stabilization.',
  },
  calves: {
    catalogKeys: ['calf_l', 'calf_r'],
    region: 'Posterior Lower Leg',
    functionSummary: 'Ankle plantarflexion and knee flexion assistance.',
  },
  gastrocnemius: {
    catalogKeys: ['calf_l', 'calf_r'],
    region: 'Posterior Lower Leg',
    functionSummary: 'Plantarflexes the ankle with an extended knee.',
    modelCoverageNote: 'Grouped under Calf Muscles in the 3D model.',
  },
  soleus: {
    catalogKeys: ['calf_l', 'calf_r'],
    region: 'Deep Posterior Lower Leg',
    functionSummary: 'Plantarflexes the ankle, especially with a bent knee.',
    modelCoverageNote: 'Grouped under Calf Muscles in the 3D model.',
  },
  'hip flexors': {
    catalogKeys: ['iliopsoas_l', 'iliopsoas_r'],
    region: 'Anterior Hip',
    functionSummary: 'Flexes the hip and stabilizes the lumbar-pelvic junction.',
  },
  iliopsoas: {
    catalogKeys: ['iliopsoas_l', 'iliopsoas_r'],
    region: 'Anterior Hip',
    functionSummary: 'Primary hip flexor.',
  },
};

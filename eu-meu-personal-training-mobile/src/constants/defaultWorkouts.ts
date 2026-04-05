/**
 * Default workout data for Eu Meu Personal Training
 * Provides initial workout templates with example data for Treino A
 * and empty templates for Treino B, C, D
 * **Validates: Requirements 1.1**
 */

import { Workout, WorkoutCategory, Exercise, WarmupActivity, StretchActivity } from '../types';

/**
 * Generates a simple UUID for default data
 * Note: In production, use a proper UUID library
 */
function generateId(): string {
  return 'default-' + Math.random().toString(36).substring(2, 11);
}

/**
 * Example warmup activities for Treino A
 */
const treinoAWarmups: WarmupActivity[] = [
  {
    id: generateId(),
    name: 'Esteira leve',
    durationSeconds: 300, // 5 minutes
    executionLink: undefined,
    order: 0,
  },
  {
    id: generateId(),
    name: 'Rotação de ombros',
    durationSeconds: 60, // 1 minute
    executionLink: undefined,
    order: 1,
  },
  {
    id: generateId(),
    name: 'Mobilidade de braços',
    durationSeconds: 60, // 1 minute
    executionLink: undefined,
    order: 2,
  },
];

/**
 * Example exercises for Treino A (Peito + Ombros)
 */
const treinoAExercises: Exercise[] = [
  {
    id: generateId(),
    name: 'Supino Reto',
    mediaUri: undefined,
    executionLink: undefined,
    sets: 4,
    reps: '8-12',
    restSeconds: 90,
    loadKg: 30,
    notes: 'Manter cotovelos a 45 graus',
    order: 0,
  },
  {
    id: generateId(),
    name: 'Supino Inclinado',
    mediaUri: undefined,
    executionLink: undefined,
    sets: 4,
    reps: '8-12',
    restSeconds: 90,
    loadKg: 25,
    notes: 'Banco a 30-45 graus',
    order: 1,
  },
  {
    id: generateId(),
    name: 'Crucifixo',
    mediaUri: undefined,
    executionLink: undefined,
    sets: 3,
    reps: '10-12',
    restSeconds: 60,
    loadKg: 12,
    notes: 'Movimento controlado',
    order: 2,
  },
  {
    id: generateId(),
    name: 'Desenvolvimento de Ombros',
    mediaUri: undefined,
    executionLink: undefined,
    sets: 4,
    reps: '8-12',
    restSeconds: 90,
    loadKg: 20,
    notes: 'Não travar os cotovelos no topo',
    order: 3,
  },
  {
    id: generateId(),
    name: 'Elevação Lateral',
    mediaUri: undefined,
    executionLink: undefined,
    sets: 3,
    reps: '12-15',
    restSeconds: 60,
    loadKg: 8,
    notes: 'Cotovelos levemente flexionados',
    order: 4,
  },
];

/**
 * Example stretches for Treino A
 */
const treinoAStretches: StretchActivity[] = [
  {
    id: generateId(),
    name: 'Alongamento de Peitoral',
    durationSeconds: 30,
    executionLink: undefined,
    targetMuscles: 'Peitoral maior e menor',
    order: 0,
  },
  {
    id: generateId(),
    name: 'Alongamento de Ombros',
    durationSeconds: 30,
    executionLink: undefined,
    targetMuscles: 'Deltoides anterior e lateral',
    order: 1,
  },
  {
    id: generateId(),
    name: 'Alongamento de Tríceps',
    durationSeconds: 30,
    executionLink: undefined,
    targetMuscles: 'Tríceps braquial',
    order: 2,
  },
];

/**
 * Creates the default workouts with example data for Treino A
 * and empty templates for Treino B, C, D
 * **Validates: Requirements 1.1**
 */
export function createDefaultWorkouts(): Record<WorkoutCategory, Workout> {
  const now = new Date().toISOString();
  
  return {
    A: {
      id: 'A',
      name: 'Treino A',
      description: 'Peito + Ombros (ant. e lat.)',
      warmups: treinoAWarmups,
      exercises: treinoAExercises,
      stretches: treinoAStretches,
      updatedAt: now,
    },
    B: {
      id: 'B',
      name: 'Treino B',
      description: 'Pernas + Glúteos',
      warmups: [],
      exercises: [],
      stretches: [],
      updatedAt: now,
    },
    C: {
      id: 'C',
      name: 'Treino C',
      description: 'Costas + Lombar + Abdômen',
      warmups: [],
      exercises: [],
      stretches: [],
      updatedAt: now,
    },
    D: {
      id: 'D',
      name: 'Treino D',
      description: 'Bíceps + Tríceps + Glúteos',
      warmups: [],
      exercises: [],
      stretches: [],
      updatedAt: now,
    },
  };
}

/**
 * Default workouts constant - can be used for initial state
 * Note: This creates a new instance each time to avoid mutation issues
 */
export const DEFAULT_WORKOUTS = createDefaultWorkouts();

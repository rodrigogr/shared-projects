/**
 * JSON Serialization utilities for Eu Meu Personal Training
 * Handles serialization and deserialization of workout data
 * **Validates: Requirements 9.4, 9.5**
 */

import {
  StorageSchema,
  Workout,
  WorkoutCategory,
  WorkoutSession,
  Exercise,
  WarmupActivity,
  StretchActivity,
} from '../types';

const CURRENT_SCHEMA_VERSION = 1;

export interface SerializationResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface DeserializationResult {
  success: boolean;
  data?: StorageSchema;
  error?: string;
}

/**
 * Serializes workout data to JSON string
 * **Feature: eu-meu-personal-training, Property 8: Data serialization round-trip**
 * **Validates: Requirements 9.4**
 */
export function serializeWorkouts(
  workouts: Record<WorkoutCategory, Workout>,
  sessions: WorkoutSession[] = []
): SerializationResult {
  try {
    const schema: StorageSchema = {
      version: CURRENT_SCHEMA_VERSION,
      workouts,
      sessions,
      lastUpdated: new Date().toISOString(),
    };
    
    const jsonString = JSON.stringify(schema);
    return { success: true, data: jsonString };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown serialization error';
    return { success: false, error: `Erro ao serializar dados: ${errorMessage}` };
  }
}

/**
 * Validates that an object has the expected Exercise structure
 */
function isValidExercise(obj: unknown): obj is Exercise {
  if (typeof obj !== 'object' || obj === null) return false;
  const e = obj as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.name === 'string' &&
    typeof e.sets === 'number' &&
    typeof e.reps === 'string' &&
    typeof e.restSeconds === 'number' &&
    typeof e.loadKg === 'number' &&
    typeof e.order === 'number' &&
    (e.mediaUri === undefined || typeof e.mediaUri === 'string') &&
    (e.executionLink === undefined || typeof e.executionLink === 'string') &&
    (e.notes === undefined || typeof e.notes === 'string')
  );
}

/**
 * Validates that an object has the expected WarmupActivity structure
 */
function isValidWarmup(obj: unknown): obj is WarmupActivity {
  if (typeof obj !== 'object' || obj === null) return false;
  const w = obj as Record<string, unknown>;
  return (
    typeof w.id === 'string' &&
    typeof w.name === 'string' &&
    typeof w.durationSeconds === 'number' &&
    typeof w.order === 'number' &&
    (w.executionLink === undefined || typeof w.executionLink === 'string')
  );
}

/**
 * Validates that an object has the expected StretchActivity structure
 */
function isValidStretch(obj: unknown): obj is StretchActivity {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.durationSeconds === 'number' &&
    typeof s.targetMuscles === 'string' &&
    typeof s.order === 'number' &&
    (s.executionLink === undefined || typeof s.executionLink === 'string')
  );
}

/**
 * Validates that an object has the expected Workout structure.
 * IDs are now arbitrary strings (no longer restricted to A/B/C/D), but the
 * id MUST be a non-empty string and the structural fields must all be present.
 */
function isValidWorkout(obj: unknown): obj is Workout {
  if (typeof obj !== 'object' || obj === null) return false;
  const w = obj as Record<string, unknown>;

  if (
    typeof w.id !== 'string' ||
    w.id.length === 0 ||
    typeof w.name !== 'string' ||
    typeof w.description !== 'string' ||
    typeof w.updatedAt !== 'string' ||
    !Array.isArray(w.warmups) ||
    !Array.isArray(w.exercises) ||
    !Array.isArray(w.stretches)
  ) {
    return false;
  }

  return (
    w.warmups.every(isValidWarmup) &&
    w.exercises.every(isValidExercise) &&
    w.stretches.every(isValidStretch)
  );
}

/**
 * Validates a WorkoutSession entry.
 */
function isValidSession(obj: unknown): obj is WorkoutSession {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.workoutId === 'string' &&
    typeof s.workoutName === 'string' &&
    typeof s.startedAt === 'string' &&
    typeof s.completedAt === 'string' &&
    typeof s.durationSeconds === 'number' &&
    typeof s.warmupsCompleted === 'number' &&
    typeof s.exercisesCompleted === 'number' &&
    typeof s.setsCompleted === 'number' &&
    typeof s.stretchesCompleted === 'number'
  );
}

/**
 * Validates the complete storage schema structure.
 * Accepts any non-empty workouts record (no required category set).
 * `sessions` is optional and, when present, must be an array of valid sessions.
 */
function isValidStorageSchema(obj: unknown): obj is StorageSchema {
  if (typeof obj !== 'object' || obj === null) return false;
  const schema = obj as Record<string, unknown>;

  if (
    typeof schema.version !== 'number' ||
    typeof schema.lastUpdated !== 'string' ||
    typeof schema.workouts !== 'object' ||
    schema.workouts === null
  ) {
    return false;
  }

  const workouts = schema.workouts as Record<string, unknown>;
  const ids = Object.keys(workouts);
  if (!ids.every((id) => isValidWorkout(workouts[id]) && (workouts[id] as Workout).id === id)) {
    return false;
  }

  if (schema.sessions !== undefined) {
    if (!Array.isArray(schema.sessions)) return false;
    if (!schema.sessions.every(isValidSession)) return false;
  }

  return true;
}

/**
 * Deserializes JSON string to workout data with validation
 * **Feature: eu-meu-personal-training, Property 8: Data serialization round-trip**
 * **Validates: Requirements 9.5**
 */
export function deserializeWorkouts(jsonString: string): DeserializationResult {
  try {
    if (typeof jsonString !== 'string' || jsonString.trim().length === 0) {
      return { success: false, error: 'Dados inválidos: string vazia' };
    }
    
    const parsed = JSON.parse(jsonString);
    
    if (!isValidStorageSchema(parsed)) {
      return { success: false, error: 'Dados corrompidos. Estrutura inválida.' };
    }
    
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Dados corrompidos. JSON inválido.' };
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown deserialization error';
    return { success: false, error: `Erro ao deserializar dados: ${errorMessage}` };
  }
}

/**
 * Creates a serializable copy of workouts (for testing round-trip)
 * This ensures dates and other values are properly handled
 */
export function createStorageSchema(
  workouts: Record<WorkoutCategory, Workout>,
  sessions: WorkoutSession[] = []
): StorageSchema {
  return {
    version: CURRENT_SCHEMA_VERSION,
    workouts,
    sessions,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Hook for persisting workout data + sessions to AsyncStorage.
 *
 * The on-disk payload is a single `StorageSchema` JSON document containing
 * the workouts record and the array of completed `WorkoutSession`s. This
 * keeps backup/restore logic trivial (one document round-trips everything).
 */

import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, WorkoutCategory, WorkoutSession } from '../types';
import { serializeWorkouts, deserializeWorkouts } from '../utils/serializer';
import { createDefaultWorkouts } from '../constants/defaultWorkouts';

const STORAGE_KEY = '@eu_meu_personal_training:workouts';

export interface LoadedStorage {
  workouts: Record<WorkoutCategory, Workout>;
  sessions: WorkoutSession[];
}

export interface UseWorkoutStorageReturn {
  save: (
    workouts: Record<WorkoutCategory, Workout>,
    sessions: WorkoutSession[]
  ) => Promise<boolean>;
  load: () => Promise<LoadedStorage | null>;
}

// Re-export createDefaultWorkouts for backward compatibility
export { createDefaultWorkouts };

export function useWorkoutStorage(): UseWorkoutStorageReturn {
  const save = useCallback(
    async (
      workouts: Record<WorkoutCategory, Workout>,
      sessions: WorkoutSession[]
    ): Promise<boolean> => {
      try {
        const serialized = serializeWorkouts(workouts, sessions);

        if (!serialized.success || !serialized.data) {
          console.error('Serialization failed:', serialized.error);
          return false;
        }

        await AsyncStorage.setItem(STORAGE_KEY, serialized.data);
        return true;
      } catch (error) {
        console.error('Failed to save workouts:', error);
        return false;
      }
    },
    []
  );

  const load = useCallback(async (): Promise<LoadedStorage | null> => {
    try {
      const jsonString = await AsyncStorage.getItem(STORAGE_KEY);

      if (jsonString === null) {
        return null;
      }

      const deserialized = deserializeWorkouts(jsonString);

      if (!deserialized.success || !deserialized.data) {
        console.error('Deserialization failed:', deserialized.error);
        return null;
      }

      return {
        workouts: deserialized.data.workouts,
        sessions: deserialized.data.sessions ?? [],
      };
    } catch (error) {
      console.error('Failed to load workouts:', error);
      return null;
    }
  }, []);

  return { save, load };
}

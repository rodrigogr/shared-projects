/**
 * Hook for persisting workout data to AsyncStorage
 * **Validates: Requirements 9.1, 9.2, 9.3**
 */

import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, WorkoutCategory } from '../types';
import { serializeWorkouts, deserializeWorkouts } from '../utils/serializer';
import { createDefaultWorkouts } from '../constants/defaultWorkouts';

const STORAGE_KEY = '@eu_meu_personal_training:workouts';

export interface UseWorkoutStorageReturn {
  save: (workouts: Record<WorkoutCategory, Workout>) => Promise<boolean>;
  load: () => Promise<Record<WorkoutCategory, Workout> | null>;
}

// Re-export createDefaultWorkouts for backward compatibility
export { createDefaultWorkouts };

/**
 * Hook for managing workout data persistence
 * 
 * Provides save and load functions for workout data using AsyncStorage.
 * Handles serialization/deserialization and error recovery.
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3**
 */
export function useWorkoutStorage(): UseWorkoutStorageReturn {
  /**
   * Saves workout data to AsyncStorage
   * Returns true on success, false on failure
   * **Validates: Requirements 9.1, 9.3**
   */
  const save = useCallback(
    async (workouts: Record<WorkoutCategory, Workout>): Promise<boolean> => {
      try {
        const serialized = serializeWorkouts(workouts);
        
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

  /**
   * Loads workout data from AsyncStorage
   * Returns null if no data exists or on error (caller should use defaults)
   * **Validates: Requirements 9.2**
   */
  const load = useCallback(async (): Promise<Record<WorkoutCategory, Workout> | null> => {
    try {
      const jsonString = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (jsonString === null) {
        // No data stored yet - return null to indicate caller should use defaults
        return null;
      }
      
      const deserialized = deserializeWorkouts(jsonString);
      
      if (!deserialized.success || !deserialized.data) {
        console.error('Deserialization failed:', deserialized.error);
        // Data is corrupted - return null to indicate caller should use defaults
        return null;
      }
      
      return deserialized.data.workouts;
    } catch (error) {
      console.error('Failed to load workouts:', error);
      return null;
    }
  }, []);

  return { save, load };
}

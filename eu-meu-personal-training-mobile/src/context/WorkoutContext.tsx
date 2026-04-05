/**
 * WorkoutContext - Global state management for workout data
 * Provides CRUD operations for exercises, warmups, and stretches
 * **Validates: Requirements 2.2, 3.2, 7.2, 9.1, 9.2, 9.3**
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  Workout,
  WorkoutCategory,
  Exercise,
  WarmupActivity,
  StretchActivity,
} from '../types';
import { useWorkoutStorage, createDefaultWorkouts } from '../hooks/useWorkoutStorage';
import { validateExerciseName } from '../utils/validators';

// Action types
type WorkoutAction =
  | { type: 'SET_WORKOUTS'; payload: Record<string, Workout> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_WORKOUT'; payload: Workout }
  | { type: 'UPDATE_WORKOUT'; payload: { workoutId: string; data: Partial<Workout> } }
  | { type: 'DELETE_WORKOUT'; payload: string }
  | { type: 'ADD_EXERCISE'; payload: { workoutId: string; exercise: Exercise } }
  | { type: 'UPDATE_EXERCISE'; payload: { workoutId: string; exerciseId: string; data: Partial<Exercise> } }
  | { type: 'DELETE_EXERCISE'; payload: { workoutId: string; exerciseId: string } }
  | { type: 'REORDER_EXERCISES'; payload: { workoutId: string; exerciseIds: string[] } }
  | { type: 'ADD_WARMUP'; payload: { workoutId: string; warmup: WarmupActivity } }
  | { type: 'UPDATE_WARMUP'; payload: { workoutId: string; warmupId: string; data: Partial<WarmupActivity> } }
  | { type: 'DELETE_WARMUP'; payload: { workoutId: string; warmupId: string } }
  | { type: 'ADD_STRETCH'; payload: { workoutId: string; stretch: StretchActivity } }
  | { type: 'UPDATE_STRETCH'; payload: { workoutId: string; stretchId: string; data: Partial<StretchActivity> } }
  | { type: 'DELETE_STRETCH'; payload: { workoutId: string; stretchId: string } };

// State interface
interface WorkoutState {
  workouts: Record<string, Workout>;
  isLoading: boolean;
}

// Context value interface
export interface WorkoutContextValue {
  workouts: Record<string, Workout>;
  isLoading: boolean;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workoutId: string, data: Partial<Workout>) => void;
  deleteWorkout: (workoutId: string) => void;
  addExercise: (workoutId: string, exercise: Exercise) => boolean;
  updateExercise: (workoutId: string, exerciseId: string, data: Partial<Exercise>) => void;
  deleteExercise: (workoutId: string, exerciseId: string) => void;
  reorderExercises: (workoutId: string, exerciseIds: string[]) => void;
  addWarmup: (workoutId: string, warmup: WarmupActivity) => void;
  updateWarmup: (workoutId: string, warmupId: string, data: Partial<WarmupActivity>) => void;
  deleteWarmup: (workoutId: string, warmupId: string) => void;
  addStretch: (workoutId: string, stretch: StretchActivity) => void;
  updateStretch: (workoutId: string, stretchId: string, data: Partial<StretchActivity>) => void;
  deleteStretch: (workoutId: string, stretchId: string) => void;
}


/**
 * Reducer for workout state management
 * Implements immutable state updates for all CRUD operations
 * **Validates: Requirements 2.2, 3.2, 7.2**
 */
function workoutReducer(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case 'SET_WORKOUTS':
      return { ...state, workouts: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'ADD_WORKOUT': {
      const workout = action.payload;
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workout.id]: workout,
        },
      };
    }

    case 'UPDATE_WORKOUT': {
      const { workoutId, data } = action.payload;
      const workout = state.workouts[workoutId];
      if (!workout) return state;
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            ...data,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'DELETE_WORKOUT': {
      const workoutId = action.payload;
      const { [workoutId]: _, ...remainingWorkouts } = state.workouts;
      return {
        ...state,
        workouts: remainingWorkouts,
      };
    }

    case 'ADD_EXERCISE': {
      const { workoutId, exercise } = action.payload;
      const workout = state.workouts[workoutId];
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            exercises: [...workout.exercises, exercise],
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'UPDATE_EXERCISE': {
      const { workoutId, exerciseId, data } = action.payload;
      const workout = state.workouts[workoutId];
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            exercises: workout.exercises.map((ex) =>
              ex.id === exerciseId ? { ...ex, ...data } : ex
            ),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'DELETE_EXERCISE': {
      const { workoutId, exerciseId } = action.payload;
      const workout = state.workouts[workoutId];
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            exercises: workout.exercises.filter((ex) => ex.id !== exerciseId),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'REORDER_EXERCISES': {
      const { workoutId, exerciseIds } = action.payload;
      const workout = state.workouts[workoutId];
      const exerciseMap = new Map(workout.exercises.map((ex) => [ex.id, ex]));
      const reorderedExercises = exerciseIds
        .map((id, index) => {
          const exercise = exerciseMap.get(id);
          return exercise ? { ...exercise, order: index } : null;
        })
        .filter((ex): ex is Exercise => ex !== null);
      
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            exercises: reorderedExercises,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'ADD_WARMUP': {
      const { workoutId, warmup } = action.payload;
      const workout = state.workouts[workoutId];
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            warmups: [...workout.warmups, warmup],
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'UPDATE_WARMUP': {
      const { workoutId, warmupId, data } = action.payload;
      const workout = state.workouts[workoutId];
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            warmups: workout.warmups.map((w) =>
              w.id === warmupId ? { ...w, ...data } : w
            ),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'DELETE_WARMUP': {
      const { workoutId, warmupId } = action.payload;
      const workout = state.workouts[workoutId];
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            warmups: workout.warmups.filter((w) => w.id !== warmupId),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'ADD_STRETCH': {
      const { workoutId, stretch } = action.payload;
      const workout = state.workouts[workoutId];
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            stretches: [...workout.stretches, stretch],
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'UPDATE_STRETCH': {
      const { workoutId, stretchId, data } = action.payload;
      const workout = state.workouts[workoutId];
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            stretches: workout.stretches.map((s) =>
              s.id === stretchId ? { ...s, ...data } : s
            ),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'DELETE_STRETCH': {
      const { workoutId, stretchId } = action.payload;
      const workout = state.workouts[workoutId];
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            stretches: workout.stretches.filter((s) => s.id !== stretchId),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    default:
      return state;
  }
}


// Create context with undefined default (will be provided by WorkoutProvider)
const WorkoutContext = createContext<WorkoutContextValue | undefined>(undefined);

// Initial state
const initialState: WorkoutState = {
  workouts: createDefaultWorkouts(),
  isLoading: true,
};

interface WorkoutProviderProps {
  children: ReactNode;
}

/**
 * WorkoutProvider component
 * Initializes state from storage on mount and auto-saves on state changes
 * **Validates: Requirements 9.1, 9.2, 9.3**
 */
export function WorkoutProvider({ children }: WorkoutProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(workoutReducer, initialState);
  const { save, load } = useWorkoutStorage();

  // Load workouts from storage on mount
  useEffect(() => {
    const loadWorkouts = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      const storedWorkouts = await load();
      if (storedWorkouts) {
        dispatch({ type: 'SET_WORKOUTS', payload: storedWorkouts });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    };
    loadWorkouts();
  }, [load]);

  // Auto-save workouts when they change (skip initial load)
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!state.isLoading) {
      save(state.workouts);
    }
  }, [state.workouts, state.isLoading, save]);

  /**
   * Add a new workout
   */
  const addWorkout = useCallback(
    (workout: Workout): void => {
      dispatch({ type: 'ADD_WORKOUT', payload: workout });
    },
    []
  );

  /**
   * Update an existing workout
   */
  const updateWorkout = useCallback(
    (workoutId: string, data: Partial<Workout>): void => {
      dispatch({ type: 'UPDATE_WORKOUT', payload: { workoutId, data } });
    },
    []
  );

  /**
   * Delete a workout
   */
  const deleteWorkout = useCallback(
    (workoutId: string): void => {
      dispatch({ type: 'DELETE_WORKOUT', payload: workoutId });
    },
    []
  );

  /**
   * Add exercise to a workout
   * Returns false if validation fails (empty name)
   * **Validates: Requirements 2.2, 2.3, 2.4**
   */
  const addExercise = useCallback(
    (workoutId: string, exercise: Exercise): boolean => {
      const validation = validateExerciseName(exercise.name);
      if (!validation.isValid) {
        return false;
      }
      dispatch({ type: 'ADD_EXERCISE', payload: { workoutId, exercise } });
      return true;
    },
    []
  );

  /**
   * Update an existing exercise
   * **Validates: Requirements 3.2**
   */
  const updateExercise = useCallback(
    (workoutId: string, exerciseId: string, data: Partial<Exercise>): void => {
      dispatch({ type: 'UPDATE_EXERCISE', payload: { workoutId, exerciseId, data } });
    },
    []
  );

  /**
   * Delete an exercise from a workout
   * **Validates: Requirements 7.2**
   */
  const deleteExercise = useCallback(
    (workoutId: string, exerciseId: string): void => {
      dispatch({ type: 'DELETE_EXERCISE', payload: { workoutId, exerciseId } });
    },
    []
  );

  /**
   * Reorder exercises in a workout
   * **Validates: Requirements 10.2**
   */
  const reorderExercises = useCallback(
    (workoutId: string, exerciseIds: string[]): void => {
      dispatch({ type: 'REORDER_EXERCISES', payload: { workoutId, exerciseIds } });
    },
    []
  );

  /**
   * Add warmup to a workout
   * **Validates: Requirements 4.2**
   */
  const addWarmup = useCallback(
    (workoutId: string, warmup: WarmupActivity): void => {
      dispatch({ type: 'ADD_WARMUP', payload: { workoutId, warmup } });
    },
    []
  );

  /**
   * Update an existing warmup
   * **Validates: Requirements 4.3**
   */
  const updateWarmup = useCallback(
    (workoutId: string, warmupId: string, data: Partial<WarmupActivity>): void => {
      dispatch({ type: 'UPDATE_WARMUP', payload: { workoutId, warmupId, data } });
    },
    []
  );

  /**
   * Delete a warmup from a workout
   * **Validates: Requirements 4.4**
   */
  const deleteWarmup = useCallback(
    (workoutId: string, warmupId: string): void => {
      dispatch({ type: 'DELETE_WARMUP', payload: { workoutId, warmupId } });
    },
    []
  );

  /**
   * Add stretch to a workout
   * **Validates: Requirements 5.2**
   */
  const addStretch = useCallback(
    (workoutId: string, stretch: StretchActivity): void => {
      dispatch({ type: 'ADD_STRETCH', payload: { workoutId, stretch } });
    },
    []
  );

  /**
   * Update an existing stretch
   * **Validates: Requirements 5.3**
   */
  const updateStretch = useCallback(
    (workoutId: string, stretchId: string, data: Partial<StretchActivity>): void => {
      dispatch({ type: 'UPDATE_STRETCH', payload: { workoutId, stretchId, data } });
    },
    []
  );

  /**
   * Delete a stretch from a workout
   * **Validates: Requirements 5.4**
   */
  const deleteStretch = useCallback(
    (workoutId: string, stretchId: string): void => {
      dispatch({ type: 'DELETE_STRETCH', payload: { workoutId, stretchId } });
    },
    []
  );

  const contextValue: WorkoutContextValue = {
    workouts: state.workouts,
    isLoading: state.isLoading,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    addExercise,
    updateExercise,
    deleteExercise,
    reorderExercises,
    addWarmup,
    updateWarmup,
    deleteWarmup,
    addStretch,
    updateStretch,
    deleteStretch,
  };

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
}

/**
 * Hook to access workout context
 * Throws error if used outside WorkoutProvider
 */
export function useWorkoutContext(): WorkoutContextValue {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkoutContext must be used within a WorkoutProvider');
  }
  return context;
}

// Export reducer for testing purposes
export { workoutReducer };
export type { WorkoutState, WorkoutAction };

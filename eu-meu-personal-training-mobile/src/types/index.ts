// Type definitions for Eu Meu Personal Training
// These types will be implemented in task 2

import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

export type WorkoutCategory = string;

/**
 * Navigation params type definitions for type-safe navigation
 */
export type RootStackParamList = {
  Home: undefined;
  Workout: {
    workoutId: string;
  };
  ExerciseForm: {
    workoutId: string;
    exerciseId?: string;
  };
  WarmupForm: {
    workoutId: string;
    warmupId?: string;
  };
  StretchForm: {
    workoutId: string;
    stretchId?: string;
  };
  WorkoutForm: {
    workoutId?: string;
  };
  WorkoutExecution: {
    workoutId: string;
  };
};

/**
 * Navigation prop types for each screen
 */
export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
export type WorkoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Workout'>;
export type ExerciseFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ExerciseForm'>;
export type WarmupFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WarmupForm'>;
export type StretchFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'StretchForm'>;
export type WorkoutFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WorkoutForm'>;
export type WorkoutExecutionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WorkoutExecution'>;

/**
 * Route prop types for each screen
 */
export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
export type WorkoutScreenRouteProp = RouteProp<RootStackParamList, 'Workout'>;
export type ExerciseFormScreenRouteProp = RouteProp<RootStackParamList, 'ExerciseForm'>;
export type WarmupFormScreenRouteProp = RouteProp<RootStackParamList, 'WarmupForm'>;
export type StretchFormScreenRouteProp = RouteProp<RootStackParamList, 'StretchForm'>;
export type WorkoutFormScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutForm'>;
export type WorkoutExecutionScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutExecution'>;

export interface Exercise {
  id: string;
  name: string;
  mediaUri?: string;
  executionLink?: string;
  sets: number;
  reps: string;
  restSeconds: number;
  loadKg: number;
  notes?: string;
  order: number;
}

export interface WarmupActivity {
  id: string;
  name: string;
  durationSeconds: number;
  executionLink?: string;
  order: number;
}

export interface StretchActivity {
  id: string;
  name: string;
  durationSeconds: number;
  executionLink?: string;
  targetMuscles: string;
  order: number;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  warmups: WarmupActivity[];
  exercises: Exercise[];
  stretches: StretchActivity[];
  updatedAt: string;
  color?: string;
}

export interface StorageSchema {
  version: number;
  workouts: Record<string, Workout>;
  lastUpdated: string;
}

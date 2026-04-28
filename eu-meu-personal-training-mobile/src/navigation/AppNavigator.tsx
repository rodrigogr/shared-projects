/**
 * AppNavigator - Stack Navigator configuration for Eu Meu Personal Training
 * **Validates: Requirements 1.1, 1.2, 8.1, 8.2, 8.3**
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import {
  HomeScreen,
  WorkoutScreen,
  ExerciseFormScreen,
  WarmupFormScreen,
  StretchFormScreen,
  WorkoutFormScreen,
} from '../screens';
import { useTheme } from '../context/ThemeContext';
import { useWorkoutContext } from '../context/WorkoutContext';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * AppNavigator component
 * Configures Stack Navigator with all app screens.
 * - Home: Workout list
 * - Workout: Workout detail
 * - WorkoutForm: Create / edit workout (custom A/B/C/D... structure)
 * - ExerciseForm / WarmupForm / StretchForm: item forms
 */
export function AppNavigator(): React.ReactElement {
  const { colors } = useTheme();
  const { workouts } = useWorkoutContext();
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        cardStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Meus Treinos',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Workout"
        component={WorkoutScreen}
        options={({ route }) => ({
          title: workouts[route.params.workoutId]?.name ?? 'Treino',
        })}
      />
      <Stack.Screen
        name="WorkoutForm"
        component={WorkoutFormScreen}
        options={({ route }) => ({
          title: route.params?.workoutId ? 'Editar Treino' : 'Novo Treino',
        })}
      />
      <Stack.Screen
        name="ExerciseForm"
        component={ExerciseFormScreen}
        options={({ route }) => ({
          title: route.params.exerciseId ? 'Editar Exercício' : 'Novo Exercício',
        })}
      />
      <Stack.Screen
        name="WarmupForm"
        component={WarmupFormScreen}
        options={({ route }) => ({
          title: route.params.warmupId ? 'Editar Aquecimento' : 'Novo Aquecimento',
        })}
      />
      <Stack.Screen
        name="StretchForm"
        component={StretchFormScreen}
        options={({ route }) => ({
          title: route.params.stretchId ? 'Editar Alongamento' : 'Novo Alongamento',
        })}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;

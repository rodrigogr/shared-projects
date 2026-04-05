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
} from '../screens';
import { COLORS } from '../constants/theme';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * AppNavigator component
 * Configures Stack Navigator with all app screens
 * - Home: Main screen with workout categories
 * - Workout: Workout detail screen with exercises, warmups, stretches
 * - ExerciseForm: Create/edit exercise form
 * - WarmupForm: Create/edit warmup form
 * - StretchForm: Create/edit stretch form
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */
export function AppNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        cardStyle: {
          backgroundColor: COLORS.background,
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
          title: `Treino ${route.params.workoutId}`,
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

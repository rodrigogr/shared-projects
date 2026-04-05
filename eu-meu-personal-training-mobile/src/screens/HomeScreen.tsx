/**
 * HomeScreen - Displays workout categories (A, B, C, D) in a grid layout
 * **Validates: Requirements 1.1, 8.1, 8.2, 8.3**
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutContext } from '../context/WorkoutContext';
import { WorkoutCategory } from '../types';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/theme';

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

/**
 * HomeScreen component
 * Displays 4 workout cards (A, B, C, D) in a 2x2 grid layout
 * Shows workout name and muscle group description
 * Navigates to WorkoutScreen on card press
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */
export function HomeScreen({ navigation }: HomeScreenProps): React.ReactElement {
  const { workouts, isLoading } = useWorkoutContext();

  const handleWorkoutPress = (workoutId: WorkoutCategory) => {
    navigation.navigate('Workout', { workoutId });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando treinos...</Text>
      </SafeAreaView>
    );
  }

  const workoutColors: Record<WorkoutCategory, string> = {
    A: COLORS.cardA,
    B: COLORS.cardB,
    C: COLORS.cardC,
    D: COLORS.cardD,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>💪 Eu Meu Personal</Text>
          <Text style={styles.subtitle}>Selecione seu treino</Text>
        </View>
        
        <View style={styles.grid}>
          {(['A', 'B', 'C', 'D'] as WorkoutCategory[]).map((category) => {
            const workout = workouts[category];
            return (
              <TouchableOpacity
                key={category}
                style={[styles.card, { backgroundColor: workoutColors[category] }]}
                onPress={() => handleWorkoutPress(category)}
                activeOpacity={0.85}
                testID={`workout-card-${category}`}
              >
                <Text style={styles.cardLetter}>{category}</Text>
                <Text style={styles.cardName}>{workout.name}</Text>
                <Text style={styles.cardDescription}>{workout.description}</Text>
                <View style={styles.cardStats}>
                  <Text style={styles.cardStatText}>
                    {workout.exercises.length} exercícios
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Desenvolvido por Rodrigo Gonçalves Rebelo</Text>
          <Text style={styles.footerCopyright}>Copyright © 2025</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  header: {
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    minHeight: 170,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  cardLetter: {
    fontSize: FONT_SIZES.hero,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.25)',
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.md,
  },
  cardName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  cardDescription: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  cardStats: {
    backgroundColor: COLORS.cardOverlay,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm + 2,
    alignSelf: 'flex-start',
  },
  cardStatText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  footer: {
    marginTop: SPACING.xxl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footerCopyright: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});

export default HomeScreen;

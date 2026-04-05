/**
 * WorkoutScreen - Displays workout details with warmups, exercises, and stretches
 * **Validates: Requirements 1.2, 1.3, 1.4, 8.1, 8.2, 8.3, 10.1, 10.2**
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useWorkoutContext } from '../context/WorkoutContext';
import { WorkoutCategory, Exercise, WarmupActivity, StretchActivity } from '../types';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, TOUCH_TARGETS } from '../constants/theme';

interface WorkoutScreenProps {
  route: {
    params: {
      workoutId: WorkoutCategory;
    };
  };
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    goBack: () => void;
  };
}

/**
 * WorkoutScreen component
 * Displays warmup section at top, exercises list in order, stretches at bottom
 * Includes floating action button for adding exercises
 */
export function WorkoutScreen({ route, navigation }: WorkoutScreenProps): React.ReactElement {
  const { workoutId } = route.params;
  const { workouts, deleteExercise, deleteWarmup, deleteStretch, reorderExercises } = useWorkoutContext();
  const workout = workouts[workoutId];


  const handleDeleteExercise = (exerciseId: string, exerciseName: string) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir "${exerciseName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteExercise(workoutId, exerciseId),
        },
      ]
    );
  };

  const handleDeleteWarmup = (warmupId: string, warmupName: string) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir "${warmupName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteWarmup(workoutId, warmupId),
        },
      ]
    );
  };

  const handleDeleteStretch = (stretchId: string, stretchName: string) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir "${stretchName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteStretch(workoutId, stretchId),
        },
      ]
    );
  };

  const sortedExercises = [...workout.exercises].sort((a, b) => a.order - b.order);
  const sortedWarmups = [...workout.warmups].sort((a, b) => a.order - b.order);
  const sortedStretches = [...workout.stretches].sort((a, b) => a.order - b.order);

  /**
   * Move exercise up in the order
   * **Validates: Requirements 10.1, 10.2**
   */
  const handleMoveExerciseUp = (exerciseId: string) => {
    const currentIndex = sortedExercises.findIndex((ex) => ex.id === exerciseId);
    if (currentIndex <= 0) return; // Already at top

    const newOrder = sortedExercises.map((ex) => ex.id);
    // Swap with previous exercise
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
    reorderExercises(workoutId, newOrder);
  };

  /**
   * Move exercise down in the order
   * **Validates: Requirements 10.1, 10.2**
   */
  const handleMoveExerciseDown = (exerciseId: string) => {
    const currentIndex = sortedExercises.findIndex((ex) => ex.id === exerciseId);
    if (currentIndex < 0 || currentIndex >= sortedExercises.length - 1) return; // Already at bottom

    const newOrder = sortedExercises.map((ex) => ex.id);
    // Swap with next exercise
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    reorderExercises(workoutId, newOrder);
  };

  const renderWarmupItem = (warmup: WarmupActivity) => (
    <View key={warmup.id} style={styles.itemCard}>
      <View style={[styles.itemIndicator, { backgroundColor: COLORS.warmup }]} />
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{warmup.name}</Text>
        <Text style={styles.itemDetail}>{warmup.durationSeconds}s</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('WarmupForm', { workoutId, warmupId: warmup.id })}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteWarmup(warmup.id, warmup.name)}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const openLink = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    }
  };

  const renderExerciseItem = (exercise: Exercise, index: number, totalCount: number) => (
    <View key={exercise.id} style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseNumber}>
          <Text style={styles.exerciseNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseDetail}>
            {exercise.sets}x {exercise.reps} | {exercise.restSeconds}s | {exercise.loadKg}kg
          </Text>
          {exercise.executionLink && (
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => openLink(exercise.executionLink!)}
            >
              <Text style={styles.linkButtonText}>▶ Ver execução</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.exerciseActions}>
        {/* Reorder buttons - Validates: Requirements 10.1, 10.2 */}
        <View style={styles.reorderButtons}>
          <TouchableOpacity
            style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
            onPress={() => handleMoveExerciseUp(exercise.id)}
            disabled={index === 0}
            testID={`move-up-${exercise.id}`}
          >
            <Text style={[styles.reorderButtonText, index === 0 && styles.reorderButtonTextDisabled]}>▲</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reorderButton, index === totalCount - 1 && styles.reorderButtonDisabled]}
            onPress={() => handleMoveExerciseDown(exercise.id)}
            disabled={index === totalCount - 1}
            testID={`move-down-${exercise.id}`}
          >
            <Text style={[styles.reorderButtonText, index === totalCount - 1 && styles.reorderButtonTextDisabled]}>▼</Text>
          </TouchableOpacity>
        </View>
        {/* Edit and Delete buttons */}
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ExerciseForm', { workoutId, exerciseId: exercise.id })}
          >
            <Text style={styles.actionButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteExercise(exercise.id, exercise.name)}
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStretchItem = (stretch: StretchActivity) => (
    <View key={stretch.id} style={styles.itemCard}>
      <View style={[styles.itemIndicator, { backgroundColor: COLORS.stretch }]} />
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{stretch.name}</Text>
        <Text style={styles.itemDetail}>{stretch.durationSeconds}s - {stretch.targetMuscles}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('StretchForm', { workoutId, stretchId: stretch.id })}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteStretch(stretch.id, stretch.name)}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  const content = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.workoutName}>{workout.name}</Text>
        <Text style={styles.workoutDescription}>{workout.description}</Text>
      </View>

      {/* Warmup Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: COLORS.warmup }]}>🔥 Aquecimento</Text>
          <TouchableOpacity
            style={[styles.addSectionButton, { backgroundColor: COLORS.warmup }]}
            onPress={() => navigation.navigate('WarmupForm', { workoutId })}
          >
            <Text style={styles.addSectionButtonText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>
        {sortedWarmups.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum aquecimento cadastrado</Text>
        ) : (
          sortedWarmups.map(renderWarmupItem)
        )}
      </View>

      {/* Exercises Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>💪 Exercícios</Text>
        </View>
        {sortedExercises.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum exercício cadastrado</Text>
        ) : (
          sortedExercises.map((exercise, index) => renderExerciseItem(exercise, index, sortedExercises.length))
        )}
      </View>

      {/* Stretches Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: COLORS.stretch }]}>🧘 Alongamentos</Text>
          <TouchableOpacity
            style={[styles.addSectionButton, { backgroundColor: COLORS.stretch }]}
            onPress={() => navigation.navigate('StretchForm', { workoutId })}
          >
            <Text style={styles.addSectionButtonText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>
        {sortedStretches.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum alongamento cadastrado</Text>
        ) : (
          sortedStretches.map(renderStretchItem)
        )}
      </View>
    </>
  );

  // Use native div scroll on web for better performance
  if (Platform.OS === 'web') {
    return (
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.background,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ 
          flex: 1, 
          overflowY: 'scroll', 
          overflowX: 'hidden',
          padding: 16,
          paddingBottom: 100,
        }}>
          {content}
        </div>
        <div style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: COLORS.primary,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          zIndex: 1000,
        }}
          onClick={() => navigation.navigate('ExerciseForm', { workoutId })}
        >
          <span style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginTop: -2 }}>+</span>
        </div>
      </div>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        {content}
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ExerciseForm', { workoutId })}
        testID="add-exercise-fab"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' ? { 
      // @ts-ignore
      overflowY: 'scroll',
      // @ts-ignore
      WebkitOverflowScrolling: 'touch',
    } : {}),
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: SPACING.xxl,
  },
  workoutName: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  workoutDescription: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
  },
  addSectionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.xl,
    minHeight: TOUCH_TARGETS.small,
    justifyContent: 'center',
  },
  addSectionButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  itemIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: SPACING.md,
    minHeight: 40,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemDetail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
    minWidth: TOUCH_TARGETS.minimum,
    minHeight: TOUCH_TARGETS.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: FONT_SIZES.xl,
  },
  exerciseCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  exerciseNumberText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONT_SIZES.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  exerciseDetail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  linkButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reorderButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  reorderButton: {
    width: TOUCH_TARGETS.small,
    height: TOUCH_TARGETS.small,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reorderButtonDisabled: {
    opacity: 0.4,
  },
  reorderButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  reorderButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
    width: TOUCH_TARGETS.large,
    height: TOUCH_TARGETS.large,
    borderRadius: TOUCH_TARGETS.large / 2,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.xl,
  },
  fabText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    marginTop: -2,
  },
});

export default WorkoutScreen;

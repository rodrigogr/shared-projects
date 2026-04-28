/**
 * WorkoutScreen - Detalhe de um treino com aquecimentos, exercícios e
 * alongamentos. Permite reordenar exercícios e oferece, no header, atalhos
 * para editar ou excluir o próprio treino.
 */

import React, { useLayoutEffect, useMemo } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import {
  Exercise,
  StretchActivity,
  WarmupActivity,
} from '../types';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  SHADOWS,
  TOUCH_TARGETS,
  ThemePalette,
} from '../constants/theme';

interface WorkoutScreenProps {
  route: {
    params: {
      workoutId: string;
    };
  };
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    goBack: () => void;
    setOptions: (options: Record<string, unknown>) => void;
  };
}

export function WorkoutScreen({ route, navigation }: WorkoutScreenProps): React.ReactElement | null {
  const { workoutId } = route.params;
  const {
    workouts,
    deleteExercise,
    deleteWarmup,
    deleteStretch,
    reorderExercises,
    deleteWorkout,
  } = useWorkoutContext();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const workout = workouts[workoutId];
  const workoutCount = Object.keys(workouts).length;

  // Header actions (edit / delete the workout itself)
  useLayoutEffect(() => {
    if (!workout) return;
    navigation.setOptions({
      title: workout.name,
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('WorkoutExecution', { workoutId })
            }
            style={styles.headerButton}
            accessibilityLabel="Iniciar treino"
            testID="start-workout-header"
          >
            <Text style={styles.headerButtonText}>▶️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('WorkoutForm', { workoutId })}
            style={styles.headerButton}
            accessibilityLabel="Editar treino"
            testID="edit-workout-header"
          >
            <Text style={styles.headerButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (workoutCount <= 1) {
                Alert.alert(
                  'Não é possível excluir',
                  'Você precisa ter pelo menos 1 treino cadastrado.'
                );
                return;
              }
              Alert.alert(
                'Excluir treino',
                `Deseja excluir "${workout.name}"?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => {
                      deleteWorkout(workoutId);
                      navigation.goBack();
                    },
                  },
                ]
              );
            }}
            style={styles.headerButton}
            accessibilityLabel="Excluir treino"
            testID="delete-workout-header"
          >
            <Text style={styles.headerButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, workout, workoutId, workoutCount, deleteWorkout, styles]);

  if (!workout) {
    // Workout was deleted while this screen was mounted
    return null;
  }

  const sortedExercises = [...workout.exercises].sort((a, b) => a.order - b.order);
  const sortedWarmups = [...workout.warmups].sort((a, b) => a.order - b.order);
  const sortedStretches = [...workout.stretches].sort((a, b) => a.order - b.order);

  const confirmDelete = (label: string, name: string, onConfirm: () => void) =>
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: onConfirm },
      ]
    );

  const handleMoveExerciseUp = (exerciseId: string) => {
    const currentIndex = sortedExercises.findIndex((ex) => ex.id === exerciseId);
    if (currentIndex <= 0) return;
    const newOrder = sortedExercises.map((ex) => ex.id);
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [
      newOrder[currentIndex],
      newOrder[currentIndex - 1],
    ];
    reorderExercises(workoutId, newOrder);
  };

  const handleMoveExerciseDown = (exerciseId: string) => {
    const currentIndex = sortedExercises.findIndex((ex) => ex.id === exerciseId);
    if (currentIndex < 0 || currentIndex >= sortedExercises.length - 1) return;
    const newOrder = sortedExercises.map((ex) => ex.id);
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
      newOrder[currentIndex + 1],
      newOrder[currentIndex],
    ];
    reorderExercises(workoutId, newOrder);
  };

  const openLink = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    }
  };

  const renderWarmupItem = (warmup: WarmupActivity) => (
    <View key={warmup.id} style={styles.itemCard}>
      <View style={[styles.itemIndicator, { backgroundColor: colors.warmup }]} />
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{warmup.name}</Text>
        <Text style={styles.itemDetail}>{warmup.durationSeconds}s</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('WarmupForm', { workoutId, warmupId: warmup.id })
          }
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            confirmDelete('aquecimento', warmup.name, () =>
              deleteWarmup(workoutId, warmup.id)
            )
          }
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExerciseItem = (exercise: Exercise, index: number, total: number) => (
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
        <View style={styles.reorderButtons}>
          <TouchableOpacity
            style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
            onPress={() => handleMoveExerciseUp(exercise.id)}
            disabled={index === 0}
            testID={`move-up-${exercise.id}`}
          >
            <Text
              style={[
                styles.reorderButtonText,
                index === 0 && styles.reorderButtonTextDisabled,
              ]}
            >
              ▲
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.reorderButton,
              index === total - 1 && styles.reorderButtonDisabled,
            ]}
            onPress={() => handleMoveExerciseDown(exercise.id)}
            disabled={index === total - 1}
            testID={`move-down-${exercise.id}`}
          >
            <Text
              style={[
                styles.reorderButtonText,
                index === total - 1 && styles.reorderButtonTextDisabled,
              ]}
            >
              ▼
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('ExerciseForm', { workoutId, exerciseId: exercise.id })
            }
          >
            <Text style={styles.actionButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              confirmDelete('exercício', exercise.name, () =>
                deleteExercise(workoutId, exercise.id)
              )
            }
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStretchItem = (stretch: StretchActivity) => (
    <View key={stretch.id} style={styles.itemCard}>
      <View style={[styles.itemIndicator, { backgroundColor: colors.stretch }]} />
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{stretch.name}</Text>
        <Text style={styles.itemDetail}>
          {stretch.durationSeconds}s - {stretch.targetMuscles}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('StretchForm', { workoutId, stretchId: stretch.id })
          }
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            confirmDelete('alongamento', stretch.name, () =>
              deleteStretch(workoutId, stretch.id)
            )
          }
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.workoutName}>{workout.name}</Text>
        {!!workout.description && (
          <Text style={styles.workoutDescription}>{workout.description}</Text>
        )}
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('WorkoutExecution', { workoutId })}
          testID="start-workout-button"
        >
          <Text style={styles.startButtonText}>▶ Iniciar treino</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.warmup }]}>🔥 Aquecimento</Text>
          <TouchableOpacity
            style={[styles.addSectionButton, { backgroundColor: colors.warmup }]}
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

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            💪 Exercícios
          </Text>
        </View>
        {sortedExercises.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum exercício cadastrado</Text>
        ) : (
          sortedExercises.map((exercise, index) =>
            renderExerciseItem(exercise, index, sortedExercises.length)
          )
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.stretch }]}>
            🧘 Alongamentos
          </Text>
          <TouchableOpacity
            style={[styles.addSectionButton, { backgroundColor: colors.stretch }]}
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

  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.background,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'scroll',
            overflowX: 'hidden',
            padding: 16,
            paddingBottom: 100,
          }}
        >
          {content}
        </div>
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            zIndex: 1000,
          }}
          onClick={() => navigation.navigate('ExerciseForm', { workoutId })}
        >
          <span style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginTop: -2 }}>
            +
          </span>
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

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
      ...(Platform.OS === 'web'
        ? ({
            // @ts-ignore
            overflowY: 'scroll',
            // @ts-ignore
            WebkitOverflowScrolling: 'touch',
          } as object)
        : {}),
    },
    scrollContent: {
      padding: SPACING.lg,
      paddingBottom: 100,
    },
    headerActions: {
      flexDirection: 'row',
      marginRight: SPACING.sm,
    },
    headerButton: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
    },
    headerButtonText: {
      fontSize: FONT_SIZES.xl,
    },
    header: {
      marginBottom: SPACING.xxl,
    },
    workoutName: {
      fontSize: FONT_SIZES.title,
      fontWeight: 'bold',
      color: colors.text,
    },
    workoutDescription: {
      fontSize: FONT_SIZES.lg,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
    startButton: {
      marginTop: SPACING.lg,
      paddingVertical: SPACING.md + 2,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: TOUCH_TARGETS.minimum,
      ...SHADOWS.md,
    },
    startButtonText: {
      color: colors.textOnPrimary,
      fontSize: FONT_SIZES.lg,
      fontWeight: 'bold',
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
      color: '#FFFFFF',
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
    },
    emptyText: {
      color: colors.textMuted,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: SPACING.lg,
    },
    itemCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
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
      color: colors.text,
    },
    itemDetail: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemActions: {
      flexDirection: 'row',
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
      backgroundColor: colors.surface,
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
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.md,
    },
    exerciseNumberText: {
      color: colors.textOnPrimary,
      fontWeight: 'bold',
      fontSize: FONT_SIZES.md,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
      color: colors.text,
    },
    exerciseDetail: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginTop: 2,
    },
    linkButton: {
      marginTop: SPACING.sm,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      backgroundColor: colors.secondary,
      borderRadius: BORDER_RADIUS.md,
      alignSelf: 'flex-start',
    },
    linkButtonText: {
      color: '#FFFFFF',
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
      borderTopColor: colors.border,
    },
    reorderButtons: {
      flexDirection: 'row',
    },
    reorderButton: {
      width: TOUCH_TARGETS.small,
      height: TOUCH_TARGETS.small,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: SPACING.xs,
    },
    reorderButtonDisabled: {
      opacity: 0.4,
    },
    reorderButtonText: {
      fontSize: FONT_SIZES.md,
      color: colors.primary,
      fontWeight: 'bold',
    },
    reorderButtonTextDisabled: {
      color: colors.textMuted,
    },
    fab: {
      position: 'absolute',
      right: SPACING.xl,
      bottom: SPACING.xl,
      width: TOUCH_TARGETS.large,
      height: TOUCH_TARGETS.large,
      borderRadius: TOUCH_TARGETS.large / 2,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...SHADOWS.xl,
    },
    fabText: {
      color: colors.textOnPrimary,
      fontSize: FONT_SIZES.title,
      fontWeight: 'bold',
      marginTop: -2,
    },
  });
}

export default WorkoutScreen;

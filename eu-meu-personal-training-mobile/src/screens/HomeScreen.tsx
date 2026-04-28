/**
 * HomeScreen - Lista dinâmica de treinos personalizáveis. O usuário pode
 * criar quantos treinos quiser (A, B, C, D, E...), editar/excluir cada um e
 * alternar entre os modos light / dark / sistema.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutContext } from '../context/WorkoutContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { Workout } from '../types';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  pickPaletteColor,
  ThemePalette,
} from '../constants/theme';

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

const THEME_LABEL: Record<ThemeMode, string> = {
  light: '☀️ Claro',
  dark: '🌙 Escuro',
  system: '🖥️ Sistema',
};

export function HomeScreen({ navigation }: HomeScreenProps): React.ReactElement {
  const { workouts, isLoading, deleteWorkout } = useWorkoutContext();
  const { colors, mode, toggle } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando treinos...</Text>
      </SafeAreaView>
    );
  }

  // Stable order by id (A, B, C, D, ...).
  const sortedWorkouts: Workout[] = Object.values(workouts).sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  const handleWorkoutPress = (id: string) =>
    navigation.navigate('Workout', { workoutId: id });
  const handleEdit = (id: string) =>
    navigation.navigate('WorkoutForm', { workoutId: id });
  const handleNew = () => navigation.navigate('WorkoutForm', {});

  const handleDelete = (workout: Workout) => {
    if (sortedWorkouts.length <= 1) {
      Alert.alert(
        'Não é possível excluir',
        'Você precisa ter pelo menos 1 treino cadastrado.'
      );
      return;
    }
    Alert.alert(
      'Excluir treino',
      `Deseja excluir "${workout.name}"? Todos os exercícios, aquecimentos e alongamentos deste treino serão removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteWorkout(workout.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>💪 Meus Treinos</Text>
          <Text style={styles.subtitle}>Toque em um treino para começar</Text>
        </View>
        <TouchableOpacity
          style={styles.themeButton}
          onPress={toggle}
          accessibilityLabel="Alternar tema"
          testID="theme-toggle"
        >
          <Text style={styles.themeButtonText}>{THEME_LABEL[mode]}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {sortedWorkouts.map((workout) => {
            const cardColor =
              workout.color ?? pickPaletteColor(workout.id, colors.cardPalette);
            return (
              <TouchableOpacity
                key={workout.id}
                style={[styles.card, { backgroundColor: cardColor }]}
                onPress={() => handleWorkoutPress(workout.id)}
                onLongPress={() => handleEdit(workout.id)}
                activeOpacity={0.85}
                testID={`workout-card-${workout.id}`}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLetter}>{workout.id}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardAction}
                      onPress={() => handleEdit(workout.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      testID={`edit-workout-${workout.id}`}
                    >
                      <Text style={styles.cardActionText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardAction}
                      onPress={() => handleDelete(workout)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      testID={`delete-workout-${workout.id}`}
                    >
                      <Text style={styles.cardActionText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.cardName} numberOfLines={1}>
                  {workout.name}
                </Text>
                {!!workout.description && (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {workout.description}
                  </Text>
                )}
                <View style={styles.cardStatsRow}>
                  <View style={styles.cardStats}>
                    <Text style={styles.cardStatText}>
                      💪 {workout.exercises.length} exercícios
                    </Text>
                  </View>
                  {workout.warmups.length > 0 && (
                    <View style={styles.cardStats}>
                      <Text style={styles.cardStatText}>
                        🔥 {workout.warmups.length}
                      </Text>
                    </View>
                  )}
                  {workout.stretches.length > 0 && (
                    <View style={styles.cardStats}>
                      <Text style={styles.cardStatText}>
                        🧘 {workout.stretches.length}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.addCard}
            onPress={handleNew}
            activeOpacity={0.7}
            testID="add-workout-card"
          >
            <Text style={styles.addCardIcon}>＋</Text>
            <Text style={styles.addCardText}>Novo treino</Text>
          </TouchableOpacity>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('History')}
              testID="open-history"
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Histórico</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Backup')}
              testID="open-backup"
            >
              <Text style={styles.quickActionIcon}>💾</Text>
              <Text style={styles.quickActionText}>Backup</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Desenvolvido por Rodrigo Gonçalves Rebelo
          </Text>
          <Text style={styles.footerCopyright}>Copyright © 2025</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xxxl,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: SPACING.md,
      fontSize: FONT_SIZES.lg,
      color: colors.text,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
    },
    title: {
      fontSize: FONT_SIZES.title,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
    themeButton: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeButtonText: {
      fontSize: FONT_SIZES.sm,
      color: colors.text,
      fontWeight: '600',
    },
    list: {
      marginTop: SPACING.md,
    },
    card: {
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      minHeight: 130,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.sm,
    },
    cardLetter: {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: 'bold',
      color: 'rgba(255, 255, 255, 0.35)',
    },
    cardActions: {
      flexDirection: 'row',
    },
    cardAction: {
      padding: SPACING.xs,
      marginLeft: SPACING.xs,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    cardActionText: {
      fontSize: FONT_SIZES.lg,
    },
    cardName: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: SPACING.xs,
    },
    cardDescription: {
      fontSize: FONT_SIZES.md,
      color: 'rgba(255, 255, 255, 0.92)',
      marginBottom: SPACING.md,
      lineHeight: 20,
    },
    cardStatsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cardStats: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.xs + 2,
      paddingHorizontal: SPACING.sm + 2,
      marginRight: SPACING.sm,
      marginTop: SPACING.xs,
    },
    cardStatText: {
      fontSize: FONT_SIZES.sm,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    addCard: {
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
      minHeight: 100,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.lg,
    },
    addCardIcon: {
      fontSize: 36,
      color: colors.primary,
      lineHeight: 40,
    },
    addCardText: {
      marginTop: SPACING.xs,
      fontSize: FONT_SIZES.lg,
      color: colors.primary,
      fontWeight: '600',
    },
    quickActionsRow: {
      flexDirection: 'row',
      marginTop: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    quickAction: {
      flex: 1,
      paddingVertical: SPACING.md,
      marginHorizontal: SPACING.xs,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionIcon: {
      fontSize: FONT_SIZES.xxl,
      marginBottom: SPACING.xs,
    },
    quickActionText: {
      fontSize: FONT_SIZES.md,
      color: colors.text,
      fontWeight: '600',
    },
    footer: {
      marginTop: SPACING.xl,
      paddingTop: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      alignItems: 'center',
    },
    footerText: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    footerCopyright: {
      fontSize: FONT_SIZES.xs,
      color: colors.textMuted,
      marginTop: SPACING.xs,
    },
  });
}

export default HomeScreen;

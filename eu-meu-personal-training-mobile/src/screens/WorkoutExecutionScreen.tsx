/**
 * WorkoutExecutionScreen - Modo execução guiada do treino.
 *
 * Caminha sequencialmente pelos blocos do treino:
 *   warmups -> exercícios -> alongamentos -> done
 *
 * Para warmups e alongamentos: exibe um cronômetro de contagem regressiva
 * baseado em `durationSeconds` com controles de play/pause/skip/+15s.
 *
 * Para exercícios: mostra séries x reps x carga; o usuário marca cada série
 * concluída via botão "Concluir série", o que dispara automaticamente um
 * cronômetro de descanso (`restSeconds`). Ao terminar todas as séries,
 * avança para o próximo exercício.
 *
 * Estado é mantido apenas em memória — sair da tela cancela a sessão.
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useWorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import {
  BORDER_RADIUS,
  FONT_SIZES,
  SHADOWS,
  SPACING,
  TOUCH_TARGETS,
  ThemePalette,
} from '../constants/theme';

interface WorkoutExecutionScreenProps {
  route: {
    params: {
      workoutId: string;
    };
  };
  navigation: {
    goBack: () => void;
    setOptions: (options: Record<string, unknown>) => void;
  };
}

type Phase = 'warmup' | 'exercise' | 'stretch' | 'done';

interface PhaseInfo {
  phase: Phase;
  index: number;
  total: number;
}

function formatSeconds(total: number): string {
  const safe = Math.max(0, Math.floor(total));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function WorkoutExecutionScreen({
  route,
  navigation,
}: WorkoutExecutionScreenProps): React.ReactElement | null {
  const { workoutId } = route.params;
  const { workouts, addSession } = useWorkoutContext();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const workout = workouts[workoutId];

  // Wall-clock timestamp when the user opened this screen
  const startedAtRef = useRef<string>(new Date().toISOString());
  const sessionPersistedRef = useRef(false);

  // Sorted lists. Memoized so timer effect doesn't re-trigger on every render.
  const warmups = useMemo(
    () => (workout ? [...workout.warmups].sort((a, b) => a.order - b.order) : []),
    [workout]
  );
  const exercises = useMemo(
    () => (workout ? [...workout.exercises].sort((a, b) => a.order - b.order) : []),
    [workout]
  );
  const stretches = useMemo(
    () => (workout ? [...workout.stretches].sort((a, b) => a.order - b.order) : []),
    [workout]
  );

  // Compute first non-empty phase so we don't get stuck on an empty section.
  const initialPhase = useCallback((): PhaseInfo => {
    if (warmups.length > 0) return { phase: 'warmup', index: 0, total: warmups.length };
    if (exercises.length > 0)
      return { phase: 'exercise', index: 0, total: exercises.length };
    if (stretches.length > 0)
      return { phase: 'stretch', index: 0, total: stretches.length };
    return { phase: 'done', index: 0, total: 0 };
  }, [warmups.length, exercises.length, stretches.length]);

  const [current, setCurrent] = useState<PhaseInfo>(initialPhase);
  // Sets completed for the current exercise.
  const [setsDone, setSetsDone] = useState(0);
  // Countdown state. `mode` differentiates a "duration" timer (warmup/stretch)
  // from a "rest" timer (between exercise sets).
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'idle' | 'duration' | 'rest'>('idle');

  // Track number of exercises actually completed (for the final summary).
  const completedRef = useRef({ warmups: 0, exercises: 0, stretches: 0, sets: 0 });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: workout ? `▶ ${workout.name}` : 'Treino',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => confirmExit()}
          style={styles.headerCancel}
          accessibilityLabel="Cancelar treino"
        >
          <Text style={styles.headerCancelText}>✕</Text>
        </TouchableOpacity>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, workout, styles]);

  // Whenever the active item changes, prepare the timer.
  useEffect(() => {
    if (current.phase === 'warmup') {
      const item = warmups[current.index];
      setTimerSeconds(item?.durationSeconds ?? 0);
      setTimerMode('duration');
      setTimerRunning(false);
      setSetsDone(0);
    } else if (current.phase === 'stretch') {
      const item = stretches[current.index];
      setTimerSeconds(item?.durationSeconds ?? 0);
      setTimerMode('duration');
      setTimerRunning(false);
      setSetsDone(0);
    } else if (current.phase === 'exercise') {
      setTimerMode('idle');
      setTimerSeconds(0);
      setTimerRunning(false);
      setSetsDone(0);
    } else {
      setTimerMode('idle');
      setTimerRunning(false);
    }
  }, [current, warmups, stretches]);

  // Tick.
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimerSeconds((s) => {
        if (s <= 1) {
          // Stop and signal completion on the next render via a side flag.
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // Handle reaching 0.
  useEffect(() => {
    if (timerRunning && timerSeconds === 0) {
      setTimerRunning(false);
      // Duration timers (warmup/stretch) auto-advance; rest timers just stop.
      if (timerMode === 'duration') {
        handleAdvance();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSeconds, timerRunning]);

  // Persist the session exactly once when we transition into the 'done' phase.
  useEffect(() => {
    if (current.phase !== 'done' || sessionPersistedRef.current || !workout) return;
    sessionPersistedRef.current = true;
    const now = new Date();
    const startedAt = startedAtRef.current;
    const durationSeconds = Math.max(
      0,
      Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000)
    );
    const c = completedRef.current;
    addSession({
      id: `s-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      workoutId,
      workoutName: workout.name,
      startedAt,
      completedAt: now.toISOString(),
      durationSeconds,
      warmupsCompleted: c.warmups,
      exercisesCompleted: c.exercises,
      setsCompleted: c.sets,
      stretchesCompleted: c.stretches,
    });
  }, [current.phase, workout, workoutId, addSession]);

  const confirmExit = useCallback(() => {
    if (current.phase === 'done') {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Sair do treino?',
      'Você perderá o progresso desta sessão.',
      [
        { text: 'Continuar treinando', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }, [current.phase, navigation]);

  const handleAdvance = useCallback(() => {
    setCurrent((cur) => {
      // Track completion counts before moving on.
      if (cur.phase === 'warmup') completedRef.current.warmups += 1;
      if (cur.phase === 'stretch') completedRef.current.stretches += 1;

      if (cur.phase === 'warmup') {
        if (cur.index + 1 < warmups.length) {
          return { phase: 'warmup', index: cur.index + 1, total: warmups.length };
        }
        if (exercises.length > 0)
          return { phase: 'exercise', index: 0, total: exercises.length };
        if (stretches.length > 0)
          return { phase: 'stretch', index: 0, total: stretches.length };
        return { phase: 'done', index: 0, total: 0 };
      }
      if (cur.phase === 'exercise') {
        completedRef.current.exercises += 1;
        if (cur.index + 1 < exercises.length) {
          return { phase: 'exercise', index: cur.index + 1, total: exercises.length };
        }
        if (stretches.length > 0)
          return { phase: 'stretch', index: 0, total: stretches.length };
        return { phase: 'done', index: 0, total: 0 };
      }
      if (cur.phase === 'stretch') {
        if (cur.index + 1 < stretches.length) {
          return { phase: 'stretch', index: cur.index + 1, total: stretches.length };
        }
        return { phase: 'done', index: 0, total: 0 };
      }
      return cur;
    });
  }, [warmups.length, exercises.length, stretches.length]);

  const handleCompleteSet = useCallback(() => {
    if (current.phase !== 'exercise') return;
    const exercise = exercises[current.index];
    if (!exercise) return;
    const newDone = setsDone + 1;
    completedRef.current.sets += 1;
    if (newDone >= exercise.sets) {
      // All sets done → advance immediately.
      handleAdvance();
      return;
    }
    setSetsDone(newDone);
    // Start rest timer.
    setTimerMode('rest');
    setTimerSeconds(exercise.restSeconds);
    setTimerRunning(true);
  }, [current, exercises, setsDone, handleAdvance]);

  // Total progress across all items for the top bar.
  const { progressDone, progressTotal } = useMemo(() => {
    const total = warmups.length + exercises.length + stretches.length;
    let done = 0;
    if (current.phase === 'warmup') done = current.index;
    else if (current.phase === 'exercise')
      done = warmups.length + current.index;
    else if (current.phase === 'stretch')
      done = warmups.length + exercises.length + current.index;
    else done = total;
    return { progressDone: done, progressTotal: total };
  }, [current, warmups.length, exercises.length, stretches.length]);

  if (!workout) {
    return null;
  }

  if (progressTotal === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerEmpty}>
          <Text style={styles.emptyTitle}>Treino vazio</Text>
          <Text style={styles.emptyText}>
            Adicione exercícios, aquecimentos ou alongamentos antes de iniciar.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progressPct =
    progressTotal === 0 ? 0 : Math.min(100, Math.round((progressDone / progressTotal) * 100));

  const renderHeader = () => (
    <View style={styles.progressHeader}>
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {progressDone} de {progressTotal} concluídos
      </Text>
    </View>
  );

  const renderTimer = (accent: string) => (
    <View style={styles.timerCard}>
      <Text style={[styles.timerLabel, { color: accent }]}>
        {timerMode === 'rest' ? 'Descanso' : 'Tempo'}
      </Text>
      <Text style={[styles.timerValue, { color: accent }]}>
        {formatSeconds(timerSeconds)}
      </Text>
      <View style={styles.timerControls}>
        <TouchableOpacity
          style={[styles.timerButton, { backgroundColor: colors.surfaceAlt }]}
          onPress={() => setTimerSeconds((s) => s + 15)}
        >
          <Text style={styles.timerButtonText}>+15s</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timerButton,
            { backgroundColor: timerRunning ? colors.warmup : accent },
          ]}
          onPress={() => setTimerRunning((r) => !r)}
        >
          <Text style={[styles.timerButtonText, { color: colors.textOnPrimary }]}>
            {timerRunning ? '⏸ Pausar' : '▶ Iniciar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timerButton, { backgroundColor: colors.surfaceAlt }]}
          onPress={() => {
            setTimerRunning(false);
            if (timerMode === 'rest') {
              setTimerSeconds(0);
            } else {
              handleAdvance();
            }
          }}
        >
          <Text style={styles.timerButtonText}>
            {timerMode === 'rest' ? 'Pular' : '⏭ Próximo'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWarmup = () => {
    const item = warmups[current.index];
    return (
      <View style={styles.itemSection}>
        <Text style={[styles.phaseLabel, { color: colors.warmup }]}>
          🔥 Aquecimento {current.index + 1} / {current.total}
        </Text>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemMeta}>{item.durationSeconds}s</Text>
        {renderTimer(colors.warmup)}
      </View>
    );
  };

  const renderStretch = () => {
    const item = stretches[current.index];
    return (
      <View style={styles.itemSection}>
        <Text style={[styles.phaseLabel, { color: colors.stretch }]}>
          🧘 Alongamento {current.index + 1} / {current.total}
        </Text>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          {item.durationSeconds}s — {item.targetMuscles}
        </Text>
        {renderTimer(colors.stretch)}
      </View>
    );
  };

  const renderExercise = () => {
    const item = exercises[current.index];
    const restingNow = timerMode === 'rest' && (timerRunning || timerSeconds > 0);
    return (
      <View style={styles.itemSection}>
        <Text style={[styles.phaseLabel, { color: colors.primary }]}>
          💪 Exercício {current.index + 1} / {current.total}
        </Text>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          {item.sets}x {item.reps} • {item.loadKg}kg • descanso {item.restSeconds}s
        </Text>
        {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}

        <View style={styles.setsRow}>
          {Array.from({ length: item.sets }).map((_, i) => {
            const done = i < setsDone;
            return (
              <View
                key={i}
                style={[
                  styles.setDot,
                  {
                    backgroundColor: done ? colors.primary : colors.surfaceAlt,
                    borderColor: done ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.setDotText,
                    { color: done ? colors.textOnPrimary : colors.textSecondary },
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.setsCounter}>
          {setsDone} / {item.sets} séries concluídas
        </Text>

        {restingNow && renderTimer(colors.primary)}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleCompleteSet}
          testID="complete-set-button"
        >
          <Text style={styles.primaryButtonText}>
            ✓ Concluir série {setsDone + 1}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => {
            Alert.alert(
              'Pular exercício',
              'Avançar para o próximo sem concluir as séries restantes?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Pular', style: 'destructive', onPress: handleAdvance },
              ]
            );
          }}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
            Pular exercício
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDone = () => {
    const c = completedRef.current;
    return (
      <View style={styles.itemSection}>
        <Text style={[styles.phaseLabel, { color: colors.success ?? colors.primary }]}>
          🎉 Treino concluído!
        </Text>
        <Text style={styles.itemTitle}>Bom trabalho.</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{c.warmups}</Text>
            <Text style={styles.summaryLabel}>Aquecimentos</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{c.exercises}</Text>
            <Text style={styles.summaryLabel}>Exercícios</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{c.sets}</Text>
            <Text style={styles.summaryLabel}>Séries</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{c.stretches}</Text>
            <Text style={styles.summaryLabel}>Alongamentos</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>Voltar ao treino</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        {...(Platform.OS === 'web' ? { showsVerticalScrollIndicator: true } : {})}
      >
        {renderHeader()}
        {current.phase === 'warmup' && renderWarmup()}
        {current.phase === 'exercise' && renderExercise()}
        {current.phase === 'stretch' && renderStretch()}
        {current.phase === 'done' && renderDone()}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: SPACING.lg,
      paddingBottom: SPACING.xxxl,
    },
    headerCancel: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
    },
    headerCancelText: {
      color: colors.textOnPrimary,
      fontSize: FONT_SIZES.xl,
      fontWeight: 'bold',
    },
    progressHeader: {
      marginBottom: SPACING.xl,
    },
    progressBarTrack: {
      height: 8,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    progressText: {
      marginTop: SPACING.xs,
      color: colors.textSecondary,
      fontSize: FONT_SIZES.sm,
      textAlign: 'center',
    },
    itemSection: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...SHADOWS.md,
    },
    phaseLabel: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      marginBottom: SPACING.sm,
    },
    itemTitle: {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    itemMeta: {
      fontSize: FONT_SIZES.lg,
      color: colors.textSecondary,
      marginBottom: SPACING.md,
    },
    itemNotes: {
      fontSize: FONT_SIZES.md,
      color: colors.textMuted,
      fontStyle: 'italic',
      marginBottom: SPACING.md,
    },
    timerCard: {
      marginTop: SPACING.lg,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
    },
    timerLabel: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      marginBottom: SPACING.xs,
    },
    timerValue: {
      fontSize: 56,
      fontWeight: 'bold',
      fontVariant: ['tabular-nums'],
      marginBottom: SPACING.md,
    },
    timerControls: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    timerButton: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderRadius: BORDER_RADIUS.md,
      marginHorizontal: SPACING.xs,
      marginVertical: SPACING.xs,
      minHeight: TOUCH_TARGETS.minimum,
      justifyContent: 'center',
      alignItems: 'center',
    },
    timerButtonText: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      color: colors.text,
    },
    setsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginVertical: SPACING.md,
    },
    setDot: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    setDotText: {
      fontSize: FONT_SIZES.md,
      fontWeight: 'bold',
    },
    setsCounter: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginBottom: SPACING.md,
    },
    primaryButton: {
      paddingVertical: SPACING.md + 2,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: TOUCH_TARGETS.minimum,
      marginTop: SPACING.md,
    },
    primaryButtonText: {
      color: colors.textOnPrimary,
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
    },
    secondaryButton: {
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: TOUCH_TARGETS.minimum,
      marginTop: SPACING.sm,
    },
    secondaryButtonText: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
    centerEmpty: {
      flex: 1,
      justifyContent: 'center',
      padding: SPACING.xxl,
    },
    emptyTitle: {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: SPACING.md,
    },
    emptyText: {
      fontSize: FONT_SIZES.lg,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: SPACING.xl,
    },
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginVertical: SPACING.lg,
    },
    summaryItem: {
      width: '48%',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      backgroundColor: colors.surfaceAlt,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.sm,
    },
    summaryNumber: {
      fontSize: FONT_SIZES.title,
      fontWeight: 'bold',
      color: colors.primary,
    },
    summaryLabel: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
  });
}

export default WorkoutExecutionScreen;

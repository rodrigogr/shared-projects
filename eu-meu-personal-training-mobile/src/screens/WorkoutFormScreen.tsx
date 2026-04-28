/**
 * WorkoutFormScreen - Create or edit a custom workout (the workout itself,
 * not its exercises). Lets the user pick a name, description and color and
 * fully replaces the previous fixed A/B/C/D structure.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { Workout, WorkoutFormScreenNavigationProp, WorkoutFormScreenRouteProp } from '../types';
import { SPACING, BORDER_RADIUS, FONT_SIZES, TOUCH_TARGETS } from '../constants/theme';

interface WorkoutFormScreenProps {
  route: WorkoutFormScreenRouteProp;
  navigation: WorkoutFormScreenNavigationProp;
}

function generateWorkoutId(existingIds: string[]): string {
  // Prefer next single-letter slot (A, B, C, D, E, ...). Fall back to a
  // timestamp-based id once we run out of letters.
  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code);
    if (!existingIds.includes(letter)) return letter;
  }
  return 'W-' + Date.now().toString(36);
}

export function WorkoutFormScreen({ route, navigation }: WorkoutFormScreenProps): React.ReactElement {
  const { colors } = useTheme();
  const { workouts, addWorkout, updateWorkout } = useWorkoutContext();

  const editingId = route.params?.workoutId;
  const existing = editingId ? workouts[editingId] : undefined;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [color, setColor] = useState<string>(
    existing?.color ?? colors.cardPalette[0]
  );
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setError('Nome do treino é obrigatório');
      return;
    }

    if (isEditing && existing) {
      updateWorkout(existing.id, {
        name: trimmedName,
        description: description.trim(),
        color,
      });
      navigation.goBack();
      return;
    }

    const newId = generateWorkoutId(Object.keys(workouts));
    const now = new Date().toISOString();
    const workout: Workout = {
      id: newId,
      name: trimmedName,
      description: description.trim(),
      color,
      warmups: [],
      exercises: [],
      stretches: [],
      updatedAt: now,
    };
    addWorkout(workout);
    navigation.goBack();
  };

  const handleCancel = () => navigation.goBack();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          {isEditing ? 'Editar Treino' : 'Novo Treino'}
        </Text>
        <Text style={styles.subtitle}>
          Personalize o nome, descrição e cor do treino. Você pode ter quantos treinos quiser.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="Ex.: Treino A, Push, Pernas..."
            placeholderTextColor={colors.placeholder}
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (error) setError(null);
            }}
            maxLength={40}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Ex.: Peito + Ombros (ant. e lat.)"
            placeholderTextColor={colors.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            maxLength={120}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Cor</Text>
          <View style={styles.colorRow}>
            {colors.cardPalette.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  color === c && styles.colorSwatchSelected,
                ]}
                onPress={() => setColor(c)}
                accessibilityRole="button"
                accessibilityLabel={`Cor ${c}`}
                testID={`color-${c}`}
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleCancel}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
              Cancelar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSave}
            testID="save-workout-button"
          >
            <Text style={styles.buttonText}>
              {isEditing ? 'Salvar' : 'Criar treino'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: SPACING.lg,
      paddingBottom: SPACING.xxxl,
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
      marginBottom: SPACING.xl,
    },
    field: {
      marginBottom: SPACING.lg,
    },
    label: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      fontSize: FONT_SIZES.lg,
      color: colors.text,
      minHeight: TOUCH_TARGETS.minimum,
    },
    multiline: {
      textAlignVertical: 'top',
      minHeight: 80,
    },
    inputError: {
      borderColor: colors.danger,
    },
    errorText: {
      color: colors.danger,
      fontSize: FONT_SIZES.sm,
      marginTop: SPACING.xs,
    },
    colorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.md as unknown as number,
    },
    colorSwatch: {
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.round,
      marginRight: SPACING.md,
      marginBottom: SPACING.md,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorSwatchSelected: {
      borderColor: colors.text,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: SPACING.xl,
      gap: SPACING.md as unknown as number,
    },
    button: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: TOUCH_TARGETS.large,
      marginHorizontal: SPACING.xs,
    },
    buttonPrimary: {
      backgroundColor: colors.primary,
    },
    buttonSecondary: {
      backgroundColor: colors.surfaceAlt,
    },
    buttonText: {
      color: colors.textOnPrimary,
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
    },
    buttonSecondaryText: {
      color: colors.text,
    },
  });
}

export default WorkoutFormScreen;

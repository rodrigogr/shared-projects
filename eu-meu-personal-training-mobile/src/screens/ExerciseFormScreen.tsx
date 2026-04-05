/**
 * ExerciseFormScreen - Form for creating and editing exercises
 * **Validates: Requirements 2.1, 3.1, 8.1, 8.2, 8.3**
 */

import React, { useState } from 'react';
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
import { WorkoutCategory, Exercise } from '../types';
import { validateExerciseName, validateLoad, validateReps } from '../utils/validators';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, TOUCH_TARGETS } from '../constants/theme';

interface ExerciseFormScreenProps {
  route: {
    params: {
      workoutId: WorkoutCategory;
      exerciseId?: string;
    };
  };
  navigation: {
    goBack: () => void;
  };
}

/**
 * Generates a simple UUID for new exercises
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * ExerciseFormScreen component
 * Form with all exercise fields, pre-fills when editing
 * Validates inputs before saving
 */
export function ExerciseFormScreen({ route, navigation }: ExerciseFormScreenProps): React.ReactElement {
  const { workoutId, exerciseId } = route.params;
  const { workouts, addExercise, updateExercise } = useWorkoutContext();
  const workout = workouts[workoutId];
  const existingExercise = exerciseId 
    ? workout.exercises.find(e => e.id === exerciseId) 
    : undefined;
  const isEditing = !!existingExercise;


  // Form state
  const [name, setName] = useState(existingExercise?.name || '');
  const [executionLink, setExecutionLink] = useState(existingExercise?.executionLink || '');
  const [sets, setSets] = useState(existingExercise?.sets?.toString() || '4');
  const [reps, setReps] = useState(existingExercise?.reps || '8-12');
  const [restSeconds, setRestSeconds] = useState(existingExercise?.restSeconds?.toString() || '90');
  const [loadKg, setLoadKg] = useState(existingExercise?.loadKg?.toString() || '0');
  const [notes, setNotes] = useState(existingExercise?.notes || '');

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    const nameValidation = validateExerciseName(name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error || 'Nome inválido';
    }

    // Validate load
    const loadValue = parseFloat(loadKg);
    const loadValidation = validateLoad(isNaN(loadValue) ? -1 : loadValue);
    if (!loadValidation.isValid) {
      newErrors.loadKg = loadValidation.error || 'Carga inválida';
    }

    // Validate reps
    const repsValidation = validateReps(reps);
    if (!repsValidation.isValid) {
      newErrors.reps = repsValidation.error || 'Repetições inválidas';
    }

    // Validate sets
    const setsValue = parseInt(sets, 10);
    if (isNaN(setsValue) || setsValue <= 0) {
      newErrors.sets = 'Séries deve ser um número positivo';
    }

    // Validate rest
    const restValue = parseInt(restSeconds, 10);
    if (isNaN(restValue) || restValue < 0) {
      newErrors.restSeconds = 'Descanso deve ser um número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const exerciseData: Exercise = {
      id: existingExercise?.id || generateId(),
      name: name.trim(),
      mediaUri: undefined,
      executionLink: executionLink.trim() || undefined,
      sets: parseInt(sets, 10),
      reps: reps.trim(),
      restSeconds: parseInt(restSeconds, 10),
      loadKg: parseFloat(loadKg),
      notes: notes.trim() || undefined,
      order: existingExercise?.order ?? workout.exercises.length,
    };

    if (isEditing) {
      updateExercise(workoutId, exerciseData.id, exerciseData);
    } else {
      const success = addExercise(workoutId, exerciseData);
      if (!success) {
        Alert.alert('Erro', 'Não foi possível adicionar o exercício');
        return;
      }
    }

    navigation.goBack();
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options: {
      placeholder?: string;
      keyboardType?: 'default' | 'numeric' | 'url';
      multiline?: boolean;
      error?: string;
    } = {}
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          options.multiline && styles.multilineInput,
          options.error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={options.placeholder}
        placeholderTextColor={COLORS.placeholder}
        keyboardType={options.keyboardType || 'default'}
        multiline={options.multiline}
        numberOfLines={options.multiline ? 3 : 1}
      />
      {options.error && <Text style={styles.errorText}>{options.error}</Text>}
    </View>
  );


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          {isEditing ? 'Editar Exercício' : 'Novo Exercício'}
        </Text>

        {renderInput('Nome do Exercício *', name, setName, {
          placeholder: 'Ex: Supino Reto',
          error: errors.name,
        })}

        {renderInput('Link de Execução (YouTube, etc)', executionLink, setExecutionLink, {
          placeholder: 'https://youtube.com/...',
          keyboardType: 'url',
        })}

        <View style={styles.row}>
          <View style={styles.halfInput}>
            {renderInput('Séries *', sets, setSets, {
              placeholder: '4',
              keyboardType: 'numeric',
              error: errors.sets,
            })}
          </View>
          <View style={styles.halfInput}>
            {renderInput('Repetições *', reps, setReps, {
              placeholder: '8-12',
              error: errors.reps,
            })}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            {renderInput('Descanso (s) *', restSeconds, setRestSeconds, {
              placeholder: '90',
              keyboardType: 'numeric',
              error: errors.restSeconds,
            })}
          </View>
          <View style={styles.halfInput}>
            {renderInput('Carga (kg) *', loadKg, setLoadKg, {
              placeholder: '30',
              keyboardType: 'numeric',
              error: errors.loadKg,
            })}
          </View>
        </View>

        {/* Observações com textarea que cresce */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas adicionais..."
            placeholderTextColor={COLORS.textMuted}
            multiline={true}
            textAlignVertical="top"
            onContentSizeChange={(e) => {
              // Auto-grow textarea
            }}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            testID="save-exercise-button"
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Salvar Alterações' : 'Adicionar Exercício'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xxl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs + 2,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    minHeight: TOUCH_TARGETS.minimum,
  },
  multilineInput: {
    minHeight: 80,
    maxHeight: 200,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxxl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
    minHeight: TOUCH_TARGETS.minimum,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    paddingVertical: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    minHeight: TOUCH_TARGETS.minimum,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
});

export default ExerciseFormScreen;

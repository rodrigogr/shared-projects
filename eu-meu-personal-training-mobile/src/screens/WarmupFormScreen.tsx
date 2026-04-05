/**
 * WarmupFormScreen - Form for creating and editing warmup activities
 * **Validates: Requirements 4.2, 4.3, 8.1, 8.2, 8.3**
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWorkoutContext } from '../context/WorkoutContext';
import { WorkoutCategory, WarmupActivity } from '../types';
import { validateExerciseName, validateDuration } from '../utils/validators';
import { COLORS as THEME_COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, TOUCH_TARGETS } from '../constants/theme';

interface WarmupFormScreenProps {
  route: {
    params: {
      workoutId: WorkoutCategory;
      warmupId?: string;
    };
  };
  navigation: {
    goBack: () => void;
  };
}

// Warmup-specific colors (using warmup accent color)
const COLORS = {
  ...THEME_COLORS,
  primary: THEME_COLORS.warmup, // Use warmup color as primary for this screen
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * WarmupFormScreen component
 * Form for warmup name, duration, link
 * Supports create and edit modes
 */
export function WarmupFormScreen({ route, navigation }: WarmupFormScreenProps): React.ReactElement {
  const { workoutId, warmupId } = route.params;
  const { workouts, addWarmup, updateWarmup } = useWorkoutContext();
  const workout = workouts[workoutId];
  const existingWarmup = warmupId 
    ? workout.warmups.find(w => w.id === warmupId) 
    : undefined;
  const isEditing = !!existingWarmup;


  // Form state
  const [name, setName] = useState(existingWarmup?.name || '');
  const [durationSeconds, setDurationSeconds] = useState(
    existingWarmup?.durationSeconds?.toString() || '60'
  );
  const [executionLink, setExecutionLink] = useState(existingWarmup?.executionLink || '');

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    const nameValidation = validateExerciseName(name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error || 'Nome inválido';
    }

    // Validate duration
    const durationValue = parseInt(durationSeconds, 10);
    const durationValidation = validateDuration(isNaN(durationValue) ? -1 : durationValue);
    if (!durationValidation.isValid) {
      newErrors.durationSeconds = durationValidation.error || 'Duração inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const warmupData: WarmupActivity = {
      id: existingWarmup?.id || generateId(),
      name: name.trim(),
      durationSeconds: parseInt(durationSeconds, 10),
      executionLink: executionLink.trim() || undefined,
      order: existingWarmup?.order ?? workout.warmups.length,
    };

    if (isEditing) {
      updateWarmup(workoutId, warmupData.id, warmupData);
    } else {
      addWarmup(workoutId, warmupData);
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
      error?: string;
    } = {}
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, options.error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={options.placeholder}
        placeholderTextColor={COLORS.placeholder}
        keyboardType={options.keyboardType || 'default'}
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
          {isEditing ? 'Editar Aquecimento' : 'Novo Aquecimento'}
        </Text>

        {renderInput('Nome do Aquecimento *', name, setName, {
          placeholder: 'Ex: Esteira leve',
          error: errors.name,
        })}

        {renderInput('Duração (segundos) *', durationSeconds, setDurationSeconds, {
          placeholder: '60',
          keyboardType: 'numeric',
          error: errors.durationSeconds,
        })}

        {renderInput('Link de Execução', executionLink, setExecutionLink, {
          placeholder: 'https://youtube.com/...',
          keyboardType: 'url',
        })}

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
            testID="save-warmup-button"
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Salvar Alterações' : 'Adicionar Aquecimento'}
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
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
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

export default WarmupFormScreen;

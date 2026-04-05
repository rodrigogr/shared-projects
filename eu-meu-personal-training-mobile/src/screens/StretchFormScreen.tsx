/**
 * StretchFormScreen - Form for creating and editing stretch activities
 * **Validates: Requirements 5.2, 5.3, 8.1, 8.2, 8.3**
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
import { WorkoutCategory, StretchActivity } from '../types';
import { validateExerciseName, validateDuration } from '../utils/validators';
import { COLORS as THEME_COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, TOUCH_TARGETS } from '../constants/theme';

interface StretchFormScreenProps {
  route: {
    params: {
      workoutId: WorkoutCategory;
      stretchId?: string;
    };
  };
  navigation: {
    goBack: () => void;
  };
}

// Stretch-specific colors (using stretch accent color)
const COLORS = {
  ...THEME_COLORS,
  primary: THEME_COLORS.stretch, // Use stretch color as primary for this screen
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * StretchFormScreen component
 * Form for stretch name, duration, target muscles, link
 * Supports create and edit modes
 */
export function StretchFormScreen({ route, navigation }: StretchFormScreenProps): React.ReactElement {
  const { workoutId, stretchId } = route.params;
  const { workouts, addStretch, updateStretch } = useWorkoutContext();
  const workout = workouts[workoutId];
  const existingStretch = stretchId 
    ? workout.stretches.find(s => s.id === stretchId) 
    : undefined;
  const isEditing = !!existingStretch;


  // Form state
  const [name, setName] = useState(existingStretch?.name || '');
  const [durationSeconds, setDurationSeconds] = useState(
    existingStretch?.durationSeconds?.toString() || '30'
  );
  const [targetMuscles, setTargetMuscles] = useState(existingStretch?.targetMuscles || '');
  const [executionLink, setExecutionLink] = useState(existingStretch?.executionLink || '');

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

    // Validate target muscles (required)
    if (!targetMuscles.trim()) {
      newErrors.targetMuscles = 'Músculos alvo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const stretchData: StretchActivity = {
      id: existingStretch?.id || generateId(),
      name: name.trim(),
      durationSeconds: parseInt(durationSeconds, 10),
      targetMuscles: targetMuscles.trim(),
      executionLink: executionLink.trim() || undefined,
      order: existingStretch?.order ?? workout.stretches.length,
    };

    if (isEditing) {
      updateStretch(workoutId, stretchData.id, stretchData);
    } else {
      addStretch(workoutId, stretchData);
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
          {isEditing ? 'Editar Alongamento' : 'Novo Alongamento'}
        </Text>

        {renderInput('Nome do Alongamento *', name, setName, {
          placeholder: 'Ex: Alongamento de peitoral',
          error: errors.name,
        })}

        {renderInput('Duração (segundos) *', durationSeconds, setDurationSeconds, {
          placeholder: '30',
          keyboardType: 'numeric',
          error: errors.durationSeconds,
        })}

        {renderInput('Músculos Alvo *', targetMuscles, setTargetMuscles, {
          placeholder: 'Ex: peitoral + ombros',
          error: errors.targetMuscles,
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
            testID="save-stretch-button"
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Salvar Alterações' : 'Adicionar Alongamento'}
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

export default StretchFormScreen;

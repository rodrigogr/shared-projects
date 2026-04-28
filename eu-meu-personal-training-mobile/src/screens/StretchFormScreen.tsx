/**
 * StretchFormScreen - Form for creating and editing stretch activities. Uses
 * the active theme palette and the stretch accent for the primary action.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { StretchActivity, WorkoutCategory } from '../types';
import { validateExerciseName, validateDuration } from '../utils/validators';
import { createFormStyles } from './formStyles';

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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function StretchFormScreen({ route, navigation }: StretchFormScreenProps): React.ReactElement {
  const { workoutId, stretchId } = route.params;
  const { workouts, addStretch, updateStretch } = useWorkoutContext();
  const { colors } = useTheme();
  const styles = useMemo(() => createFormStyles(colors, colors.stretch), [colors]);

  const workout = workouts[workoutId];
  const existingStretch = stretchId
    ? workout.stretches.find((s) => s.id === stretchId)
    : undefined;
  const isEditing = !!existingStretch;

  const [name, setName] = useState(existingStretch?.name || '');
  const [durationSeconds, setDurationSeconds] = useState(
    existingStretch?.durationSeconds?.toString() || '30'
  );
  const [targetMuscles, setTargetMuscles] = useState(existingStretch?.targetMuscles || '');
  const [executionLink, setExecutionLink] = useState(existingStretch?.executionLink || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameValidation = validateExerciseName(name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error || 'Nome inválido';
    }

    const durationValue = parseInt(durationSeconds, 10);
    const durationValidation = validateDuration(isNaN(durationValue) ? -1 : durationValue);
    if (!durationValidation.isValid) {
      newErrors.durationSeconds = durationValidation.error || 'Duração inválida';
    }

    if (!targetMuscles.trim()) {
      newErrors.targetMuscles = 'Músculos alvo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

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
        placeholderTextColor={colors.placeholder}
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
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
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

export default StretchFormScreen;

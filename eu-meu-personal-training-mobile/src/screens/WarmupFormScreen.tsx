/**
 * WarmupFormScreen - Form for creating and editing warmup activities. Uses
 * the active theme palette and the warmup accent for the primary action.
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
import { WarmupActivity, WorkoutCategory } from '../types';
import { validateExerciseName, validateDuration } from '../utils/validators';
import { createFormStyles } from './formStyles';

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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function WarmupFormScreen({ route, navigation }: WarmupFormScreenProps): React.ReactElement {
  const { workoutId, warmupId } = route.params;
  const { workouts, addWarmup, updateWarmup } = useWorkoutContext();
  const { colors } = useTheme();
  const styles = useMemo(() => createFormStyles(colors, colors.warmup), [colors]);

  const workout = workouts[workoutId];
  const existingWarmup = warmupId
    ? workout.warmups.find((w) => w.id === warmupId)
    : undefined;
  const isEditing = !!existingWarmup;

  const [name, setName] = useState(existingWarmup?.name || '');
  const [durationSeconds, setDurationSeconds] = useState(
    existingWarmup?.durationSeconds?.toString() || '60'
  );
  const [executionLink, setExecutionLink] = useState(existingWarmup?.executionLink || '');

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

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
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
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

export default WarmupFormScreen;

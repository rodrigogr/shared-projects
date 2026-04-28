/**
 * ExerciseFormScreen - Form for creating and editing exercises. Reacts to the
 * active theme (light / dark) via `useTheme()`.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWorkoutContext } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { Exercise, WorkoutCategory } from '../types';
import { validateExerciseName, validateLoad, validateReps } from '../utils/validators';
import { createFormStyles } from './formStyles';

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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function ExerciseFormScreen({ route, navigation }: ExerciseFormScreenProps): React.ReactElement {
  const { workoutId, exerciseId } = route.params;
  const { workouts, addExercise, updateExercise } = useWorkoutContext();
  const { colors } = useTheme();
  const styles = useMemo(() => createFormStyles(colors), [colors]);

  const workout = workouts[workoutId];
  const existingExercise = exerciseId
    ? workout.exercises.find((e) => e.id === exerciseId)
    : undefined;
  const isEditing = !!existingExercise;

  const [name, setName] = useState(existingExercise?.name || '');
  const [executionLink, setExecutionLink] = useState(existingExercise?.executionLink || '');
  const [mediaUri, setMediaUri] = useState(existingExercise?.mediaUri || '');
  const [sets, setSets] = useState(existingExercise?.sets?.toString() || '4');
  const [reps, setReps] = useState(existingExercise?.reps || '8-12');
  const [restSeconds, setRestSeconds] = useState(existingExercise?.restSeconds?.toString() || '90');
  const [loadKg, setLoadKg] = useState(existingExercise?.loadKg?.toString() || '0');
  const [notes, setNotes] = useState(existingExercise?.notes || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameValidation = validateExerciseName(name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error || 'Nome inválido';
    }

    const loadValue = parseFloat(loadKg);
    const loadValidation = validateLoad(isNaN(loadValue) ? -1 : loadValue);
    if (!loadValidation.isValid) {
      newErrors.loadKg = loadValidation.error || 'Carga inválida';
    }

    const repsValidation = validateReps(reps);
    if (!repsValidation.isValid) {
      newErrors.reps = repsValidation.error || 'Repetições inválidas';
    }

    const setsValue = parseInt(sets, 10);
    if (isNaN(setsValue) || setsValue <= 0) {
      newErrors.sets = 'Séries deve ser um número positivo';
    }

    const restValue = parseInt(restSeconds, 10);
    if (isNaN(restValue) || restValue < 0) {
      newErrors.restSeconds = 'Descanso deve ser um número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const exerciseData: Exercise = {
      id: existingExercise?.id || generateId(),
      name: name.trim(),
      mediaUri: mediaUri.trim() || undefined,
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
        placeholderTextColor={colors.placeholder}
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

        {renderInput('Mídia (URL de imagem)', mediaUri, setMediaUri, {
          placeholder: 'https://exemplo.com/imagem.jpg',
          keyboardType: 'url',
        })}
        {!!mediaUri.trim() && (
          <View style={styles.mediaPreviewContainer}>
            <Image
              source={{ uri: mediaUri.trim() }}
              style={styles.mediaPreview}
              resizeMode="cover"
              onError={() => {}}
            />
          </View>
        )}

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

        {renderInput('Observações', notes, setNotes, {
          placeholder: 'Notas adicionais...',
          multiline: true,
        })}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
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

export default ExerciseFormScreen;

/**
 * Validation utilities for Eu Meu Personal Training
 * These functions validate user input for exercises, warmups, and stretches
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates exercise name - must be non-empty and not only whitespace
 * **Feature: eu-meu-personal-training, Property 2: Empty name validation**
 * **Validates: Requirements 2.3**
 */
export function validateExerciseName(name: string): ValidationResult {
  if (typeof name !== 'string') {
    return { isValid: false, error: 'Nome do exercício é obrigatório' };
  }
  
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Nome do exercício é obrigatório' };
  }
  
  return { isValid: true };
}

/**
 * Validates load value - must be a non-negative number (in kg)
 * **Feature: eu-meu-personal-training, Property 11: Load value validation**
 * **Validates: Requirements 3.3**
 */
export function validateLoad(load: number): ValidationResult {
  if (typeof load !== 'number' || isNaN(load)) {
    return { isValid: false, error: 'Carga deve ser um número positivo' };
  }
  
  if (load < 0) {
    return { isValid: false, error: 'Carga deve ser um número positivo' };
  }
  
  return { isValid: true };
}

/**
 * Validates repetition format - accepts single number (e.g., "10") or range (e.g., "8-12")
 * **Feature: eu-meu-personal-training, Property 10: Repetition format validation**
 * **Validates: Requirements 3.4**
 */
export function validateReps(reps: string): ValidationResult {
  if (typeof reps !== 'string') {
    return { isValid: false, error: 'Formato inválido. Use "10" ou "8-12"' };
  }
  
  const trimmed = reps.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Formato inválido. Use "10" ou "8-12"' };
  }
  
  // Single number format: "10", "12", etc.
  const singleNumberPattern = /^\d+$/;
  if (singleNumberPattern.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num > 0) {
      return { isValid: true };
    }
    return { isValid: false, error: 'Formato inválido. Use "10" ou "8-12"' };
  }
  
  // Range format: "8-12", "10-15", etc.
  const rangePattern = /^(\d+)-(\d+)$/;
  const match = trimmed.match(rangePattern);
  if (match) {
    const min = parseInt(match[1], 10);
    const max = parseInt(match[2], 10);
    if (min > 0 && max > 0 && min <= max) {
      return { isValid: true };
    }
    return { isValid: false, error: 'Formato inválido. Use "10" ou "8-12"' };
  }
  
  return { isValid: false, error: 'Formato inválido. Use "10" ou "8-12"' };
}

/**
 * Validates duration - must be a positive number (in seconds)
 * Used for warmup and stretch activities
 */
export function validateDuration(duration: number): ValidationResult {
  if (typeof duration !== 'number' || isNaN(duration)) {
    return { isValid: false, error: 'Duração deve ser um número positivo' };
  }
  
  if (duration <= 0) {
    return { isValid: false, error: 'Duração deve ser um número positivo' };
  }
  
  return { isValid: true };
}

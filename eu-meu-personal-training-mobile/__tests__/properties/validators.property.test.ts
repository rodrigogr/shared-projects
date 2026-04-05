/**
 * Property-based tests for validation functions
 * Using fast-check for property-based testing
 */
import * as fc from 'fast-check';
import {
  validateExerciseName,
  validateLoad,
  validateReps,
} from '../../src/utils/validators';

describe('Validators Property Tests', () => {
  /**
   * **Feature: eu-meu-personal-training, Property 2: Empty name validation**
   * **Validates: Requirements 2.3**
   * 
   * For any exercise data where the name is empty or consists only of whitespace
   * characters, attempting to save the exercise should be rejected.
   */
  describe('Property 2: Empty name validation', () => {
    it('should reject empty strings', () => {
      fc.assert(
        fc.property(fc.constant(''), (name) => {
          const result = validateExerciseName(name);
          return result.isValid === false && result.error !== undefined;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject whitespace-only strings', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
            .map(arr => arr.join('')),
          (name: string) => {
            const result = validateExerciseName(name);
            return result.isValid === false && result.error !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept non-empty, non-whitespace strings', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.trim().length > 0),
          (name) => {
            const result = validateExerciseName(name);
            return result.isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: eu-meu-personal-training, Property 10: Repetition format validation**
   * **Validates: Requirements 3.4**
   * 
   * For any repetition input, the system should accept single numeric values
   * (e.g., "10") or range formats (e.g., "8-12"), and reject invalid formats.
   */
  describe('Property 10: Repetition format validation', () => {
    it('should accept valid single positive numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (num) => {
            const result = validateReps(String(num));
            return result.isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid range formats where min <= max', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (a, b) => {
            const min = Math.min(a, b);
            const max = Math.max(a, b);
            const result = validateReps(`${min}-${max}`);
            return result.isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid formats (random strings without numbers)', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !/^\d+$/.test(s.trim()) && !/^\d+-\d+$/.test(s.trim())),
          (reps) => {
            const result = validateReps(reps);
            return result.isValid === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject zero as single value', () => {
      const result = validateReps('0');
      expect(result.isValid).toBe(false);
    });

    it('should reject ranges where min > max', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.integer({ min: 1, max: 99 }),
          (a, b) => {
            if (a <= b) return true; // Skip valid cases
            const result = validateReps(`${a}-${b}`);
            return result.isValid === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: eu-meu-personal-training, Property 11: Load value validation**
   * **Validates: Requirements 3.3**
   * 
   * For any load input, the system should accept non-negative numeric values
   * representing kilograms, and reject non-numeric or negative values.
   */
  describe('Property 11: Load value validation', () => {
    it('should accept non-negative numbers', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1000, noNaN: true }),
          (load) => {
            const result = validateLoad(load);
            return result.isValid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept zero as valid load', () => {
      const result = validateLoad(0);
      expect(result.isValid).toBe(true);
    });

    it('should reject negative numbers', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1000, max: Math.fround(-0.001), noNaN: true }),
          (load) => {
            const result = validateLoad(load);
            return result.isValid === false && result.error !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject NaN', () => {
      const result = validateLoad(NaN);
      expect(result.isValid).toBe(false);
    });
  });
});

/**
 * Property-based tests for serialization functions
 * Using fast-check for property-based testing
 * 
 * **Feature: eu-meu-personal-training, Property 8: Data serialization round-trip**
 * **Validates: Requirements 9.4, 9.5**
 */
import * as fc from 'fast-check';
import {
  serializeWorkouts,
  deserializeWorkouts,
} from '../../src/utils/serializer';
import {
  Workout,
  WorkoutCategory,
  Exercise,
  WarmupActivity,
  StretchActivity,
} from '../../src/types';

// Generators for workout data structures

const exerciseArbitrary: fc.Arbitrary<Exercise> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  mediaUri: fc.option(fc.webUrl(), { nil: undefined }),
  executionLink: fc.option(fc.webUrl(), { nil: undefined }),
  sets: fc.integer({ min: 1, max: 10 }),
  reps: fc.oneof(
    fc.integer({ min: 1, max: 50 }).map(n => String(n)),
    fc.tuple(
      fc.integer({ min: 1, max: 25 }),
      fc.integer({ min: 1, max: 25 })
    ).map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`)
  ),
  restSeconds: fc.integer({ min: 0, max: 300 }),
  loadKg: fc.float({ min: 0, max: 500, noNaN: true }),
  notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  order: fc.integer({ min: 0, max: 100 }),
});

const warmupArbitrary: fc.Arbitrary<WarmupActivity> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  durationSeconds: fc.integer({ min: 1, max: 600 }),
  executionLink: fc.option(fc.webUrl(), { nil: undefined }),
  order: fc.integer({ min: 0, max: 100 }),
});

const stretchArbitrary: fc.Arbitrary<StretchActivity> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  durationSeconds: fc.integer({ min: 1, max: 600 }),
  executionLink: fc.option(fc.webUrl(), { nil: undefined }),
  targetMuscles: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  order: fc.integer({ min: 0, max: 100 }),
});

// Generate valid ISO date strings using timestamp integers
const validIsoDateArbitrary = fc
  .integer({ min: 1577836800000, max: 1924905600000 }) // 2020-01-01 to 2030-12-31
  .map(ts => new Date(ts).toISOString());

const workoutArbitrary = (category: WorkoutCategory): fc.Arbitrary<Workout> =>
  fc.record({
    id: fc.constant(category),
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    description: fc.string({ maxLength: 500 }),
    warmups: fc.array(warmupArbitrary, { minLength: 0, maxLength: 5 }),
    exercises: fc.array(exerciseArbitrary, { minLength: 0, maxLength: 10 }),
    stretches: fc.array(stretchArbitrary, { minLength: 0, maxLength: 5 }),
    updatedAt: validIsoDateArbitrary,
  });

const workoutsRecordArbitrary: fc.Arbitrary<Record<WorkoutCategory, Workout>> = fc
  .tuple(
    workoutArbitrary('A'),
    workoutArbitrary('B'),
    workoutArbitrary('C'),
    workoutArbitrary('D')
  )
  .map(([a, b, c, d]) => ({
    A: a,
    B: b,
    C: c,
    D: d,
  }));

describe('Serialization Property Tests', () => {
  /**
   * **Feature: eu-meu-personal-training, Property 8: Data serialization round-trip**
   * **Validates: Requirements 9.4, 9.5**
   * 
   * For any valid workout data structure, serializing to JSON and then
   * deserializing should produce an equivalent data structure with all
   * fields preserved (workouts, exercises, warmups, stretches, and all their properties).
   */
  describe('Property 8: Data serialization round-trip', () => {
    it('should preserve all workout data through serialize/deserialize cycle', () => {
      fc.assert(
        fc.property(workoutsRecordArbitrary, (workouts) => {
          // Serialize
          const serialized = serializeWorkouts(workouts);
          if (!serialized.success || !serialized.data) {
            return false;
          }

          // Deserialize
          const deserialized = deserializeWorkouts(serialized.data);
          if (!deserialized.success || !deserialized.data) {
            return false;
          }

          // Compare workouts (ignoring lastUpdated which changes on serialize)
          const originalWorkouts = workouts;
          const roundTrippedWorkouts = deserialized.data.workouts;

          // Check all categories
          const categories: WorkoutCategory[] = ['A', 'B', 'C', 'D'];
          for (const cat of categories) {
            const original = originalWorkouts[cat];
            const roundTripped = roundTrippedWorkouts[cat];

            // Check basic workout properties
            if (
              original.id !== roundTripped.id ||
              original.name !== roundTripped.name ||
              original.description !== roundTripped.description ||
              original.updatedAt !== roundTripped.updatedAt
            ) {
              return false;
            }

            // Check exercises
            if (original.exercises.length !== roundTripped.exercises.length) {
              return false;
            }
            for (let i = 0; i < original.exercises.length; i++) {
              const origEx = original.exercises[i];
              const rtEx = roundTripped.exercises[i];
              if (
                origEx.id !== rtEx.id ||
                origEx.name !== rtEx.name ||
                origEx.sets !== rtEx.sets ||
                origEx.reps !== rtEx.reps ||
                origEx.restSeconds !== rtEx.restSeconds ||
                origEx.loadKg !== rtEx.loadKg ||
                origEx.order !== rtEx.order ||
                origEx.mediaUri !== rtEx.mediaUri ||
                origEx.executionLink !== rtEx.executionLink ||
                origEx.notes !== rtEx.notes
              ) {
                return false;
              }
            }

            // Check warmups
            if (original.warmups.length !== roundTripped.warmups.length) {
              return false;
            }
            for (let i = 0; i < original.warmups.length; i++) {
              const origW = original.warmups[i];
              const rtW = roundTripped.warmups[i];
              if (
                origW.id !== rtW.id ||
                origW.name !== rtW.name ||
                origW.durationSeconds !== rtW.durationSeconds ||
                origW.order !== rtW.order ||
                origW.executionLink !== rtW.executionLink
              ) {
                return false;
              }
            }

            // Check stretches
            if (original.stretches.length !== roundTripped.stretches.length) {
              return false;
            }
            for (let i = 0; i < original.stretches.length; i++) {
              const origS = original.stretches[i];
              const rtS = roundTripped.stretches[i];
              if (
                origS.id !== rtS.id ||
                origS.name !== rtS.name ||
                origS.durationSeconds !== rtS.durationSeconds ||
                origS.targetMuscles !== rtS.targetMuscles ||
                origS.order !== rtS.order ||
                origS.executionLink !== rtS.executionLink
              ) {
                return false;
              }
            }
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return success:true for valid serialization', () => {
      fc.assert(
        fc.property(workoutsRecordArbitrary, (workouts) => {
          const result = serializeWorkouts(workouts);
          return result.success === true && typeof result.data === 'string';
        }),
        { numRuns: 100 }
      );
    });

    it('should produce valid JSON on serialization', () => {
      fc.assert(
        fc.property(workoutsRecordArbitrary, (workouts) => {
          const result = serializeWorkouts(workouts);
          if (!result.success || !result.data) return false;
          
          try {
            JSON.parse(result.data);
            return true;
          } catch {
            return false;
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Deserialization error handling', () => {
    it('should reject empty strings', () => {
      const result = deserializeWorkouts('');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid JSON', () => {
      const result = deserializeWorkouts('not valid json {{{');
      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON');
    });

    it('should reject JSON with missing required fields', () => {
      const result = deserializeWorkouts('{"version": 1}');
      expect(result.success).toBe(false);
    });

    it('should reject JSON with invalid workout structure', () => {
      const invalidData = JSON.stringify({
        version: 1,
        lastUpdated: new Date().toISOString(),
        workouts: {
          A: { id: 'A' }, // Missing required fields
          B: {},
          C: {},
          D: {},
        },
      });
      const result = deserializeWorkouts(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

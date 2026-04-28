/**
 * Property-based tests for Warmup CRUD operations
 * Using fast-check for property-based testing
 * 
 * **Feature: eu-meu-personal-training, Property 6: Warmup CRUD operations**
 * **Validates: Requirements 4.2, 4.3, 4.4**
 */
import * as fc from 'fast-check';
import {
  workoutReducer,
  WorkoutState,
  WorkoutAction,
} from '../../src/context/WorkoutContext';
import { createDefaultWorkouts } from '../../src/hooks/useWorkoutStorage';
import { WorkoutCategory, WarmupActivity } from '../../src/types';

// Generators for warmup data structures

const workoutCategoryArbitrary: fc.Arbitrary<WorkoutCategory> = fc.constantFrom('A', 'B', 'C', 'D');

/**
 * Generator for valid warmup data
 */
const validWarmupArbitrary: fc.Arbitrary<WarmupActivity> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  durationSeconds: fc.integer({ min: 1, max: 600 }),
  executionLink: fc.option(fc.webUrl(), { nil: undefined }),
  order: fc.integer({ min: 0, max: 100 }),
});

/**
 * Creates initial state with default workouts
 */
function createInitialState(): WorkoutState {
  return {
    workouts: createDefaultWorkouts(),
    isLoading: false,
    sessions: [],
  };
}

/**
 * Creates state with a specific workout containing warmups
 */
function createStateWithWarmups(
  workoutId: WorkoutCategory,
  warmups: WarmupActivity[]
): WorkoutState {
  const state = createInitialState();
  state.workouts[workoutId] = {
    ...state.workouts[workoutId],
    warmups,
  };
  return state;
}


describe('Warmup CRUD Property Tests', () => {
  /**
   * **Feature: eu-meu-personal-training, Property 6: Warmup CRUD operations**
   * **Validates: Requirements 4.2, 4.3, 4.4**
   * 
   * For any workout:
   * - Adding a warmup activity should increase the warmup count by one
   * - Editing a warmup should update only the modified fields
   * - Deleting a warmup should decrease the count by one and remove that specific warmup
   */
  describe('Property 6: Warmup CRUD operations', () => {
    // ADD WARMUP TESTS
    describe('Add warmup', () => {
      it('should increase warmup count by exactly one when adding', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            validWarmupArbitrary,
            fc.array(validWarmupArbitrary, { minLength: 0, maxLength: 10 }),
            (workoutId, newWarmup, existingWarmups) => {
              // Setup: Create state with existing warmups
              const initialState = createStateWithWarmups(workoutId, existingWarmups);
              const initialCount = initialState.workouts[workoutId].warmups.length;

              // Action: Add warmup via reducer
              const action: WorkoutAction = {
                type: 'ADD_WARMUP',
                payload: { workoutId, warmup: newWarmup },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Count increased by exactly one
              const newCount = newState.workouts[workoutId].warmups.length;
              return newCount === initialCount + 1;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should make the added warmup retrievable from the workout', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            validWarmupArbitrary,
            (workoutId, warmup) => {
              // Setup
              const initialState = createInitialState();

              // Action
              const action: WorkoutAction = {
                type: 'ADD_WARMUP',
                payload: { workoutId, warmup },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Warmup is retrievable by ID
              const addedWarmup = newState.workouts[workoutId].warmups.find(
                w => w.id === warmup.id
              );
              return (
                addedWarmup !== undefined &&
                addedWarmup.name === warmup.name &&
                addedWarmup.durationSeconds === warmup.durationSeconds
              );
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    // UPDATE WARMUP TESTS
    describe('Update warmup', () => {
      it('should update only modified fields when editing', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            validWarmupArbitrary,
            fc.record({
              name: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
              durationSeconds: fc.option(fc.integer({ min: 1, max: 600 }), { nil: undefined }),
            }),
            (workoutId, originalWarmup, modifications) => {
              // Setup: Create state with the original warmup
              const initialState = createStateWithWarmups(workoutId, [originalWarmup]);

              // Filter out undefined modifications
              const actualModifications: Partial<WarmupActivity> = {};
              if (modifications.name !== undefined) actualModifications.name = modifications.name;
              if (modifications.durationSeconds !== undefined) actualModifications.durationSeconds = modifications.durationSeconds;

              // Action: Update warmup via reducer
              const action: WorkoutAction = {
                type: 'UPDATE_WARMUP',
                payload: {
                  workoutId,
                  warmupId: originalWarmup.id,
                  data: actualModifications,
                },
              };
              const newState = workoutReducer(initialState, action);

              // Get the updated warmup
              const updatedWarmup = newState.workouts[workoutId].warmups.find(
                w => w.id === originalWarmup.id
              );

              if (!updatedWarmup) return false;

              // Assert: Modified fields have new values
              if (modifications.name !== undefined && updatedWarmup.name !== modifications.name) return false;
              if (modifications.durationSeconds !== undefined && updatedWarmup.durationSeconds !== modifications.durationSeconds) return false;

              // Assert: Unmodified fields retain original values
              if (modifications.name === undefined && updatedWarmup.name !== originalWarmup.name) return false;
              if (modifications.durationSeconds === undefined && updatedWarmup.durationSeconds !== originalWarmup.durationSeconds) return false;

              // Assert: ID and order are always preserved
              return (
                updatedWarmup.id === originalWarmup.id &&
                updatedWarmup.order === originalWarmup.order
              );
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should preserve warmup count when editing', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            fc.array(validWarmupArbitrary, { minLength: 1, maxLength: 10 }),
            fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            (workoutId, warmups, newName) => {
              // Setup
              const initialState = createStateWithWarmups(workoutId, warmups);
              const initialCount = initialState.workouts[workoutId].warmups.length;

              // Action: Update first warmup
              const action: WorkoutAction = {
                type: 'UPDATE_WARMUP',
                payload: {
                  workoutId,
                  warmupId: warmups[0].id,
                  data: { name: newName },
                },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Count unchanged
              return newState.workouts[workoutId].warmups.length === initialCount;
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    // DELETE WARMUP TESTS
    describe('Delete warmup', () => {
      it('should decrease warmup count by exactly one when deleting', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            fc.array(validWarmupArbitrary, { minLength: 1, maxLength: 10 }),
            (workoutId, warmups) => {
              // Setup: Create state with warmups
              const initialState = createStateWithWarmups(workoutId, warmups);
              const initialCount = initialState.workouts[workoutId].warmups.length;
              
              // Pick warmup to delete
              const warmupToDelete = warmups[0];

              // Action: Delete warmup via reducer
              const action: WorkoutAction = {
                type: 'DELETE_WARMUP',
                payload: { workoutId, warmupId: warmupToDelete.id },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Count decreased by exactly one
              const newCount = newState.workouts[workoutId].warmups.length;
              return newCount === initialCount - 1;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should make the deleted warmup no longer retrievable', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            fc.array(validWarmupArbitrary, { minLength: 1, maxLength: 10 }),
            (workoutId, warmups) => {
              // Setup
              const initialState = createStateWithWarmups(workoutId, warmups);
              const warmupToDelete = warmups[0];

              // Action
              const action: WorkoutAction = {
                type: 'DELETE_WARMUP',
                payload: { workoutId, warmupId: warmupToDelete.id },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Warmup is no longer in the workout
              const deletedWarmup = newState.workouts[workoutId].warmups.find(
                w => w.id === warmupToDelete.id
              );
              return deletedWarmup === undefined;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should preserve other warmups when deleting one', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            fc.array(validWarmupArbitrary, { minLength: 2, maxLength: 10 }),
            (workoutId, warmups) => {
              // Setup
              const initialState = createStateWithWarmups(workoutId, warmups);
              const warmupToDelete = warmups[0];
              const otherWarmups = warmups.slice(1);

              // Action
              const action: WorkoutAction = {
                type: 'DELETE_WARMUP',
                payload: { workoutId, warmupId: warmupToDelete.id },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Other warmups still exist
              return otherWarmups.every(w =>
                newState.workouts[workoutId].warmups.some(existing => existing.id === w.id)
              );
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});

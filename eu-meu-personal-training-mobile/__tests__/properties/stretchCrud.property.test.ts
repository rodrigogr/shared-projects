/**
 * Property-based tests for Stretch CRUD operations
 * Using fast-check for property-based testing
 * 
 * **Feature: eu-meu-personal-training, Property 7: Stretch CRUD operations**
 * **Validates: Requirements 5.2, 5.3, 5.4**
 */
import * as fc from 'fast-check';
import {
  workoutReducer,
  WorkoutState,
  WorkoutAction,
} from '../../src/context/WorkoutContext';
import { createDefaultWorkouts } from '../../src/hooks/useWorkoutStorage';
import { WorkoutCategory, StretchActivity } from '../../src/types';

// Generators for stretch data structures

const workoutCategoryArbitrary: fc.Arbitrary<WorkoutCategory> = fc.constantFrom('A', 'B', 'C', 'D');

/**
 * Generator for valid stretch data
 */
const validStretchArbitrary: fc.Arbitrary<StretchActivity> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  durationSeconds: fc.integer({ min: 1, max: 300 }),
  executionLink: fc.option(fc.webUrl(), { nil: undefined }),
  targetMuscles: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
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
 * Creates state with a specific workout containing stretches
 */
function createStateWithStretches(
  workoutId: WorkoutCategory,
  stretches: StretchActivity[]
): WorkoutState {
  const state = createInitialState();
  state.workouts[workoutId] = {
    ...state.workouts[workoutId],
    stretches,
  };
  return state;
}


describe('Stretch CRUD Property Tests', () => {
  /**
   * **Feature: eu-meu-personal-training, Property 7: Stretch CRUD operations**
   * **Validates: Requirements 5.2, 5.3, 5.4**
   * 
   * For any workout:
   * - Adding a stretch activity should increase the stretch count by one
   * - Editing a stretch should update only the modified fields
   * - Deleting a stretch should decrease the count by one and remove that specific stretch
   */
  describe('Property 7: Stretch CRUD operations', () => {
    // ADD STRETCH TESTS
    describe('Add stretch', () => {
      it('should increase stretch count by exactly one when adding', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            validStretchArbitrary,
            fc.array(validStretchArbitrary, { minLength: 0, maxLength: 10 }),
            (workoutId, newStretch, existingStretches) => {
              // Setup: Create state with existing stretches
              const initialState = createStateWithStretches(workoutId, existingStretches);
              const initialCount = initialState.workouts[workoutId].stretches.length;

              // Action: Add stretch via reducer
              const action: WorkoutAction = {
                type: 'ADD_STRETCH',
                payload: { workoutId, stretch: newStretch },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Count increased by exactly one
              const newCount = newState.workouts[workoutId].stretches.length;
              return newCount === initialCount + 1;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should make the added stretch retrievable from the workout', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            validStretchArbitrary,
            (workoutId, stretch) => {
              // Setup
              const initialState = createInitialState();

              // Action
              const action: WorkoutAction = {
                type: 'ADD_STRETCH',
                payload: { workoutId, stretch },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Stretch is retrievable by ID
              const addedStretch = newState.workouts[workoutId].stretches.find(
                s => s.id === stretch.id
              );
              return (
                addedStretch !== undefined &&
                addedStretch.name === stretch.name &&
                addedStretch.durationSeconds === stretch.durationSeconds &&
                addedStretch.targetMuscles === stretch.targetMuscles
              );
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    // UPDATE STRETCH TESTS
    describe('Update stretch', () => {
      it('should update only modified fields when editing', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            validStretchArbitrary,
            fc.record({
              name: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
              durationSeconds: fc.option(fc.integer({ min: 1, max: 300 }), { nil: undefined }),
              targetMuscles: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
            }),
            (workoutId, originalStretch, modifications) => {
              // Setup: Create state with the original stretch
              const initialState = createStateWithStretches(workoutId, [originalStretch]);

              // Filter out undefined modifications
              const actualModifications: Partial<StretchActivity> = {};
              if (modifications.name !== undefined) actualModifications.name = modifications.name;
              if (modifications.durationSeconds !== undefined) actualModifications.durationSeconds = modifications.durationSeconds;
              if (modifications.targetMuscles !== undefined) actualModifications.targetMuscles = modifications.targetMuscles;

              // Action: Update stretch via reducer
              const action: WorkoutAction = {
                type: 'UPDATE_STRETCH',
                payload: {
                  workoutId,
                  stretchId: originalStretch.id,
                  data: actualModifications,
                },
              };
              const newState = workoutReducer(initialState, action);

              // Get the updated stretch
              const updatedStretch = newState.workouts[workoutId].stretches.find(
                s => s.id === originalStretch.id
              );

              if (!updatedStretch) return false;

              // Assert: Modified fields have new values
              if (modifications.name !== undefined && updatedStretch.name !== modifications.name) return false;
              if (modifications.durationSeconds !== undefined && updatedStretch.durationSeconds !== modifications.durationSeconds) return false;
              if (modifications.targetMuscles !== undefined && updatedStretch.targetMuscles !== modifications.targetMuscles) return false;

              // Assert: Unmodified fields retain original values
              if (modifications.name === undefined && updatedStretch.name !== originalStretch.name) return false;
              if (modifications.durationSeconds === undefined && updatedStretch.durationSeconds !== originalStretch.durationSeconds) return false;
              if (modifications.targetMuscles === undefined && updatedStretch.targetMuscles !== originalStretch.targetMuscles) return false;

              // Assert: ID and order are always preserved
              return (
                updatedStretch.id === originalStretch.id &&
                updatedStretch.order === originalStretch.order
              );
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should preserve stretch count when editing', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            fc.array(validStretchArbitrary, { minLength: 1, maxLength: 10 }),
            fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            (workoutId, stretches, newName) => {
              // Setup
              const initialState = createStateWithStretches(workoutId, stretches);
              const initialCount = initialState.workouts[workoutId].stretches.length;

              // Action: Update first stretch
              const action: WorkoutAction = {
                type: 'UPDATE_STRETCH',
                payload: {
                  workoutId,
                  stretchId: stretches[0].id,
                  data: { name: newName },
                },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Count unchanged
              return newState.workouts[workoutId].stretches.length === initialCount;
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    // DELETE STRETCH TESTS
    describe('Delete stretch', () => {
      it('should decrease stretch count by exactly one when deleting', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            fc.array(validStretchArbitrary, { minLength: 1, maxLength: 10 }),
            (workoutId, stretches) => {
              // Setup: Create state with stretches
              const initialState = createStateWithStretches(workoutId, stretches);
              const initialCount = initialState.workouts[workoutId].stretches.length;
              
              // Pick stretch to delete
              const stretchToDelete = stretches[0];

              // Action: Delete stretch via reducer
              const action: WorkoutAction = {
                type: 'DELETE_STRETCH',
                payload: { workoutId, stretchId: stretchToDelete.id },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Count decreased by exactly one
              const newCount = newState.workouts[workoutId].stretches.length;
              return newCount === initialCount - 1;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should make the deleted stretch no longer retrievable', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            fc.array(validStretchArbitrary, { minLength: 1, maxLength: 10 }),
            (workoutId, stretches) => {
              // Setup
              const initialState = createStateWithStretches(workoutId, stretches);
              const stretchToDelete = stretches[0];

              // Action
              const action: WorkoutAction = {
                type: 'DELETE_STRETCH',
                payload: { workoutId, stretchId: stretchToDelete.id },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Stretch is no longer in the workout
              const deletedStretch = newState.workouts[workoutId].stretches.find(
                s => s.id === stretchToDelete.id
              );
              return deletedStretch === undefined;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should preserve other stretches when deleting one', () => {
        fc.assert(
          fc.property(
            workoutCategoryArbitrary,
            fc.array(validStretchArbitrary, { minLength: 2, maxLength: 10 }),
            (workoutId, stretches) => {
              // Setup
              const initialState = createStateWithStretches(workoutId, stretches);
              const stretchToDelete = stretches[0];
              const otherStretches = stretches.slice(1);

              // Action
              const action: WorkoutAction = {
                type: 'DELETE_STRETCH',
                payload: { workoutId, stretchId: stretchToDelete.id },
              };
              const newState = workoutReducer(initialState, action);

              // Assert: Other stretches still exist
              return otherStretches.every(s =>
                newState.workouts[workoutId].stretches.some(existing => existing.id === s.id)
              );
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});

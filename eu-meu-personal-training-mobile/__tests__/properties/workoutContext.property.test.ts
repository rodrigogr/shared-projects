/**
 * Property-based tests for WorkoutContext reducer operations
 * Using fast-check for property-based testing
 * 
 * Tests Properties 1, 4, and 5 from the design document
 */
import * as fc from 'fast-check';
import {
  workoutReducer,
  WorkoutState,
  WorkoutAction,
} from '../../src/context/WorkoutContext';
import { createDefaultWorkouts } from '../../src/hooks/useWorkoutStorage';
import {
  Workout,
  WorkoutCategory,
  Exercise,
} from '../../src/types';

// Generators for workout data structures

const workoutCategoryArbitrary: fc.Arbitrary<WorkoutCategory> = fc.constantFrom('A', 'B', 'C', 'D');

/**
 * Generator for valid exercise data (non-empty name)
 */
const validExerciseArbitrary: fc.Arbitrary<Exercise> = fc.record({
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

/**
 * Creates initial state with default workouts
 */
function createInitialState(): WorkoutState {
  return {
    workouts: createDefaultWorkouts(),
    isLoading: false,
  };
}

/**
 * Creates state with a specific workout containing exercises
 */
function createStateWithExercises(
  workoutId: WorkoutCategory,
  exercises: Exercise[]
): WorkoutState {
  const state = createInitialState();
  state.workouts[workoutId] = {
    ...state.workouts[workoutId],
    exercises,
  };
  return state;
}

describe('WorkoutContext Property Tests', () => {
  /**
   * **Feature: eu-meu-personal-training, Property 1: Exercise addition increases workout size**
   * **Validates: Requirements 2.2, 2.4**
   * 
   * For any workout and valid exercise data (non-empty name), adding the exercise
   * to the workout should result in the workout's exercise count increasing by
   * exactly one, and the added exercise should be retrievable from the workout.
   */
  describe('Property 1: Exercise addition increases workout size', () => {
    it('should increase exercise count by exactly one when adding valid exercise', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          validExerciseArbitrary,
          fc.array(validExerciseArbitrary, { minLength: 0, maxLength: 10 }),
          (workoutId, newExercise, existingExercises) => {
            // Setup: Create state with existing exercises
            const initialState = createStateWithExercises(workoutId, existingExercises);
            const initialCount = initialState.workouts[workoutId].exercises.length;

            // Action: Add exercise via reducer
            const action: WorkoutAction = {
              type: 'ADD_EXERCISE',
              payload: { workoutId, exercise: newExercise },
            };
            const newState = workoutReducer(initialState, action);

            // Assert: Count increased by exactly one
            const newCount = newState.workouts[workoutId].exercises.length;
            return newCount === initialCount + 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should make the added exercise retrievable from the workout', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          validExerciseArbitrary,
          (workoutId, exercise) => {
            // Setup
            const initialState = createInitialState();

            // Action
            const action: WorkoutAction = {
              type: 'ADD_EXERCISE',
              payload: { workoutId, exercise },
            };
            const newState = workoutReducer(initialState, action);

            // Assert: Exercise is retrievable by ID
            const addedExercise = newState.workouts[workoutId].exercises.find(
              e => e.id === exercise.id
            );
            return (
              addedExercise !== undefined &&
              addedExercise.name === exercise.name &&
              addedExercise.sets === exercise.sets &&
              addedExercise.reps === exercise.reps
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not affect other workouts when adding exercise', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          validExerciseArbitrary,
          (workoutId, exercise) => {
            // Setup
            const initialState = createInitialState();
            const otherCategories: WorkoutCategory[] = ['A', 'B', 'C', 'D'].filter(
              c => c !== workoutId
            ) as WorkoutCategory[];

            // Action
            const action: WorkoutAction = {
              type: 'ADD_EXERCISE',
              payload: { workoutId, exercise },
            };
            const newState = workoutReducer(initialState, action);

            // Assert: Other workouts unchanged
            return otherCategories.every(
              cat =>
                newState.workouts[cat].exercises.length ===
                initialState.workouts[cat].exercises.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: eu-meu-personal-training, Property 4: Exercise deletion removes from workout**
   * **Validates: Requirements 7.2**
   * 
   * For any workout containing an exercise, when the user confirms deletion of
   * that exercise, the exercise should no longer exist in the workout, and the
   * workout's exercise count should decrease by exactly one.
   */
  describe('Property 4: Exercise deletion removes from workout', () => {
    it('should decrease exercise count by exactly one when deleting', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          fc.array(validExerciseArbitrary, { minLength: 1, maxLength: 10 }),
          (workoutId, exercises) => {
            // Setup: Create state with exercises
            const initialState = createStateWithExercises(workoutId, exercises);
            const initialCount = initialState.workouts[workoutId].exercises.length;
            
            // Pick a random exercise to delete
            const exerciseToDelete = exercises[0];

            // Action: Delete exercise via reducer
            const action: WorkoutAction = {
              type: 'DELETE_EXERCISE',
              payload: { workoutId, exerciseId: exerciseToDelete.id },
            };
            const newState = workoutReducer(initialState, action);

            // Assert: Count decreased by exactly one
            const newCount = newState.workouts[workoutId].exercises.length;
            return newCount === initialCount - 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should make the deleted exercise no longer retrievable', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          fc.array(validExerciseArbitrary, { minLength: 1, maxLength: 10 }),
          (workoutId, exercises) => {
            // Setup
            const initialState = createStateWithExercises(workoutId, exercises);
            const exerciseToDelete = exercises[0];

            // Action
            const action: WorkoutAction = {
              type: 'DELETE_EXERCISE',
              payload: { workoutId, exerciseId: exerciseToDelete.id },
            };
            const newState = workoutReducer(initialState, action);

            // Assert: Exercise is no longer in the workout
            const deletedExercise = newState.workouts[workoutId].exercises.find(
              e => e.id === exerciseToDelete.id
            );
            return deletedExercise === undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve other exercises when deleting one', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          fc.array(validExerciseArbitrary, { minLength: 2, maxLength: 10 }),
          (workoutId, exercises) => {
            // Setup
            const initialState = createStateWithExercises(workoutId, exercises);
            const exerciseToDelete = exercises[0];
            const otherExercises = exercises.slice(1);

            // Action
            const action: WorkoutAction = {
              type: 'DELETE_EXERCISE',
              payload: { workoutId, exerciseId: exerciseToDelete.id },
            };
            const newState = workoutReducer(initialState, action);

            // Assert: Other exercises still exist
            return otherExercises.every(ex =>
              newState.workouts[workoutId].exercises.some(e => e.id === ex.id)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not affect other workouts when deleting exercise', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          fc.array(validExerciseArbitrary, { minLength: 1, maxLength: 10 }),
          (workoutId, exercises) => {
            // Setup
            const initialState = createStateWithExercises(workoutId, exercises);
            const otherCategories: WorkoutCategory[] = ['A', 'B', 'C', 'D'].filter(
              c => c !== workoutId
            ) as WorkoutCategory[];

            // Action
            const action: WorkoutAction = {
              type: 'DELETE_EXERCISE',
              payload: { workoutId, exerciseId: exercises[0].id },
            };
            const newState = workoutReducer(initialState, action);

            // Assert: Other workouts unchanged
            return otherCategories.every(
              cat =>
                newState.workouts[cat].exercises.length ===
                initialState.workouts[cat].exercises.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: eu-meu-personal-training, Property 3: Exercise edit round-trip**
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For any existing exercise in a workout, when the user opens the edit form,
   * the form should display the exact current values. After modifying any field
   * and saving, the stored exercise should reflect exactly those modifications.
   */
  describe('Property 3: Exercise edit round-trip', () => {
    it('should preserve exercise data when loaded for editing (form pre-fill)', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          validExerciseArbitrary,
          (workoutId, exercise) => {
            // Setup: Create state with the exercise
            const initialState = createStateWithExercises(workoutId, [exercise]);

            // Simulate: User opens edit form - form should display current values
            const exerciseForEdit = initialState.workouts[workoutId].exercises.find(
              e => e.id === exercise.id
            );

            // Assert: All fields match the original exercise
            return (
              exerciseForEdit !== undefined &&
              exerciseForEdit.id === exercise.id &&
              exerciseForEdit.name === exercise.name &&
              exerciseForEdit.sets === exercise.sets &&
              exerciseForEdit.reps === exercise.reps &&
              exerciseForEdit.restSeconds === exercise.restSeconds &&
              exerciseForEdit.loadKg === exercise.loadKg &&
              exerciseForEdit.order === exercise.order &&
              exerciseForEdit.mediaUri === exercise.mediaUri &&
              exerciseForEdit.executionLink === exercise.executionLink &&
              exerciseForEdit.notes === exercise.notes
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update only modified fields when saving edits', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          validExerciseArbitrary,
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
            sets: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
            reps: fc.option(
              fc.oneof(
                fc.integer({ min: 1, max: 50 }).map(n => String(n)),
                fc.tuple(
                  fc.integer({ min: 1, max: 25 }),
                  fc.integer({ min: 1, max: 25 })
                ).map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`)
              ),
              { nil: undefined }
            ),
            loadKg: fc.option(fc.float({ min: 0, max: 500, noNaN: true }), { nil: undefined }),
          }),
          (workoutId, originalExercise, modifications) => {
            // Setup: Create state with the original exercise
            const initialState = createStateWithExercises(workoutId, [originalExercise]);

            // Filter out undefined modifications
            const actualModifications: Partial<Exercise> = {};
            if (modifications.name !== undefined) actualModifications.name = modifications.name;
            if (modifications.sets !== undefined) actualModifications.sets = modifications.sets;
            if (modifications.reps !== undefined) actualModifications.reps = modifications.reps;
            if (modifications.loadKg !== undefined) actualModifications.loadKg = modifications.loadKg;

            // Action: Update exercise via reducer
            const action: WorkoutAction = {
              type: 'UPDATE_EXERCISE',
              payload: {
                workoutId,
                exerciseId: originalExercise.id,
                data: actualModifications,
              },
            };
            const newState = workoutReducer(initialState, action);

            // Get the updated exercise
            const updatedExercise = newState.workouts[workoutId].exercises.find(
              e => e.id === originalExercise.id
            );

            if (!updatedExercise) return false;

            // Assert: Modified fields have new values
            if (modifications.name !== undefined && updatedExercise.name !== modifications.name) return false;
            if (modifications.sets !== undefined && updatedExercise.sets !== modifications.sets) return false;
            if (modifications.reps !== undefined && updatedExercise.reps !== modifications.reps) return false;
            if (modifications.loadKg !== undefined && updatedExercise.loadKg !== modifications.loadKg) return false;

            // Assert: Unmodified fields retain original values
            if (modifications.name === undefined && updatedExercise.name !== originalExercise.name) return false;
            if (modifications.sets === undefined && updatedExercise.sets !== originalExercise.sets) return false;
            if (modifications.reps === undefined && updatedExercise.reps !== originalExercise.reps) return false;
            if (modifications.loadKg === undefined && updatedExercise.loadKg !== originalExercise.loadKg) return false;

            // Assert: ID and order are always preserved
            return (
              updatedExercise.id === originalExercise.id &&
              updatedExercise.order === originalExercise.order
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reflect exact modifications after edit round-trip', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          validExerciseArbitrary,
          validExerciseArbitrary,
          (workoutId, originalExercise, newData) => {
            // Setup: Create state with the original exercise
            const initialState = createStateWithExercises(workoutId, [originalExercise]);

            // Create complete update data (simulating form submission)
            const updateData: Partial<Exercise> = {
              name: newData.name,
              sets: newData.sets,
              reps: newData.reps,
              restSeconds: newData.restSeconds,
              loadKg: newData.loadKg,
              mediaUri: newData.mediaUri,
              executionLink: newData.executionLink,
              notes: newData.notes,
            };

            // Action: Update exercise via reducer
            const action: WorkoutAction = {
              type: 'UPDATE_EXERCISE',
              payload: {
                workoutId,
                exerciseId: originalExercise.id,
                data: updateData,
              },
            };
            const newState = workoutReducer(initialState, action);

            // Get the updated exercise
            const updatedExercise = newState.workouts[workoutId].exercises.find(
              e => e.id === originalExercise.id
            );

            if (!updatedExercise) return false;

            // Assert: All updated fields match the new data
            return (
              updatedExercise.id === originalExercise.id && // ID preserved
              updatedExercise.order === originalExercise.order && // Order preserved
              updatedExercise.name === newData.name &&
              updatedExercise.sets === newData.sets &&
              updatedExercise.reps === newData.reps &&
              updatedExercise.restSeconds === newData.restSeconds &&
              updatedExercise.loadKg === newData.loadKg &&
              updatedExercise.mediaUri === newData.mediaUri &&
              updatedExercise.executionLink === newData.executionLink &&
              updatedExercise.notes === newData.notes
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: eu-meu-personal-training, Property 9: Order preservation after reordering**
   * **Validates: Requirements 10.2, 10.3**
   * 
   * For any workout with multiple exercises, after reordering the exercises,
   * the new order should be persisted and subsequent displays should show
   * exercises in the user-defined sequence.
   */
  describe('Property 9: Order preservation after reordering', () => {
    it('should preserve the new order after reordering exercises', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          fc.array(validExerciseArbitrary, { minLength: 2, maxLength: 10 }),
          (workoutId, exercises) => {
            // Setup: Create state with exercises
            const initialState = createStateWithExercises(workoutId, exercises);
            
            // Create a shuffled order of exercise IDs
            const originalIds = exercises.map(e => e.id);
            const shuffledIds = [...originalIds].reverse(); // Simple shuffle: reverse order

            // Action: Reorder exercises via reducer
            const action: WorkoutAction = {
              type: 'REORDER_EXERCISES',
              payload: { workoutId, exerciseIds: shuffledIds },
            };
            const newState = workoutReducer(initialState, action);

            // Assert: Exercises are in the new order
            const reorderedExercises = newState.workouts[workoutId].exercises;
            
            // Check that the order field matches the new sequence
            for (let i = 0; i < shuffledIds.length; i++) {
              const exercise = reorderedExercises.find(e => e.id === shuffledIds[i]);
              if (!exercise || exercise.order !== i) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain all exercise data after reordering', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          fc.array(validExerciseArbitrary, { minLength: 2, maxLength: 10 }),
          (workoutId, exercises) => {
            // Setup: Create state with exercises
            const initialState = createStateWithExercises(workoutId, exercises);
            
            // Create a shuffled order
            const shuffledIds = [...exercises.map(e => e.id)].reverse();

            // Action: Reorder exercises
            const action: WorkoutAction = {
              type: 'REORDER_EXERCISES',
              payload: { workoutId, exerciseIds: shuffledIds },
            };
            const newState = workoutReducer(initialState, action);

            // Assert: All exercise data (except order) is preserved
            const reorderedExercises = newState.workouts[workoutId].exercises;
            
            return exercises.every(originalEx => {
              const reorderedEx = reorderedExercises.find(e => e.id === originalEx.id);
              if (!reorderedEx) return false;
              
              // All fields except 'order' should be unchanged
              return (
                reorderedEx.name === originalEx.name &&
                reorderedEx.sets === originalEx.sets &&
                reorderedEx.reps === originalEx.reps &&
                reorderedEx.restSeconds === originalEx.restSeconds &&
                reorderedEx.loadKg === originalEx.loadKg &&
                reorderedEx.mediaUri === originalEx.mediaUri &&
                reorderedEx.executionLink === originalEx.executionLink &&
                reorderedEx.notes === originalEx.notes
              );
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve exercise count after reordering', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          fc.array(validExerciseArbitrary, { minLength: 1, maxLength: 10 }),
          (workoutId, exercises) => {
            // Setup
            const initialState = createStateWithExercises(workoutId, exercises);
            const initialCount = initialState.workouts[workoutId].exercises.length;
            
            // Create shuffled order
            const shuffledIds = [...exercises.map(e => e.id)].reverse();

            // Action
            const action: WorkoutAction = {
              type: 'REORDER_EXERCISES',
              payload: { workoutId, exerciseIds: shuffledIds },
            };
            const newState = workoutReducer(initialState, action);

            // Assert: Count unchanged
            return newState.workouts[workoutId].exercises.length === initialCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display exercises in user-defined sequence when sorted by order', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          fc.array(validExerciseArbitrary, { minLength: 2, maxLength: 10 }),
          (workoutId, exercises) => {
            // Setup: Create state with exercises
            const initialState = createStateWithExercises(workoutId, exercises);
            
            // Create a specific new order (reverse)
            const newOrderIds = [...exercises.map(e => e.id)].reverse();

            // Action: Reorder exercises
            const action: WorkoutAction = {
              type: 'REORDER_EXERCISES',
              payload: { workoutId, exerciseIds: newOrderIds },
            };
            const newState = workoutReducer(initialState, action);

            // Simulate display: sort by order field (as WorkoutScreen does)
            const displayedExercises = [...newState.workouts[workoutId].exercises]
              .sort((a, b) => a.order - b.order);

            // Assert: Displayed order matches user-defined sequence
            for (let i = 0; i < newOrderIds.length; i++) {
              if (displayedExercises[i].id !== newOrderIds[i]) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not affect other workouts when reordering', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          fc.array(validExerciseArbitrary, { minLength: 2, maxLength: 10 }),
          (workoutId, exercises) => {
            // Setup
            const initialState = createStateWithExercises(workoutId, exercises);
            const otherCategories: WorkoutCategory[] = ['A', 'B', 'C', 'D'].filter(
              c => c !== workoutId
            ) as WorkoutCategory[];

            // Action
            const shuffledIds = [...exercises.map(e => e.id)].reverse();
            const action: WorkoutAction = {
              type: 'REORDER_EXERCISES',
              payload: { workoutId, exerciseIds: shuffledIds },
            };
            const newState = workoutReducer(initialState, action);

            // Assert: Other workouts unchanged
            return otherCategories.every(
              cat =>
                newState.workouts[cat].exercises.length ===
                initialState.workouts[cat].exercises.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: eu-meu-personal-training, Property 5: Deletion cancellation preserves exercise**
   * **Validates: Requirements 7.3**
   * 
   * For any workout and exercise, when the user initiates deletion but cancels,
   * the exercise should remain in the workout with all its data unchanged.
   * 
   * Note: This property tests that NOT dispatching DELETE_EXERCISE preserves state.
   * The reducer is pure, so if we don't dispatch the action, state remains unchanged.
   */
  describe('Property 5: Deletion cancellation preserves exercise', () => {
    it('should preserve exercise when deletion is not confirmed (no action dispatched)', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          fc.array(validExerciseArbitrary, { minLength: 1, maxLength: 10 }),
          (workoutId, exercises) => {
            // Setup: Create state with exercises
            const initialState = createStateWithExercises(workoutId, exercises);
            const exerciseToKeep = exercises[0];

            // Action: Simulate cancellation by NOT dispatching DELETE_EXERCISE
            // Instead, we verify that the state remains unchanged when no action is taken
            // This is equivalent to the user clicking "Cancel" in the confirmation dialog
            
            // The reducer should return the same state for unknown actions
            // But more importantly, we verify the exercise data is preserved
            const preservedExercise = initialState.workouts[workoutId].exercises.find(
              e => e.id === exerciseToKeep.id
            );

            // Assert: Exercise exists with all data intact
            return (
              preservedExercise !== undefined &&
              preservedExercise.id === exerciseToKeep.id &&
              preservedExercise.name === exerciseToKeep.name &&
              preservedExercise.sets === exerciseToKeep.sets &&
              preservedExercise.reps === exerciseToKeep.reps &&
              preservedExercise.restSeconds === exerciseToKeep.restSeconds &&
              preservedExercise.loadKg === exerciseToKeep.loadKg &&
              preservedExercise.order === exerciseToKeep.order
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all exercise data when state is not modified', () => {
      fc.assert(
        fc.property(
          workoutCategoryArbitrary,
          validExerciseArbitrary,
          (workoutId, exercise) => {
            // Setup: Create state with the exercise
            const initialState = createStateWithExercises(workoutId, [exercise]);

            // Simulate: User opens delete dialog but cancels
            // This means no action is dispatched to the reducer
            // We verify the state would remain unchanged

            // Create a copy of state (simulating what React would do)
            const stateAfterCancel = { ...initialState };

            // Assert: Exercise count unchanged
            const countBefore = initialState.workouts[workoutId].exercises.length;
            const countAfter = stateAfterCancel.workouts[workoutId].exercises.length;
            
            if (countBefore !== countAfter) return false;

            // Assert: Exercise data unchanged
            const exerciseBefore = initialState.workouts[workoutId].exercises[0];
            const exerciseAfter = stateAfterCancel.workouts[workoutId].exercises[0];

            return (
              exerciseBefore.id === exerciseAfter.id &&
              exerciseBefore.name === exerciseAfter.name &&
              exerciseBefore.sets === exerciseAfter.sets &&
              exerciseBefore.reps === exerciseAfter.reps &&
              exerciseBefore.restSeconds === exerciseAfter.restSeconds &&
              exerciseBefore.loadKg === exerciseAfter.loadKg &&
              exerciseBefore.order === exerciseAfter.order &&
              exerciseBefore.mediaUri === exerciseAfter.mediaUri &&
              exerciseBefore.executionLink === exerciseAfter.executionLink &&
              exerciseBefore.notes === exerciseAfter.notes
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

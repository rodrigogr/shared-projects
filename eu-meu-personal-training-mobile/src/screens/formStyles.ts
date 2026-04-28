/**
 * Shared style factory for the form screens (Exercise / Warmup / Stretch).
 *
 * Each form has the same overall layout: title, stacked inputs, and a
 * Cancelar / Salvar action row at the bottom. The only thing that changes
 * between them is the accent color used for the primary action button — that
 * is passed in as `accent`.
 */

import { StyleSheet } from 'react-native';
import {
  BORDER_RADIUS,
  FONT_SIZES,
  SPACING,
  TOUCH_TARGETS,
  ThemePalette,
} from '../constants/theme';

export function createFormStyles(colors: ThemePalette, accent: string = colors.primary) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.text,
      marginBottom: SPACING.xxl,
    },
    inputContainer: {
      marginBottom: SPACING.lg,
    },
    label: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.xs + 2,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      fontSize: FONT_SIZES.lg,
      color: colors.text,
      minHeight: TOUCH_TARGETS.minimum,
    },
    multilineInput: {
      minHeight: 80,
      maxHeight: 200,
      textAlignVertical: 'top',
      paddingTop: SPACING.sm,
    },
    inputError: {
      borderColor: colors.danger,
    },
    errorText: {
      color: colors.danger,
      fontSize: FONT_SIZES.sm,
      marginTop: SPACING.xs,
    },
    row: {
      flexDirection: 'row',
    },
    halfInput: {
      flex: 1,
      marginHorizontal: SPACING.xs,
    },
    buttonContainer: {
      flexDirection: 'row',
      marginTop: SPACING.xxl,
      marginBottom: SPACING.xxxl,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: SPACING.md + 2,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      minHeight: TOUCH_TARGETS.minimum,
      justifyContent: 'center',
      marginRight: SPACING.sm,
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
    },
    saveButton: {
      flex: 2,
      paddingVertical: SPACING.md + 2,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: accent,
      alignItems: 'center',
      minHeight: TOUCH_TARGETS.minimum,
      justifyContent: 'center',
    },
    saveButtonText: {
      color: colors.textOnPrimary,
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
    },
  });
}

/**
 * Shared utility functions to prevent circular dependencies
 */

export const currencySetter = (val: number) => Math.round((Number(val) || 0) * 100) / 100;

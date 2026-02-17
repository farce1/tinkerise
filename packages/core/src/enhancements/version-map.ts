/**
 * Centralized dependency version map.
 *
 * ALL package versions used by enhancement modules MUST come from here.
 * This ensures consistent versions across enhancements and simplifies
 * updates (one file to change, all enhancements pick it up).
 *
 * Follows create-t3-app's dependencyVersionMap pattern.
 *
 * Placeholder — populated in Task 2.
 */

export const dependencyVersionMap = {} as const satisfies Record<string, string>

export type DependencyName = keyof typeof dependencyVersionMap

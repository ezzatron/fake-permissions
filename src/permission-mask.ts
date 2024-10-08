import type {
  PermissionAccessStatus,
  PermissionStore,
} from "./permission-store.js";

export type PermissionMask = Record<PermissionAccessStatus, PermissionState>;

export function normalizeMask(mask: Partial<PermissionMask>): PermissionMask {
  return {
    PROMPT: "prompt",
    GRANTED: "granted",
    BLOCKED: "denied",
    BLOCKED_AUTOMATICALLY: "denied",
    ALLOWED: "prompt",
    DENIED: "prompt",
    ...mask,
  };
}

export function findMask(
  permissionStore: PermissionStore,
  masks: Iterable<[PermissionDescriptor, Partial<PermissionMask>]>,
  descriptor: PermissionDescriptor,
): Partial<PermissionMask> | undefined {
  for (const [d, v] of masks) {
    if (permissionStore.isMatchingDescriptor(descriptor, d)) return v;
  }

  return undefined;
}

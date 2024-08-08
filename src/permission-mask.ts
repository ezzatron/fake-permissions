import type { PermissionAccessStatus } from "./permission-store.js";

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

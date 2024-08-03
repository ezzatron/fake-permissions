import type { PermissionStore } from "./permission-store.js";

export function byDescriptor<T>(
  permissionStore: PermissionStore,
  map: Map<PermissionDescriptor, T>,
  descriptor: PermissionDescriptor,
): T | undefined {
  for (const [d, v] of map) {
    if (permissionStore.isMatchingDescriptor(descriptor, d)) return v;
  }

  return undefined;
}

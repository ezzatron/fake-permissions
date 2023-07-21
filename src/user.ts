import { DENIED, GRANTED, PROMPT } from "./constants/permission-state.js";
import { PermissionStore } from "./permission-store.js";

export interface User<Names extends string> {
  grantPermission(name: Names): void;
  denyPermission(name: Names): void;
  resetPermission(name: Names): void;
}

export function createUser<Names extends string>({
  permissionStore,
}: {
  permissionStore: PermissionStore<Names>;
}): User<Names> {
  return {
    grantPermission(name) {
      permissionStore.set(name, GRANTED);
    },

    denyPermission(name) {
      permissionStore.set(name, DENIED);
    },

    resetPermission(name) {
      permissionStore.set(name, PROMPT);
    },
  };
}

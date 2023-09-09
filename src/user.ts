import { DENIED, GRANTED, PROMPT } from "./constants/permission-state.js";
import { PermissionStore } from "./permission-store.js";
import { HandlePermissionRequest } from "./types/handle-permission-request.js";

export interface User {
  grantPermission(descriptor: PermissionDescriptor): void;
  denyPermission(descriptor: PermissionDescriptor): void;
  resetPermission(descriptor: PermissionDescriptor): void;
  requestPermission: HandlePermissionRequest;
}

export function createUser({
  permissionStore,
  handlePermissionRequest,
}: {
  permissionStore: PermissionStore;
  handlePermissionRequest?: HandlePermissionRequest;
}): User {
  return {
    grantPermission(descriptor) {
      permissionStore.set(descriptor, GRANTED);
    },

    denyPermission(descriptor) {
      permissionStore.set(descriptor, DENIED);
    },

    resetPermission(descriptor) {
      permissionStore.set(descriptor, PROMPT);
    },

    async requestPermission(descriptor) {
      const state = permissionStore.get(descriptor);
      if (state !== PROMPT) return state;

      if (handlePermissionRequest) {
        const nextState = await handlePermissionRequest(descriptor);
        if (nextState !== state) permissionStore.set(descriptor, nextState);

        return nextState;
      }

      permissionStore.set(descriptor, DENIED);

      return DENIED;
    },
  };
}

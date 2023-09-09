import { HandlePermissionRequest } from "./handle-permission-request.js";
import { PermissionStore } from "./permission-store.js";

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
      permissionStore.set(descriptor, "granted");
    },

    denyPermission(descriptor) {
      permissionStore.set(descriptor, "denied");
    },

    resetPermission(descriptor) {
      permissionStore.set(descriptor, "prompt");
    },

    async requestPermission(descriptor) {
      const state = permissionStore.get(descriptor);
      if (state !== "prompt") return state;

      if (handlePermissionRequest) {
        const nextState = await handlePermissionRequest(descriptor);
        if (nextState !== state) permissionStore.set(descriptor, nextState);

        return nextState;
      }

      permissionStore.set(descriptor, "denied");

      return "denied";
    },
  };
}

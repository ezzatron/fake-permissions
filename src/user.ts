import { DENIED, GRANTED, PROMPT } from "./constants/permission-state.js";
import { PermissionStore } from "./permission-store.js";
import { HandlePermissionRequest } from "./types/handle-permission-request.js";
import { PermissionDescriptor } from "./types/permission-descriptor.js";

export interface User<Names extends string> {
  grantPermission(descriptor: PermissionDescriptor<Names>): void;
  denyPermission(descriptor: PermissionDescriptor<Names>): void;
  resetPermission(descriptor: PermissionDescriptor<Names>): void;
  requestPermission: HandlePermissionRequest<Names>;
}

export function createUser<Names extends string>({
  permissionStore,
  handlePermissionRequest,
}: {
  permissionStore: PermissionStore<Names>;
  handlePermissionRequest?: HandlePermissionRequest<Names>;
}): User<Names> {
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

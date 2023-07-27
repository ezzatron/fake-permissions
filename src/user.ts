import { DENIED, GRANTED, PROMPT } from "./constants/permission-state.js";
import { PermissionStore } from "./permission-store.js";
import { PermissionDescriptor } from "./types/permission-descriptor.js";
import { StdPermissionState } from "./types/std.js";

export interface User<Names extends string> {
  grantPermission(descriptor: PermissionDescriptor<Names>): void;
  denyPermission(descriptor: PermissionDescriptor<Names>): void;
  resetPermission(descriptor: PermissionDescriptor<Names>): void;
  requestPermission(descriptor: PermissionDescriptor<Names>): void;
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

    requestPermission(descriptor) {
      const state = permissionStore.get(descriptor);
      if (state !== PROMPT) return;

      if (handlePermissionRequest) {
        const nextState = handlePermissionRequest(descriptor);
        if (nextState !== state) permissionStore.set(descriptor, nextState);
      } else {
        permissionStore.set(descriptor, DENIED);
      }
    },
  };
}

export type HandlePermissionRequest<Names extends string> = (
  descriptor: PermissionDescriptor<Names>,
) => StdPermissionState;

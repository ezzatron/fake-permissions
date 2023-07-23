import { DENIED, GRANTED, PROMPT } from "./constants/permission-state.js";
import { PermissionStore } from "./permission-store.js";
import { StdPermissionState } from "./types/std.js";

export interface User<Names extends string> {
  grantPermission(name: Names): void;
  denyPermission(name: Names): void;
  resetPermission(name: Names): void;
  requestPermission(name: Names): void;
}

export function createUser<Names extends string>({
  permissionStore,
  handlePermissionRequest,
}: {
  permissionStore: PermissionStore<Names>;
  handlePermissionRequest?: HandlePermissionRequest<Names>;
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

    requestPermission(name) {
      const state = permissionStore.get(name);

      if (handlePermissionRequest) {
        const nextState = handlePermissionRequest({ name, state });
        if (nextState !== state) permissionStore.set(name, nextState);
      } else if (state === PROMPT) {
        permissionStore.set(name, DENIED);
      }
    },
  };
}

export type HandlePermissionRequestParameters<Names extends string> = {
  name: Names;
  state: StdPermissionState;
};

export type HandlePermissionRequest<Names extends string> = (
  parameters: HandlePermissionRequestParameters<Names>,
) => StdPermissionState;

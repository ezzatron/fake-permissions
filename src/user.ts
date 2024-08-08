import {
  createAccessDialog,
  type HandleAccessRequest,
} from "./access-dialog.js";
import { byDescriptor } from "./mapping.js";
import { PermissionStore } from "./permission-store.js";

export type User = {
  grantPermission(descriptor: PermissionDescriptor): void;
  denyPermission(descriptor: PermissionDescriptor): void;
  resetPermission(descriptor: PermissionDescriptor): void;
  requestAccess(descriptor: PermissionDescriptor): Promise<boolean>;
  setAccessRequestHandler(toHandler: HandleAccessRequest): void;
};

export function createUser({
  permissionStore,
  dismissDenyThreshold = 3,
  handleAccessRequest = async (dialog) => {
    dialog.dismiss();
  },
}: {
  permissionStore: PermissionStore;
  dismissDenyThreshold?: number;
  handleAccessRequest?: HandleAccessRequest;
}): User {
  const dismissCounts: Map<PermissionDescriptor, number> = new Map();

  return {
    grantPermission(descriptor) {
      permissionStore.setState(descriptor, "granted");
    },

    denyPermission(descriptor) {
      permissionStore.setState(descriptor, "denied");
    },

    resetPermission(descriptor) {
      dismissCounts.set(descriptor, 0);
      permissionStore.setState(descriptor, "prompt");
    },

    async requestAccess(descriptor) {
      const state = permissionStore.getState(descriptor);

      if (state === "granted") return true;
      if (state === "denied") return false;

      const dialog = createAccessDialog();
      await handleAccessRequest(dialog, descriptor);

      if (!dialog.result) {
        if (incrementDismissCount(descriptor) >= dismissDenyThreshold) {
          permissionStore.setState(descriptor, "denied");
        }

        return false;
      }

      const { shouldAllow, shouldPersist } = dialog.result;

      if (shouldPersist) {
        permissionStore.setState(
          descriptor,
          shouldAllow ? "granted" : "denied",
        );
      }

      return shouldAllow;
    },

    setAccessRequestHandler(toHandler) {
      handleAccessRequest = toHandler;
    },
  };

  function incrementDismissCount(descriptor: PermissionDescriptor): number {
    let count = byDescriptor(permissionStore, dismissCounts, descriptor) ?? 0;
    ++count;

    dismissCounts.set(descriptor, count);

    return count;
  }
}

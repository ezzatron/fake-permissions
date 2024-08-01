import {
  createAccessDialog,
  type HandleAccessRequest,
} from "./access-dialog.js";
import { PermissionStore } from "./permission-store.js";

export type User = {
  grantPermission(descriptor: PermissionDescriptor): void;
  denyPermission(descriptor: PermissionDescriptor): void;
  resetPermission(descriptor: PermissionDescriptor): void;
  requestAccess(descriptor: PermissionDescriptor): Promise<boolean>;
};

export function createUser({
  permissionStore,
  handleAccessRequest = async (dialog) => {
    dialog.dismiss();
  },
}: {
  permissionStore: PermissionStore;
  handleAccessRequest?: HandleAccessRequest;
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

    async requestAccess(descriptor) {
      const state = permissionStore.get(descriptor);

      if (state === "granted") return true;
      if (state === "denied") return false;

      const dialog = createAccessDialog();
      await handleAccessRequest(dialog, descriptor);

      if (!dialog.result) return false;

      const { shouldAllow, shouldPersist } = dialog.result;

      if (shouldPersist) {
        permissionStore.set(descriptor, shouldAllow ? "granted" : "denied");
      }

      return shouldAllow;
    },
  };
}

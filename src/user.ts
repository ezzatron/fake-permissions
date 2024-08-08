import { type HandleAccessRequest } from "./access-dialog.js";
import { PermissionStore } from "./permission-store.js";

export type User = {
  grantAccess: (descriptor: PermissionDescriptor) => void;
  blockAccess: (descriptor: PermissionDescriptor) => void;
  resetAccess: (descriptor: PermissionDescriptor) => void;
  setAccessRequestHandler: (toHandler: HandleAccessRequest) => void;
};

export function createUser({
  permissionStore,
  handleAccessRequest,
}: {
  permissionStore: PermissionStore;
  handleAccessRequest?: HandleAccessRequest;
}): User {
  if (handleAccessRequest) {
    permissionStore.setAccessRequestHandler(handleAccessRequest);
  }

  return {
    grantAccess(descriptor) {
      permissionStore.setStatus(descriptor, "GRANTED");
    },

    blockAccess(descriptor) {
      permissionStore.setStatus(descriptor, "BLOCKED");
    },

    resetAccess(descriptor) {
      permissionStore.setStatus(descriptor, "PROMPT");
    },

    setAccessRequestHandler(toHandler) {
      permissionStore.setAccessRequestHandler(toHandler);
    },
  };
}

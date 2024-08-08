import { type HandleAccessRequest } from "./access-dialog.js";
import { PermissionStore } from "./permission-store.js";

export type User = {
  grantPermission(descriptor: PermissionDescriptor): void;
  denyPermission(descriptor: PermissionDescriptor): void;
  resetPermission(descriptor: PermissionDescriptor): void;
  setAccessRequestHandler(toHandler: HandleAccessRequest): void;
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
    grantPermission(descriptor) {
      permissionStore.setState(descriptor, "granted");
    },

    denyPermission(descriptor) {
      permissionStore.setState(descriptor, "denied");
    },

    resetPermission(descriptor) {
      permissionStore.setState(descriptor, "prompt");
    },

    setAccessRequestHandler(toHandler) {
      permissionStore.setAccessRequestHandler(toHandler);
    },
  };
}

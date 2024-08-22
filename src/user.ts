import {
  type AccessDialogResult,
  type HandleAccessRequest,
} from "./access-dialog.js";
import { PermissionStore } from "./permission-store.js";

export type User = {
  grantAccess: (descriptor: PermissionDescriptor) => void;
  blockAccess: (descriptor: PermissionDescriptor) => void;
  resetAccess: (descriptor: PermissionDescriptor) => void;
  setAccessRequestHandler: (toHandler: HandleAccessRequest) => void;
  accessRequests(descriptor?: PermissionDescriptor): AccessRequest[];
  accessRequestCount(descriptor?: PermissionDescriptor): number;
  clearAccessRequests(descriptor?: PermissionDescriptor): void;
};

export type AccessRequest = {
  readonly descriptor: PermissionDescriptor;
  readonly result: AccessDialogResult | undefined;
  readonly isComplete: boolean;
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
  let accessRequests: AccessRequest[] = [];
  setHandler(handleAccessRequest);

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
      setHandler(toHandler);
    },

    accessRequests(descriptor) {
      if (!descriptor) return structuredClone(accessRequests);

      return structuredClone(
        accessRequests.filter((r) =>
          permissionStore.isMatchingDescriptor(descriptor, r.descriptor),
        ),
      );
    },

    accessRequestCount(descriptor) {
      let count = 0;

      for (const r of accessRequests) {
        if (
          !descriptor ||
          permissionStore.isMatchingDescriptor(descriptor, r.descriptor)
        ) {
          ++count;
        }
      }

      return count;
    },

    clearAccessRequests(descriptor) {
      if (descriptor) {
        accessRequests = accessRequests.filter(
          (r) =>
            !permissionStore.isMatchingDescriptor(descriptor, r.descriptor),
        );
      } else {
        accessRequests = [];
      }
    },
  };

  function setHandler(toHandler: HandleAccessRequest): void {
    permissionStore.setAccessRequestHandler(async (dialog, descriptor) => {
      const accessRequest = structuredClone({
        descriptor,
        result: undefined,
        isComplete: false,
      });
      accessRequests.push(accessRequest);

      await toHandler(dialog, descriptor);
      Object.assign(accessRequest, { result: dialog.result, isComplete: true });
    });
  }
}

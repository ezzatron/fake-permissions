import {
  type AccessDialogResult,
  type HandleAccessRequest,
} from "./access-dialog.js";
import { PermissionStore } from "./permission-store.js";

/**
 * A virtual user that can affect the access status of permissions.
 */
export type User = {
  /**
   * Grant access to a permission.
   *
   * This is equivalent to manually allowing access to a permission via the
   * browser's permission settings. Calling this method will immediately set the
   * permission's access status to
   * {@link PermissionAccessStatusGranted | `"GRANTED"`}.
   *
   * @param descriptor - The descriptor of the permission to grant access to.
   */
  grantAccess: (descriptor: PermissionDescriptor) => void;

  /**
   * Block access to a permission.
   *
   * This is equivalent to manually blocking access to a permission via the
   * browser's permission settings. Calling this method will immediately set the
   * permission's access status to
   * {@link PermissionAccessStatusBlocked | `"BLOCKED"`}.
   *
   * @param descriptor - The descriptor of the permission to block access to.
   */
  blockAccess: (descriptor: PermissionDescriptor) => void;

  /**
   * Reset access to a permission.
   *
   * This is equivalent to manually resetting access to a permission via the
   * browser's permission settings. Calling this method will immediately set the
   * permission's access status to
   * {@link PermissionAccessStatusPrompt | `"PROMPT"`}.
   *
   * @param descriptor - The descriptor of the permission to reset access to.
   */
  resetAccess: (descriptor: PermissionDescriptor) => void;

  /**
   * Change the handler used for permission access requests.
   *
   * @param handler - The handler to use.
   */
  setAccessRequestHandler: (handler: HandleAccessRequest) => void;

  /**
   * Get snapshot records of access requests that this user has received.
   *
   * The access request records returned are a snapshot of the access requests
   * received as of now. They are not live records, and will not be updated if
   * the access request is completed later. To get a fresh snapshot of the
   * access requests, call this method again.
   *
   * If `descriptor` is provided, only access requests that match the descriptor
   * will be returned. Otherwise, all access requests will be returned.
   *
   * @param descriptor - The descriptor of the permission to get access requests
   *   for.
   */
  accessRequests(descriptor?: PermissionDescriptor): AccessRequestRecord[];

  /**
   * Get the number of recorded access requests that this user has received.
   *
   * If `descriptor` is provided, only access requests that match the descriptor
   * will be counted. Otherwise, all access requests will be counted.
   *
   * @param descriptor - The descriptor of the permission to get access request
   *   count for.
   */
  accessRequestCount(descriptor?: PermissionDescriptor): number;

  /**
   * Clear recorded access requests that this user has received.
   *
   * If `descriptor` is provided, only access requests that match the descriptor
   * will be cleared. Otherwise, all access requests will be cleared.
   *
   * @param descriptor - The descriptor of the permission to clear access
   *   requests for.
   */
  clearAccessRequests(descriptor?: PermissionDescriptor): void;
};

/**
 * A snapshot record of an access request handled by the user.
 *
 * @see {@link User.accessRequests} to get a snapshot of access requests
 *   received by a user.
 */
export type AccessRequestRecord = {
  /**
   * The descriptor of the permission that was requested.
   */
  readonly descriptor: PermissionDescriptor;

  /**
   * Whether the access request was completed at the time of the snapshot.
   *
   * This is `false` if the access request was still pending, and `true` if the
   * access request was completed (regardless of whether it was dismissed).
   */
  readonly isComplete: boolean;

  /**
   * The result of the access request, if known at the time of the snapshot.
   *
   * This is always `undefined` if the access request was incomplete, but can
   * also be `undefined` if the access request was dismissed.
   */
  readonly result: AccessDialogResult | undefined;
};

/**
 * The parameters for creating a user.
 */
export type UserParameters = {
  /**
   * The permission store to use.
   */
  permissionStore: PermissionStore;

  /**
   * The handler to use for permission access requests.
   *
   * If omitted, permission access requests will be immediately dismissed.
   */
  handleAccessRequest?: HandleAccessRequest;
};

/**
 * Create a virtual user that can affect the access status of permissions.
 *
 * @param params - The parameters for creating the user.
 */
export function createUser(params: UserParameters): User {
  const { permissionStore, handleAccessRequest = async () => {} } = params;
  let accessRequests: AccessRequestRecord[] = [];
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

    setAccessRequestHandler(handler) {
      setHandler(handler);
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

  function setHandler(handler: HandleAccessRequest): void {
    permissionStore.setAccessRequestHandler(async (dialog, descriptor) => {
      const accessRequest = structuredClone({
        descriptor,
        isComplete: false,
        result: undefined,
      });
      accessRequests.push(accessRequest);

      await handler(dialog, descriptor);

      return (result) => {
        Object.assign(accessRequest, { isComplete: true, result });
      };
    });
  }
}

import {
  createAccessDialog,
  type HandleAccessRequest,
} from "./access-dialog.js";

/**
 * A store for managing permission access.
 */
export interface PermissionStore {
  /**
   * Check whether a permission is known to this store.
   *
   * @param descriptor - The descriptor of the permission to check.
   *
   * @returns Whether the permission is known to this store.
   */
  isKnownDescriptor: (descriptor: PermissionDescriptor) => boolean;

  /**
   * Check whether one permission descriptor matches another, according to this
   * store.
   *
   * @param a - The first descriptor to compare.
   * @param b - The second descriptor to compare.
   *
   * @returns Whether the descriptors match.
   *
   * @see {@link PermissionStoreParameters.isMatchingDescriptor} for how to
   *   supply custom matching logic.
   *
   * @inlineType IsMatchingDescriptor
   */
  isMatchingDescriptor: IsMatchingDescriptor;

  /**
   * Get the permission mask of a permission.
   *
   * @param descriptor - The descriptor of the permission.
   *
   * @returns The permission mask of the permission.
   * @throws A {@link TypeError} if the permission is not known to this store.
   */
  getMask: (descriptor: PermissionDescriptor) => PermissionMask;

  /**
   * Get the access status of a permission.
   *
   * @param descriptor - The descriptor of the permission.
   *
   * @returns The access status of the permission.
   * @throws A {@link TypeError} if the permission is not known to this store.
   */
  getStatus: (descriptor: PermissionDescriptor) => PermissionAccessStatus;

  /**
   * Set the access status of a permission.
   *
   * This will also reset the dismissal count for the permission.
   *
   * @param descriptor - The descriptor of the permission.
   * @param status - The new access status.
   *
   * @throws A {@link TypeError} if the permission is not known to this store.
   */
  setStatus: (
    descriptor: PermissionDescriptor,
    status: PermissionAccessStatus,
  ) => void;

  /**
   * Check whether access to a permission is already allowed, without triggering
   * a permission access request.
   *
   * Access is considered allowed if the permission's access status is either
   * {@link PermissionAccessStatusAllowed | `"ALLOWED"`}, or
   * {@link PermissionAccessStatusGranted | `"GRANTED"`}.
   *
   * @param descriptor - The descriptor of the permission to check.
   *
   * @returns Whether access to the permission is allowed.
   * @throws A {@link TypeError} if the permission is not known to this store.
   */
  hasAccess: (descriptor: PermissionDescriptor) => boolean;

  /**
   * Request access to a permission, triggering a permission access request if
   * necessary.
   *
   * If the permission's access status is
   * {@link PermissionAccessStatusPrompt | `"PROMPT"`}, this will trigger a
   * permission access request and wait for the result before returning. The
   * result is determined by the current access request handler, which can be
   * changed by calling {@link PermissionStore.setAccessRequestHandler}.
   *
   * Once any access request is completed, this function will return `true` if
   * the permission's access status is either
   * {@link PermissionAccessStatusAllowed | `"ALLOWED"`}, or
   * {@link PermissionAccessStatusGranted | `"GRANTED"`}.
   *
   * @param descriptor - The descriptor of the permission to request access to.
   *
   * @returns Whether access to the permission is allowed.
   * @throws A {@link TypeError} if the permission is not known to this store.
   */
  requestAccess: (descriptor: PermissionDescriptor) => Promise<boolean>;

  /**
   * Change the handler used for permission access requests.
   *
   * @param handler - The handler to use.
   */
  setAccessRequestHandler: (handler: HandleAccessRequest) => void;

  /**
   * Subscribe to changes in permission access statuses.
   *
   * @param subscriber - A subscriber function that will be called when
   *   permission access statuses change.
   *
   * @returns A function to unsubscribe the subscriber.
   */
  subscribe: (subscriber: PermissionStoreSubscriber) => () => void;
}

/**
 * Check whether one permission descriptor matches another.
 *
 * @param a - The first descriptor to compare.
 * @param b - The second descriptor to compare.
 *
 * @returns Whether the descriptors match.
 *
 * @see {@link PermissionStoreParameters.isMatchingDescriptor} for how to
 *   supply custom matching logic to a permission store.
 * @see {@link isMatchingDescriptor} for the default implementation used by
 *   permission stores.
 */
export type IsMatchingDescriptor = (
  a: PermissionDescriptor,
  b: PermissionDescriptor,
) => boolean;

/**
 * A mapping of {@link PermissionAccessStatus} values to W3C's
 * {@link PermissionState} values.
 *
 * @see {@link PermissionStoreParameters.masks} for more information on how this
 *   mapping is used.
 */
export type PermissionMask = Record<PermissionAccessStatus, PermissionState>;

/**
 * The state of access for a permission.
 */
export interface PermissionAccessState {
  /**
   * The access status of the permission.
   */
  status: PermissionAccessStatus;

  /**
   * The number of times an access request for the permission has been
   * dismissed.
   */
  dismissCount: number;
}

/**
 * The access status of a permission.
 */
export type PermissionAccessStatus =
  | PermissionAccessStatusPrompt
  | PermissionAccessStatusGranted
  | PermissionAccessStatusBlocked
  | PermissionAccessStatusBlockedAutomatically
  | PermissionAccessStatusAllowed
  | PermissionAccessStatusDenied;

/**
 * An access request must be made to gain access.
 */
export type PermissionAccessStatusPrompt = "PROMPT";

/**
 * Access is allowed, and the choice to allow it will be remembered.
 */
export type PermissionAccessStatusGranted = "GRANTED";

/**
 * Access is denied, and the choice to deny it will be remembered.
 */
export type PermissionAccessStatusBlocked = "BLOCKED";

/**
 * Access is denied automatically.
 *
 * This can happen, for example, when too many access requests have been
 * dismissed.
 */
export type PermissionAccessStatusBlockedAutomatically =
  "BLOCKED_AUTOMATICALLY";

/**
 * Access is allowed, but the choice to allow it will not be remembered.
 */
export type PermissionAccessStatusAllowed = "ALLOWED";

/**
 * Access is denied, but the choice to deny it will not be remembered.
 */
export type PermissionAccessStatusDenied = "DENIED";

/**
 * A function that is called when the access status of a permission changes.
 *
 * @param descriptor - The descriptor of the permission that changed.
 * @param details - The details of the change.
 */
export type PermissionStoreSubscriber = (
  descriptor: PermissionDescriptor,
  details: PermissionStoreSubscriberDetails,
) => void;

/**
 * The details of a permission access status change.
 */
export interface PermissionStoreSubscriberDetails {
  /**
   * Whether access is allowed as of the change.
   */
  hasAccess: boolean;

  /**
   * Whether access was allowed before the change.
   */
  hadAccess: boolean;

  /**
   * The new access status of the permission.
   */
  toStatus: PermissionAccessStatus;

  /**
   * The previous access status of the permission.
   */
  fromStatus: PermissionAccessStatus;
}

/**
 * Parameters for creating a permission store.
 *
 * @see {@link createPermissionStore} to create a permission store.
 */
export interface PermissionStoreParameters {
  /**
   * Whether access request dialogs should remember the user's choice by
   * default.
   *
   * @defaultValue `false`
   */
  dialogDefaultRemember?: boolean;

  /**
   * The number of times an access request can be dismissed before the
   * permission is automatically blocked.
   *
   * @defaultValue `3`
   */
  dismissDenyThreshold?: number;

  /**
   * The initial states of permissions in the store, as a map of permission
   * descriptors to their initial access state.
   *
   * As well as setting the initial access states, this also defines the set of
   * permissions that are known to the permission store.
   *
   * States can be specified in full by using {@link PermissionAccessState}
   * objects, or alternatively a {@link PermissionAccessStatus} string can be
   * used, in which case `dismissCount` will initialize to `0`.
   *
   * @defaultValue The result of calling
   *   {@link buildInitialPermissionStates}.
   */
  initialStates?: Map<
    PermissionDescriptor,
    PermissionAccessState | PermissionAccessStatus
  >;

  /**
   * A custom function to determine whether two permission descriptors match.
   *
   * @param a - The first descriptor to compare.
   * @param b - The second descriptor to compare.
   *
   * @returns Whether the descriptors match.
   *
   * @defaultValue {@link isMatchingDescriptor}
   *
   * @inlineType IsMatchingDescriptor
   */
  isMatchingDescriptor?: IsMatchingDescriptor;

  /**
   * Permission masks to apply when mapping {@link PermissionAccessStatus}
   * values to {@link PermissionState} values for various permissions.
   *
   * Internally, this library stores more granular statuses for permissions than
   * what is exposed via the W3C {@link globalThis.Permissions | Permissions}
   * API. This mapping defines how the internal {@link PermissionAccessStatus}
   * values are exposed via the fake
   * {@link globalThis.Permissions | Permissions} API's {@link PermissionState}
   * values.
   *
   * For example, some browsers support allowing one-time access to a
   * permission. This usually results in the {@link PermissionState} remaining
   * as {@link PermissionState | `"prompt"`} even after access has been allowed
   * or denied. In order to emulate this behavior, the default behavior of this
   * library is to use a mask that maps both
   * {@link PermissionAccessStatusAllowed | `"ALLOWED"`} and
   * {@link PermissionAccessStatusDenied | `"DENIED"`} to
   * {@link PermissionState | `"prompt"`}.
   *
   * If no explicit mappings are provided, the default mapping is:
   *
   * | {@link PermissionAccessStatus}                                                 | {@link PermissionState}               |
   * | :----------------------------------------------------------------------------- | :------------------------------------ |
   * | {@link PermissionAccessStatusPrompt | `"PROMPT"`}                              | {@link PermissionState | `"prompt"`}  |
   * | {@link PermissionAccessStatusGranted | `"GRANTED"`}                            | {@link PermissionState | `"granted"`} |
   * | {@link PermissionAccessStatusBlocked | `"BLOCKED"`}                            | {@link PermissionState | `"denied"`}  |
   * | {@link PermissionAccessStatusBlockedAutomatically | `"BLOCKED_AUTOMATICALLY"`} | {@link PermissionState | `"denied"`}  |
   * | {@link PermissionAccessStatusAllowed | `"ALLOWED"`}                            | {@link PermissionState | `"prompt"`}  |
   * | {@link PermissionAccessStatusDenied | `"DENIED"`}                              | {@link PermissionState | `"prompt"`}  |
   */
  masks?: Map<PermissionDescriptor, Partial<PermissionMask>>;
}

/**
 * Create a store for managing permission access.
 *
 * @param params - The parameters for creating the store.
 *
 * @returns A permission store.
 *
 * @inlineType PermissionStoreParameters
 */
export function createPermissionStore(
  params: PermissionStoreParameters = {},
): PermissionStore {
  const {
    dialogDefaultRemember = false,
    dismissDenyThreshold = 3,
    initialStates = buildInitialPermissionStates(),
    isMatchingDescriptor: isMatchingDescriptorFn = isMatchingDescriptor,
    masks = new Map(),
  } = params;

  const states: Map<PermissionDescriptor, PermissionAccessState> = new Map(
    [...initialStates].map(([d, s]) => [
      d,
      typeof s === "string" ? { status: s, dismissCount: 0 } : s,
    ]),
  );
  const subscribers = new Set<PermissionStoreSubscriber>();
  const activeAccessRequests = new Map<
    PermissionDescriptor,
    Promise<boolean>
  >();

  let handleAccessRequest: HandleAccessRequest = async (dialog) => {
    dialog.dismiss();
  };

  return {
    isKnownDescriptor(descriptor) {
      return Boolean(findDescriptor(descriptor));
    },

    isMatchingDescriptor: isMatchingDescriptorFn,

    getMask(descriptor) {
      const [, existing] = resolveState(descriptor);

      for (const [d, v] of masks) {
        if (isMatchingDescriptorFn(existing, d)) return normalizeMask(v);
      }

      return normalizeMask({});
    },

    getStatus(descriptor) {
      const [{ status }] = resolveState(descriptor);

      return status;
    },

    setStatus(descriptor, status) {
      const [fromState, existing] = resolveState(descriptor);

      updateState(existing, { status, dismissCount: 0 }, fromState);
    },

    hasAccess(descriptor) {
      const [{ status }] = resolveState(descriptor);

      return isAllowed(status);
    },

    async requestAccess(descriptor) {
      const [state, existing] = resolveState(descriptor);
      const { status } = state;

      if (status !== "PROMPT") return isAllowed(status);

      return createAccessRequest(existing, state);
    },

    setAccessRequestHandler(handler) {
      handleAccessRequest = handler;
    },

    subscribe(subscriber) {
      subscribers.add(subscriber);

      return () => {
        subscribers.delete(subscriber);
      };
    },
  };

  function findDescriptor(
    query: PermissionDescriptor,
  ): PermissionDescriptor | undefined {
    for (const [descriptor] of states) {
      if (isMatchingDescriptor(descriptor, query)) return descriptor;
    }

    return undefined;
  }

  function resolveState(
    descriptor: PermissionDescriptor,
  ): [PermissionAccessState, PermissionDescriptor] {
    const existing = findDescriptor(descriptor);
    const state = existing && states.get(existing);

    if (!state) {
      throw new TypeError(
        `No permission state for descriptor ${JSON.stringify(descriptor)}`,
      );
    }

    return [state, existing];
  }

  function updateState(
    descriptor: PermissionDescriptor,
    toState: PermissionAccessState,
    fromState: PermissionAccessState,
  ): void {
    states.set(descriptor, toState);

    const toStatus = toState.status;
    const fromStatus = fromState.status;

    if (toStatus === fromStatus) return;

    const hasAccess = isAllowed(toStatus);
    const hadAccess = isAllowed(fromStatus);

    for (const subscriber of subscribers) {
      try {
        subscriber(descriptor, { hasAccess, hadAccess, toStatus, fromStatus });
        /* v8 ignore start: impossible to test under Vitest */
      } catch (error) {
        // Throw subscriber errors asynchronously, so that users will at least
        // see it in the console and notice that their subscriber throws.
        queueMicrotask(() => {
          throw error;
        });
      }
      /* v8 ignore stop */
    }
  }

  function isAllowed(status: PermissionAccessStatus): boolean {
    return status === "ALLOWED" || status === "GRANTED";
  }

  async function createAccessRequest(
    descriptor: PermissionDescriptor,
    state: PermissionAccessState,
  ): Promise<boolean> {
    const active = activeAccessRequests.get(descriptor);

    if (active) return active;

    const request = (async () => {
      const [dialog, getResult] = createAccessDialog(dialogDefaultRemember);
      const handleAccessRequestComplete = await handleAccessRequest(
        dialog,
        structuredClone(descriptor),
      );
      const result = getResult();
      handleAccessRequestComplete?.(result);

      if (!result) {
        const dismissCount = state.dismissCount + 1;

        if (dismissCount >= dismissDenyThreshold) {
          updateState(
            descriptor,
            { status: "BLOCKED_AUTOMATICALLY", dismissCount },
            state,
          );
        } else {
          updateState(descriptor, { status: "PROMPT", dismissCount }, state);
        }

        return false;
      }

      const { shouldAllow, shouldRemember } = result;

      updateState(
        descriptor,
        {
          status: shouldAllow
            ? shouldRemember
              ? "GRANTED"
              : "ALLOWED"
            : shouldRemember
              ? "BLOCKED"
              : "DENIED",
          dismissCount: 0,
        },
        state,
      );

      return shouldAllow;
    })();

    activeAccessRequests.set(descriptor, request);

    return request.finally(() => {
      activeAccessRequests.delete(descriptor);
    });
  }
}

/**
 * Build the standard initial permission state map for a permission store.
 *
 * @returns A map of standard permission descriptors to
 *   {@link PermissionAccessStatusPrompt | `"PROMPT"`}
 */
export function buildInitialPermissionStates(): Map<
  PermissionDescriptor,
  PermissionAccessState | PermissionAccessStatus
> {
  return new Map([
    [{ name: "geolocation" }, "PROMPT"],
    [{ name: "midi", sysex: false } as PermissionDescriptor, "PROMPT"],
    [{ name: "midi", sysex: true } as PermissionDescriptor, "PROMPT"],
    [{ name: "notifications" }, "PROMPT"],
    [{ name: "persistent-storage" }, "PROMPT"],
    [
      { name: "push", userVisibleOnly: false } as PermissionDescriptor,
      "PROMPT",
    ],
    [{ name: "push", userVisibleOnly: true } as PermissionDescriptor, "PROMPT"],
    [{ name: "screen-wake-lock" }, "PROMPT"],
    [{ name: "storage-access" }, "PROMPT"],
  ]);
}

/**
 * The default implementation for matching permission descriptors.
 *
 * For most permissions, this implementation matches descriptors only by their
 * `name` property.
 *
 * For the `midi` permission, `sysex` is also checked, with a missing `sysex`
 * property being treated as `false`.
 *
 * For the `push` permission, `userVisibleOnly` is also checked, with a missing
 * `userVisibleOnly` property being treated as `false`.
 *
 * @param a - The first descriptor to compare.
 * @param b - The second descriptor to compare.
 *
 * @returns Whether the descriptors match.
 *
 * @see {@link PermissionStoreParameters.isMatchingDescriptor} for how to
 *   supply custom matching logic to a permission store.
 */
export function isMatchingDescriptor(
  a: PermissionDescriptor,
  b: PermissionDescriptor,
): boolean {
  if (a.name === "midi" && b.name === "midi") {
    return (
      ("sysex" in a ? a.sysex : false) === ("sysex" in b ? b.sysex : false)
    );
  }

  if (a.name === "push" && b.name === "push") {
    return (
      ("userVisibleOnly" in a ? a.userVisibleOnly : false) ===
      ("userVisibleOnly" in b ? b.userVisibleOnly : false)
    );
  }

  return a.name === b.name;
}

function normalizeMask(mask: Partial<PermissionMask>): PermissionMask {
  return {
    PROMPT: "prompt",
    GRANTED: "granted",
    BLOCKED: "denied",
    BLOCKED_AUTOMATICALLY: "denied",
    ALLOWED: "prompt",
    DENIED: "prompt",
    ...mask,
  };
}

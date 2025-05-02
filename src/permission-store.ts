import {
  createAccessDialog,
  type HandleAccessRequest,
} from "./access-dialog.js";

export type PermissionStore = {
  isKnownDescriptor: (descriptor: PermissionDescriptor) => boolean;
  isMatchingDescriptor: IsMatchingDescriptor;
  getStatus: (descriptor: PermissionDescriptor) => PermissionAccessStatus;
  setStatus: (
    descriptor: PermissionDescriptor,
    toStatus: PermissionAccessStatus,
  ) => void;
  hasAccess: (descriptor: PermissionDescriptor) => boolean;
  requestAccess: (descriptor: PermissionDescriptor) => Promise<boolean>;
  setAccessRequestHandler: (toHandler: HandleAccessRequest) => void;
  subscribe: (subscriber: PermissionStoreSubscriber) => () => void;
};

export type IsMatchingDescriptor = (
  a: PermissionDescriptor,
  b: PermissionDescriptor,
) => boolean;

export type PermissionAccessState = {
  status: PermissionAccessStatus;
  dismissCount: number;
};

export type PermissionAccessStatus =
  | PermissionAccessStatusPrompt
  | PermissionAccessStatusGranted
  | PermissionAccessStatusBlocked
  | PermissionAccessStatusBlockedAutomatically
  | PermissionAccessStatusAllowed
  | PermissionAccessStatusDenied;

export type PermissionAccessStatusPrompt = "PROMPT";
export type PermissionAccessStatusGranted = "GRANTED";
export type PermissionAccessStatusBlocked = "BLOCKED";
export type PermissionAccessStatusBlockedAutomatically =
  "BLOCKED_AUTOMATICALLY";
export type PermissionAccessStatusAllowed = "ALLOWED";
export type PermissionAccessStatusDenied = "DENIED";

export type PermissionStoreSubscriber = (
  descriptor: PermissionDescriptor,
  details: {
    hasAccess: boolean;
    hadAccess: boolean;
    toStatus: PermissionAccessStatus;
    fromStatus: PermissionAccessStatus;
  },
) => void;

export type PermissionStoreParameters = {
  dialogDefaultRemember?: boolean;
  dismissDenyThreshold?: number;
  initialStates?: Map<
    PermissionDescriptor,
    PermissionAccessStatus | PermissionAccessState
  >;
  isMatchingDescriptor?: IsMatchingDescriptor;
};

export function createPermissionStore({
  dialogDefaultRemember = false,
  dismissDenyThreshold = 3,
  initialStates = new Map([
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
  ]),

  isMatchingDescriptor = (a, b) => {
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
  },
}: PermissionStoreParameters = {}): PermissionStore {
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

    isMatchingDescriptor,

    getStatus(descriptor) {
      const [{ status }] = resolveState(descriptor);

      return status;
    },

    setStatus(descriptor, toStatus) {
      const [fromState, existing] = resolveState(descriptor);

      updateState(existing, { status: toStatus, dismissCount: 0 }, fromState);
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

    setAccessRequestHandler(toHandler) {
      handleAccessRequest = toHandler;
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

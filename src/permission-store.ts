import {
  createAccessDialog,
  type HandleAccessRequest,
} from "./access-dialog.js";

export type PermissionStore = {
  isKnownDescriptor: (descriptor: PermissionDescriptor) => boolean;
  isMatchingDescriptor: IsMatchingDescriptor;
  selectByDescriptor: <T>(
    iterable: Iterable<[PermissionDescriptor, T]>,
    descriptor: PermissionDescriptor,
  ) => T | undefined;
  getState: (descriptor: PermissionDescriptor) => PermissionState;
  setState: (
    descriptor: PermissionDescriptor,
    toState: PermissionState,
  ) => void;
  requestAccess: (descriptor: PermissionDescriptor) => Promise<boolean>;
  setAccessRequestHandler: (toHandler: HandleAccessRequest) => void;
  subscribe: (subscriber: Subscriber) => Unsubscribe;
};

export type Unsubscribe = () => void;
export type Subscriber = (
  descriptor: PermissionDescriptor,
  toState: PermissionState,
  fromState: PermissionState,
) => void;

export function createPermissionStore({
  dismissDenyThreshold = 3,
  initialStates = new Map([
    [{ name: "geolocation" }, "prompt"],
    [{ name: "midi", sysex: false } as PermissionDescriptor, "prompt"],
    [{ name: "midi", sysex: true } as PermissionDescriptor, "prompt"],
    [{ name: "notifications" }, "prompt"],
    [{ name: "persistent-storage" }, "prompt"],
    [
      { name: "push", userVisibleOnly: false } as PermissionDescriptor,
      "prompt",
    ],
    [{ name: "push", userVisibleOnly: true } as PermissionDescriptor, "prompt"],
    [{ name: "screen-wake-lock" }, "prompt"],
    [{ name: "storage-access" }, "prompt"],
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
}: {
  dismissDenyThreshold?: number;
  initialStates?: Map<PermissionDescriptor, PermissionState>;
  isMatchingDescriptor?: IsMatchingDescriptor;
} = {}): PermissionStore {
  const states = new Map(initialStates);
  const subscribers = new Set<Subscriber>();
  const dismissCounts: Map<PermissionDescriptor, number> = new Map();

  let handleAccessRequest: HandleAccessRequest = async (dialog) => {
    dialog.dismiss();
  };

  return {
    isKnownDescriptor(descriptor) {
      return Boolean(findDescriptor(descriptor));
    },

    isMatchingDescriptor,

    selectByDescriptor,

    getState(descriptor) {
      const [state] = resolveState(descriptor);

      return state;
    },

    setState(descriptor, toState) {
      const [fromState, existing] = resolveState(descriptor);

      if (fromState === toState) return;

      updateState(existing, toState, fromState);
    },

    async requestAccess(descriptor) {
      const [state, existing] = resolveState(descriptor);

      if (state === "granted") return true;
      if (state === "denied") return false;

      const dialog = createAccessDialog();
      await handleAccessRequest(dialog, structuredClone(existing));

      if (!dialog.result) {
        if (incrementDismissCount(existing) >= dismissDenyThreshold) {
          updateState(existing, "denied", "prompt");
        }

        return false;
      }

      const { shouldAllow, shouldPersist } = dialog.result;

      if (shouldPersist) {
        updateState(existing, shouldAllow ? "granted" : "denied", "prompt");
      }

      return shouldAllow;
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

  function selectByDescriptor<T>(
    iterable: Iterable<[PermissionDescriptor, T]>,
    descriptor: PermissionDescriptor,
  ): T | undefined {
    for (const [d, v] of iterable) {
      if (isMatchingDescriptor(descriptor, d)) return v;
    }

    return undefined;
  }

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
  ): [PermissionState, PermissionDescriptor] {
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
    toState: PermissionState,
    fromState: PermissionState,
  ): void {
    if (toState === "prompt") dismissCounts.set(descriptor, 0);
    states.set(descriptor, toState);
    dispatch(descriptor, toState, fromState);
  }

  function dispatch(
    descriptor: PermissionDescriptor,
    toState: PermissionState,
    fromState: PermissionState,
  ): void {
    for (const subscriber of subscribers) {
      try {
        subscriber(descriptor, toState, fromState);
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

  function incrementDismissCount(descriptor: PermissionDescriptor): number {
    let count = selectByDescriptor(dismissCounts, descriptor) ?? 0;
    ++count;

    dismissCounts.set(descriptor, count);

    return count;
  }
}

type IsMatchingDescriptor = (
  a: PermissionDescriptor,
  b: PermissionDescriptor,
) => boolean;

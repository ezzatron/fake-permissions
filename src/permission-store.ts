type IsMatchingDescriptor = (
  a: PermissionDescriptor,
  b: PermissionDescriptor,
) => boolean;

export type PermissionStore = {
  has(descriptor: PermissionDescriptor): boolean;
  get(descriptor: PermissionDescriptor): PermissionState;
  set(descriptor: PermissionDescriptor, toState: PermissionState): void;
  isMatchingDescriptor: IsMatchingDescriptor;
  subscribe(subscriber: Subscriber): Unsubscribe;
};

export type Unsubscribe = () => void;
export type Subscriber = (
  descriptor: PermissionDescriptor,
  toState: PermissionState,
  fromState: PermissionState,
) => void;

export function createPermissionStore({
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
  initialStates?: Map<PermissionDescriptor, PermissionState>;
  isMatchingDescriptor?: IsMatchingDescriptor;
} = {}): PermissionStore {
  const states = new Map(initialStates);
  const subscribers = new Set<Subscriber>();

  return {
    has(descriptor) {
      return Boolean(find(descriptor));
    },

    get(descriptor) {
      const existing = find(descriptor);
      const state = existing && states.get(existing);

      if (!state) {
        throw new TypeError(
          `No permission state for descriptor ${JSON.stringify(descriptor)}`,
        );
      }

      return state;
    },

    set(descriptor, toState) {
      const existing = find(descriptor);
      const fromState = existing && states.get(existing);

      if (!fromState) {
        throw new TypeError(
          `No permission state for descriptor ${JSON.stringify(descriptor)}`,
        );
      }

      if (fromState === toState) return;

      states.set(existing, toState);
      dispatch(existing, toState, fromState);
    },

    isMatchingDescriptor,

    subscribe(subscriber) {
      subscribers.add(subscriber);

      return () => {
        subscribers.delete(subscriber);
      };
    },
  };

  function find(query: PermissionDescriptor) {
    for (const [descriptor] of states) {
      if (isMatchingDescriptor(descriptor, query)) return descriptor;
    }

    return undefined;
  }

  function dispatch(
    descriptor: PermissionDescriptor,
    toState: PermissionState,
    fromState: PermissionState,
  ) {
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
}

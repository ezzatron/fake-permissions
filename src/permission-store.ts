export type PermissionStore = {
  has(descriptor: PermissionDescriptor): boolean;
  get(descriptor: PermissionDescriptor): PermissionState;
  set(descriptor: PermissionDescriptor, state: PermissionState): void;
  subscribe(subscriber: Subscriber): void;
  unsubscribe(subscriber: Subscriber): void;
};

export function createPermissionStore({
  initialStates = new Map([
    [{ name: "geolocation" }, "prompt"],
    [{ name: "notifications" }, "prompt"],
    [{ name: "persistent-storage" }, "prompt"],
    [
      { name: "push", userVisibleOnly: false } as PermissionDescriptor,
      "prompt",
    ],
    [{ name: "push", userVisibleOnly: true } as PermissionDescriptor, "prompt"],
    [{ name: "screen-wake-lock" }, "prompt"],
    [{ name: "xr-spatial-tracking" }, "prompt"],
  ]),

  isMatchingDescriptor = (a, b) => {
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
  isMatchingDescriptor?: (
    a: PermissionDescriptor,
    b: PermissionDescriptor,
  ) => boolean;
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

    set(descriptor, state) {
      const existing = find(descriptor);

      if (!existing) {
        throw new TypeError(
          `No permission state for descriptor ${JSON.stringify(descriptor)}`,
        );
      }

      states.set(existing, state);
      dispatch(existing);
    },

    subscribe(subscriber) {
      subscribers.add(subscriber);
    },

    unsubscribe(subscriber) {
      subscribers.delete(subscriber);
    },
  };

  function find(query: PermissionDescriptor) {
    for (const [descriptor] of states) {
      if (isMatchingDescriptor(descriptor, query)) return descriptor;
    }

    return undefined;
  }

  function dispatch(descriptor: PermissionDescriptor) {
    const isMatching = isMatchingDescriptor.bind(null, descriptor);

    for (const subscriber of subscribers) {
      try {
        subscriber(isMatching);
        /* v8 ignore start: impossible to test under Vitest */
      } catch (error) {
        // Throw subscriber errors asynchronously, so that users will at least
        // see it in the console and notice that their subscriber throws.
        setTimeout(() => {
          throw error;
        }, 0);
      }
      /* v8 ignore stop */
    }
  }
}

type Subscriber = (
  isMatchingDescriptor: (descriptor: PermissionDescriptor) => boolean,
) => void;

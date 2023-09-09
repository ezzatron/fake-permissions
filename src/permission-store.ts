import * as permissionNames from "./constants/permission-name.js";
import { PUSH } from "./constants/permission-name.js";
import { PROMPT } from "./constants/permission-state.js";

export interface PermissionStore {
  has(descriptor: PermissionDescriptor): boolean;
  get(descriptor: PermissionDescriptor): PermissionState;
  set(descriptor: PermissionDescriptor, state: PermissionState): void;
  subscribe(subscriber: Subscriber): void;
  unsubscribe(subscriber: Subscriber): void;
}

export function createPermissionStore({
  initialStates,
  isMatchingDescriptor = (a, b) => a.name === b.name,
}: {
  initialStates: Map<PermissionDescriptor, PermissionState>;
  isMatchingDescriptor?: (
    a: PermissionDescriptor,
    b: PermissionDescriptor,
  ) => boolean;
}): PermissionStore {
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
      } catch {
        // ignored
      }
    }
  }
}

export function createStandardPermissionStore(): PermissionStore {
  const genericPermissionNames = Object.values(permissionNames).filter(
    (name) => name !== PUSH,
  );
  const genericEntries = genericPermissionNames.map(
    (name) => [{ name }, PROMPT] as const,
  );

  return createPermissionStore({
    initialStates: new Map([
      ...genericEntries,
      [{ name: PUSH, userVisibleOnly: false } as PermissionDescriptor, PROMPT],
      [{ name: PUSH, userVisibleOnly: true } as PermissionDescriptor, PROMPT],
    ]),

    isMatchingDescriptor(a, b) {
      if (a.name === PUSH && b.name === PUSH) {
        // a.userVisibleOnly is always present (comes from an initialStates key)
        return (
          "userVisibleOnly" in a &&
          a.userVisibleOnly ===
            ("userVisibleOnly" in b ? b.userVisibleOnly : false)
        );
      }

      return a.name === b.name;
    },
  });
}

type Subscriber = (
  isMatchingDescriptor: (descriptor: PermissionDescriptor) => boolean,
) => void;

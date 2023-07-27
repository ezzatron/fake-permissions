import * as permissionNames from "./constants/permission-name.js";
import { MIDI, PUSH } from "./constants/permission-name.js";
import { PROMPT } from "./constants/permission-state.js";
import { PermissionDescriptor } from "./types/permission-descriptor.js";
import { PermissionName } from "./types/permission-name.js";
import { StdPermissionState } from "./types/std.js";

export interface PermissionStore<Names extends string> {
  has(descriptor: PermissionDescriptor<Names>): boolean;
  get(descriptor: PermissionDescriptor<Names>): StdPermissionState;
  set(descriptor: PermissionDescriptor<Names>, state: StdPermissionState): void;
  subscribe(subscriber: Subscriber<Names>): void;
  unsubscribe(subscriber: Subscriber<Names>): void;
}

export function createPermissionStore<Names extends string>({
  initialStates,
  isMatchingDescriptor = (a, b) => a.name === b.name,
}: {
  initialStates: Map<PermissionDescriptor<Names>, StdPermissionState>;
  isMatchingDescriptor?: (
    a: PermissionDescriptor<Names>,
    b: PermissionDescriptor<Names>,
  ) => boolean;
}): PermissionStore<Names> {
  const states = new Map(initialStates);
  const subscribers = new Set<Subscriber<Names>>();

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

  function find(query: PermissionDescriptor<Names>) {
    for (const [descriptor] of states) {
      if (isMatchingDescriptor(descriptor, query)) return descriptor;
    }

    return undefined;
  }

  function dispatch(descriptor: PermissionDescriptor<Names>) {
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

export function createStandardPermissionStore(): PermissionStore<PermissionName> {
  const genericPermissionNames = Object.values(permissionNames).filter(
    (name) => name !== MIDI && name !== PUSH,
  );
  const genericEntries = genericPermissionNames.map(
    (name) =>
      [{ name } as PermissionDescriptor<PermissionName>, PROMPT] as const,
  );

  return createPermissionStore({
    initialStates: new Map([
      ...genericEntries,
      [{ name: MIDI, sysex: false }, PROMPT],
      [{ name: MIDI, sysex: true }, PROMPT],
      [{ name: PUSH, userVisibleOnly: false }, PROMPT],
      [{ name: PUSH, userVisibleOnly: true }, PROMPT],
    ]),

    isMatchingDescriptor(a, b) {
      if (a.name === MIDI && b.name === MIDI) {
        // a.sysex is always present (comes from an initialStates key)
        return a.sysex === (b.sysex ?? false);
      }

      if (a.name === PUSH && b.name === PUSH) {
        // a.userVisibleOnly is always present (comes from an initialStates key)
        return a.userVisibleOnly === (b.userVisibleOnly ?? false);
      }

      return a.name === b.name;
    },
  });
}

type Subscriber<Names extends string> = (
  isMatchingDescriptor: (descriptor: PermissionDescriptor<Names>) => boolean,
) => void;

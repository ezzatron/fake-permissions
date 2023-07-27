import * as permissionNames from "./constants/permission-name.js";
import { PROMPT } from "./constants/permission-state.js";
import { PermissionName } from "./types/permission-name.js";
import { StdPermissionState } from "./types/std.js";

export interface PermissionStore<Names extends string> {
  has(name: Names): boolean;
  get(name: Names): StdPermissionState;
  set(name: Names, state: StdPermissionState): void;
  subscribe(subscriber: Subscriber): void;
  unsubscribe(subscriber: Subscriber): void;
}

export function createStandardPermissionStore(): PermissionStore<PermissionName> {
  return createPermissionStore({
    initialStates: Object.fromEntries(
      Object.values(permissionNames).map((name) => [name, PROMPT]),
    ),
  });
}

export function createPermissionStore<Names extends string>({
  initialStates,
}: {
  initialStates: Record<Names, StdPermissionState>;
}): PermissionStore<Names> {
  const states = { ...initialStates };
  const subscribers = new Set<Subscriber>();

  return {
    has(name) {
      return name in states;
    },

    get(name) {
      return states[name];
    },

    set(name, state) {
      states[name] = state;
      dispatch(name);
    },

    subscribe(subscriber) {
      subscribers.add(subscriber);
    },

    unsubscribe(subscriber) {
      subscribers.delete(subscriber);
    },
  };

  function dispatch(name: Names) {
    for (const subscriber of subscribers) {
      try {
        subscriber(name);
      } catch {
        // ignored
      }
    }
  }
}

type Subscriber = (name: string) => void;

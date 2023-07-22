import { StdPermissionState } from "./types/std.js";

export interface PermissionStore<Names extends string> {
  has(name: Names): boolean;
  get(name: Names): StdPermissionState;
  set(name: Names, state: StdPermissionState): void;
  subscribe(subscriber: Subscriber): Unsubscribe;
}

export function createPermissionStore<Names extends string>({
  initialStates,
}: {
  initialStates: Record<Names, StdPermissionState>;
}): PermissionStore<Names> {
  const states = { ...initialStates };
  const subscribers = new Set<Subscriber>();

  return {
    has(name: Names): boolean {
      return name in states;
    },

    get(name: Names): StdPermissionState {
      return states[name];
    },

    set(name: Names, state: StdPermissionState): void {
      states[name] = state;
      dispatch(name);
    },

    subscribe(subscriber: Subscriber): Unsubscribe {
      subscribers.add(subscriber);

      return () => {
        subscribers.delete(subscriber);
      };
    },
  };

  function dispatch(name: Names): void {
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
type Unsubscribe = () => void;

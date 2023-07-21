import { StdPermissionState } from "./types/std.js";

export interface PermissionStore<Names extends string> {
  has(name: Names): boolean;
  get(name: Names): StdPermissionState;
  set(name: Names, state: StdPermissionState): void;
  subscribe(handler: SubscribeHandler): UnsubscribeFn;
}

export function createPermissionStore<Names extends string>({
  initialStates,
}: {
  initialStates: Record<Names, StdPermissionState>;
}): PermissionStore<Names> {
  const states = { ...initialStates };
  const subscribers = new Set<SubscribeHandler>();

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

    subscribe(handler: SubscribeHandler): UnsubscribeFn {
      subscribers.add(handler);

      return () => {
        subscribers.delete(handler);
      };
    },
  };

  function dispatch(name: Names): void {
    for (const handler of subscribers) {
      try {
        handler(name);
      } catch {
        // ignored
      }
    }
  }
}

type SubscribeHandler = (name: string) => void;
type UnsubscribeFn = () => void;

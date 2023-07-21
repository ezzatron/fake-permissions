import { StdPermissionState } from "./types/std.js";

export interface PermissionStore<Names extends string> {
  has(name: Names): boolean;
  get(name: Names): StdPermissionState;
  set(name: Names, state: StdPermissionState): void;
}

export function createPermissionStore<Names extends string>({
  initialStates,
}: {
  initialStates: Record<Names, StdPermissionState>;
}): PermissionStore<Names> {
  const states = { ...initialStates };

  return {
    has(name: Names): boolean {
      return name in states;
    },

    get(name: Names): StdPermissionState {
      return states[name];
    },

    set(name: Names, state: StdPermissionState): void {
      states[name] = state;
    },
  };
}

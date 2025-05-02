import type { NonEmptyPermissionStateArray } from "./permission-state.js";

export type PermissionObserver = {
  waitForState: (
    stateOrStates: PermissionState | NonEmptyPermissionStateArray,
    task?: () => Promise<void>,
  ) => Promise<void>;
};

export function createPermissionObserver(
  permissions: Permissions,
  descriptor: PermissionDescriptor,
): PermissionObserver {
  return {
    async waitForState(stateOrStates, task) {
      const states = normalizeStates(stateOrStates);

      if (states.length < 1) throw new Error("No states provided");

      const status = await permissions.query(descriptor);

      if (states.includes(status.state)) return;

      await Promise.all([
        new Promise<void>((resolve) => {
          status.addEventListener("change", onChange);

          function onChange() {
            if (states.length > 0 && !states.includes(status.state)) return;

            status.removeEventListener("change", onChange);
            resolve();
          }
        }),
        Promise.resolve(task?.()),
      ]);
    },
  };
}

function normalizeStates(
  states: PermissionState | PermissionState[],
): PermissionState[] {
  return Array.isArray(states) ? states : [states];
}

/**
 * An observer for permission state changes.
 */
export interface PermissionObserver {
  /**
   * Wait for the permission state to change to one of the specified states.
   *
   * @param stateOrStates - The desired permission state(s).
   * @param task - An optional task to execute while waiting for the state
   *   change. You can use this to guarantee that certain actions are performed
   *   after observation has started.
   *
   * @returns A promise that resolves when the permission state matches one of
   *   the desired states. If the state is already one of the desired states,
   *   the promise resolves immediately.
   */
  waitForState: (
    stateOrStates: PermissionState | PermissionState[],
    task?: () => Promise<void>,
  ) => Promise<void>;
}

/**
 * Create an observer for a permission.
 *
 * @param permissions - The Permissions API to use.
 * @param descriptor - A descriptor of the permission to observe.
 *
 * @returns An observer for the permission.
 */
export function createPermissionObserver(
  permissions: Permissions,
  descriptor: PermissionDescriptor,
): PermissionObserver {
  return {
    async waitForState(stateOrStates, task) {
      const states = normalizeStates(stateOrStates);

      if (states.length < 1) throw new Error("No states provided");

      const status = await permissions.query(descriptor);

      if (states.includes(status.state)) {
        if (task) await task();

        return;
      }

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

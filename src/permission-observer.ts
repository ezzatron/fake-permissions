export type PermissionObserver = {
  waitForState: (
    states: PermissionState | NonEmptyPermissionStateArray,
    task?: () => Promise<void>,
  ) => Promise<void>;
  waitForStateChange: (
    states?: PermissionState | PermissionState[],
    task?: () => Promise<void>,
  ) => Promise<void>;
};

export async function createPermissionObserver(
  permissions: Permissions,
  descriptor: PermissionDescriptor,
): Promise<PermissionObserver> {
  const status = await permissions.query(descriptor);

  return {
    async waitForState(states, task) {
      states = normalizeStates(states);

      if (states.length < 1) throw new Error("No states provided");
      if (states.includes(status.state)) return;

      await waitForStateChange(states, task);
    },

    waitForStateChange,
  };

  async function waitForStateChange(
    states: PermissionState | PermissionState[] = [],
    task?: () => Promise<void>,
  ) {
    states = normalizeStates(states);

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
  }
}

type NonEmptyPermissionStateArray = PermissionState[] & { 0: PermissionState };

function normalizeStates(
  states: PermissionState | PermissionState[],
): NonEmptyPermissionStateArray {
  return (
    Array.isArray(states) ? states : [states]
  ) as NonEmptyPermissionStateArray;
}
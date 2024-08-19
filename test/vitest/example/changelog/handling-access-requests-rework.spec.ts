import {
  createPermissions,
  createPermissionStore,
  createUser,
} from "fake-permissions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.mocked(console.log).mockRestore();
});

describe("Handling access requests (rework)", () => {
  it("works", async () => {
    const permissionStore = createPermissionStore({
      initialStates: new Map([
        // Set the initial status of the "geolocation" permission to "PROMPT"
        [{ name: "geolocation" }, "PROMPT"],
        // Set the initial status of the "notifications" permission to "PROMPT"
        [{ name: "notifications" }, "PROMPT"],
      ]),
    });
    const permissions = createPermissions({ permissionStore });

    createUser({
      permissionStore,

      handleAccessRequest: async (dialog, descriptor) => {
        // Allow access to geolocation, but don't change permission state
        if (descriptor.name === "geolocation") {
          // This is equivalent to the old dialog.allow(false)
          dialog.allow();

          return;
        }

        // Deny access to notifications, and change permission state to "denied"
        if (descriptor.name === "notifications") {
          // This is equivalent to the old dialog.deny(true)
          dialog.remember(true);
          dialog.deny();

          return;
        }

        dialog.dismiss();
      },
    });

    const geolocation = await permissions.query({ name: "geolocation" });
    const notifications = await permissions.query({ name: "notifications" });

    // Outputs "true, prompt"
    console.log(
      await permissionStore.requestAccess({ name: "geolocation" }),
      geolocation.state,
    );

    // Outputs "false, denied"
    console.log(
      await permissionStore.requestAccess({ name: "notifications" }),
      notifications.state,
    );

    expect(vi.mocked(console.log).mock.calls).toEqual([
      [true, "prompt"],
      [false, "denied"],
    ]);
  });
});

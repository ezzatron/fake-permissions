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

describe("Handling access requests", () => {
  it("works", async () => {
    const permissionStore = createPermissionStore({
      initialStates: new Map([
        // Set the initial state of the "geolocation" permission to "prompt"
        [{ name: "geolocation" }, "prompt"],
        // Set the initial state of the "notifications" permission to "prompt"
        [{ name: "notifications" }, "prompt"],
      ]),
    });
    const permissions = createPermissions({ permissionStore });

    const user = createUser({
      permissionStore,

      // The number of times the user can dismiss a permission dialog before the
      // permission state is set to "denied" automatically (default: 3)
      dismissDenyThreshold: Infinity,

      handleAccessRequest: async (dialog, descriptor) => {
        // Allow access to geolocation, but don't change permission state
        if (descriptor.name === "geolocation") {
          dialog.allow(false);

          return;
        }

        // Deny access to notifications, and change permission state to "denied"
        if (descriptor.name === "notifications") {
          dialog.deny(true);

          return;
        }

        dialog.dismiss();
      },
    });

    const geolocation = await permissions.query({ name: "geolocation" });
    const notifications = await permissions.query({ name: "notifications" });

    // Outputs "true, prompt"
    console.log(
      await user.requestAccess({ name: "geolocation" }),
      geolocation.state,
    );

    // Outputs "false, denied"
    console.log(
      await user.requestAccess({ name: "notifications" }),
      notifications.state,
    );

    user.resetPermission({ name: "geolocation" });

    user.setAccessRequestHandler(async (dialog) => {
      // New behavior for handling access requests
      dialog.dismiss();
    });

    // Outputs "false, prompt"
    console.log(
      await user.requestAccess({ name: "geolocation" }),
      geolocation.state,
    );

    expect(vi.mocked(console.log).mock.calls).toEqual([
      [true, "prompt"],
      [false, "denied"],
      [false, "prompt"],
    ]);
  });
});
import { createPermissionStore, createUser } from "fake-permissions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.mocked(console.log).mockRestore();
});

describe("Access request recording", () => {
  it("works", async () => {
    const permissionStore = createPermissionStore({
      initialStates: new Map([
        // Set the initial status of the "geolocation" permission to "PROMPT"
        [{ name: "geolocation" }, "PROMPT"],
        // Set the initial status of the "notifications" permission to "PROMPT"
        [{ name: "notifications" }, "PROMPT"],
      ]),
    });

    const user = createUser({
      permissionStore,

      handleAccessRequest: async (dialog, descriptor) => {
        // Allow permanent access to geolocation
        if (descriptor.name === "geolocation") {
          dialog.remember(true);
          dialog.allow();

          return;
        }

        // Dismiss access dialogs for other permissions
        dialog.dismiss();
      },
    });

    // Request geolocation access twice
    await permissionStore.requestAccess({ name: "geolocation" });
    await permissionStore.requestAccess({ name: "geolocation" });
    // Outputs "1"
    console.log(user.accessRequestCount({ name: "geolocation" }));
    // Outputs "[
    //   {
    //     descriptor: { name: 'geolocation' },
    //     result: { shouldAllow: true, shouldRemember: true },
    //     isComplete: true
    //   }
    // ]"
    console.log(user.accessRequests({ name: "geolocation" }));

    // Request notifications access twice
    await permissionStore.requestAccess({ name: "notifications" });
    await permissionStore.requestAccess({ name: "notifications" });
    // Outputs "2"
    console.log(user.accessRequestCount({ name: "notifications" }));
    // Outputs "[
    //   {
    //     descriptor: { name: 'notifications' },
    //     result: undefined,
    //     isComplete: true
    //   },
    //   {
    //     descriptor: { name: 'notifications' },
    //     result: undefined,
    //     isComplete: true
    //   }
    // ]"
    console.log(user.accessRequests({ name: "notifications" }));

    // Outputs "3" (total for all descriptors)
    console.log(user.accessRequestCount());
    // Outputs "[
    //   {
    //     descriptor: { name: 'geolocation' },
    //     result: { shouldAllow: true, shouldRemember: true },
    //     isComplete: true
    //   },
    //   {
    //     descriptor: { name: 'notifications' },
    //     result: undefined,
    //     isComplete: true
    //   },
    //   {
    //     descriptor: { name: 'notifications' },
    //     result: undefined,
    //     isComplete: true
    //   }
    // ]"
    console.log(user.accessRequests());

    // Clear access requests for geolocation
    user.clearAccessRequests({ name: "geolocation" });
    // Outputs "0"
    console.log(user.accessRequestCount({ name: "geolocation" }));
    // Outputs "[]"
    console.log(user.accessRequests({ name: "geolocation" }));

    // Clear access requests for all descriptors
    user.clearAccessRequests();
    // Outputs "0"
    console.log(user.accessRequestCount());
    // Outputs "[]"
    console.log(user.accessRequests());

    expect(vi.mocked(console.log).mock.calls).toEqual([
      [1],
      [
        [
          {
            descriptor: { name: "geolocation" },
            result: {
              shouldAllow: true,
              shouldRemember: true,
            },
            isComplete: true,
          },
        ],
      ],
      [2],
      [
        [
          {
            descriptor: { name: "notifications" },
            result: undefined,
            isComplete: true,
          },
          {
            descriptor: { name: "notifications" },
            result: undefined,
            isComplete: true,
          },
        ],
      ],
      [3],
      [
        [
          {
            descriptor: { name: "geolocation" },
            result: {
              shouldAllow: true,
              shouldRemember: true,
            },
            isComplete: true,
          },
          {
            descriptor: { name: "notifications" },
            result: undefined,
            isComplete: true,
          },
          {
            descriptor: { name: "notifications" },
            result: undefined,
            isComplete: true,
          },
        ],
      ],
      [0],
      [[]],
      [0],
      [[]],
    ]);
  });
});

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

describe("Permission masking", () => {
  it("works", async () => {
    const permissionStore = createPermissionStore({
      initialStates: new Map([
        // Set the initial status of the "geolocation" permission to "PROMPT"
        [{ name: "geolocation" }, "PROMPT"],
      ]),
    });
    const user = createUser({ permissionStore });

    const permissions = createPermissions({
      permissionStore,
      mask: new Map([
        [
          // Mask the "geolocation" permission
          { name: "geolocation" },
          {
            // When the actual state is "denied", report it as "prompt"
            denied: "prompt",

            // Can mask multiple states if desired
            // granted: "prompt",
          },
        ],
      ]),
    });

    const status = await permissions.query({ name: "geolocation" });
    console.log(status.state); // Outputs "prompt"

    user.blockAccess({ name: "geolocation" });
    console.log(status.state); // Outputs "prompt"

    user.grantAccess({ name: "geolocation" });
    console.log(status.state); // Outputs "granted"

    expect(vi.mocked(console.log).mock.calls).toEqual([
      ["prompt"],
      ["prompt"],
      ["granted"],
    ]);
  });
});

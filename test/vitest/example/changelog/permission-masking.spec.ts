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
      masks: new Map([
        [
          // Mask the "geolocation" permission
          { name: "geolocation" },
          {
            // When the actual status is "BLOCKED" or "BLOCKED_AUTOMATICALLY",
            // report it as the "prompt" state
            BLOCKED: "prompt",
            BLOCKED_AUTOMATICALLY: "prompt",

            // Can mask other statuses if desired
            // GRANTED: "prompt",
          },
        ],
      ]),
    });
    const permissions = createPermissions({ permissionStore });
    const user = createUser({ permissionStore });

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

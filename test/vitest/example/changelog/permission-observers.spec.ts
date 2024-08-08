import {
  createPermissionObserver,
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

describe("Permission observers", () => {
  it("works", async () => {
    const permissionStore = createPermissionStore({
      initialStates: new Map([
        // Set the initial status of the "geolocation" permission to "PROMPT"
        [{ name: "geolocation" }, "PROMPT"],
      ]),
    });
    const user = createUser({ permissionStore });
    const permissions = createPermissions({ permissionStore });

    // We're dealing with the "geolocation" permission
    const descriptor: PermissionDescriptor = { name: "geolocation" };

    // Start a Permissions API query
    const status = await permissions.query(descriptor);

    // Start observing the permission
    const observer = createPermissionObserver(permissions, descriptor);

    // Wait for the state to be "prompt"
    await observer.waitForState("prompt");
    // Outputs "prompt"
    console.log(status.state);

    user.blockAccess(descriptor);

    // Wait for the state to be "prompt" OR "denied"
    await observer.waitForState(["prompt", "denied"]);
    // Outputs "denied"
    console.log(status.state);

    // Wait for the state to be "granted", while running a task
    await observer.waitForState("granted", async () => {
      user.grantAccess(descriptor);
    });
    // Outputs "granted"
    console.log(status.state);

    // Wait for the state to be "prompt" OR "denied", while running a task
    await observer.waitForState(["prompt", "denied"], async () => {
      user.resetAccess(descriptor);
    });
    // Outputs "prompt"
    console.log(status.state);

    expect(vi.mocked(console.log).mock.calls).toEqual([
      ["prompt"],
      ["denied"],
      ["granted"],
      ["prompt"],
    ]);
  });
});

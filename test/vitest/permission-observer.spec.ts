import {
  createPermissionObserver,
  createPermissions,
  createPermissionStore,
  type PermissionObserver,
  type PermissionStore,
} from "fake-permissions";
import { beforeEach, describe, expect, it } from "vitest";

describe("PermissionObserver", () => {
  const permissionA: PermissionDescriptor = {
    name: "permission-a" as PermissionName,
  };

  let permissionStore: PermissionStore;
  let status: PermissionStatus;
  let observer: PermissionObserver;

  beforeEach(async () => {
    permissionStore = createPermissionStore({
      initialStates: new Map([[permissionA, "prompt"]]),
    });
    const permissions = createPermissions({ permissionStore });
    status = await permissions.query(permissionA);
    observer = createPermissionObserver(permissions, permissionA);
  });

  describe("waitForState()", () => {
    describe("when called with no states", () => {
      it("throws", async () => {
        // @ts-expect-error - Testing invalid input
        await expect(observer.waitForState([])).rejects.toThrow(
          "No states provided",
        );
      });
    });

    describe("when called with a single state", () => {
      it("resolves when the permission state already matches the desired state", async () => {
        await expect(observer.waitForState("prompt")).resolves.toBeUndefined();
      });

      it("resolves when the permission state changes to the desired state", async () => {
        let isResolved = false;
        const promise = observer.waitForState("granted").then(() => {
          isResolved = true;

          return;
        });
        await Promise.resolve();

        expect(isResolved).toBe(false);

        permissionStore.set(permissionA, "granted");

        await expect(promise).resolves.toBeUndefined();
        expect(status.state).toBe("granted");
      });

      it("doesn't resolve when the permission state changes to a different state", async () => {
        let isResolved = false;
        const promise = observer.waitForState("granted").then(() => {
          isResolved = true;

          return;
        });
        await Promise.resolve();

        expect(isResolved).toBe(false);

        permissionStore.set(permissionA, "denied");
        await Promise.resolve();

        expect(isResolved).toBe(false);

        permissionStore.set(permissionA, "granted");

        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe("when called with multiple states", () => {
      it("resolves when the permission state already matches any of the desired states", async () => {
        await expect(
          observer.waitForState(["prompt", "granted"]),
        ).resolves.toBeUndefined();
        await expect(
          observer.waitForState(["denied", "prompt"]),
        ).resolves.toBeUndefined();
      });

      it("resolves when the permission state changes to any of the desired states", async () => {
        let isResolved = false;
        const promise = observer
          .waitForState(["denied", "granted"])
          .then(() => {
            isResolved = true;

            return;
          });
        await Promise.resolve();

        expect(isResolved).toBe(false);

        permissionStore.set(permissionA, "granted");

        await expect(promise).resolves.toBeUndefined();
        expect(status.state).toBe("granted");
      });
    });

    describe("when called with an async task function", () => {
      it("runs the task while waiting", async () => {
        await expect(
          observer.waitForState("granted", async () => {
            permissionStore.set(permissionA, "granted");
          }),
        ).resolves.toBeUndefined();
        expect(status.state).toBe("granted");
      });
    });
  });
});

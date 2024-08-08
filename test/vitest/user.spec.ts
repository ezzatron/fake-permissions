import {
  PermissionStore,
  createPermissionStore,
  createUser,
} from "fake-permissions";
import { beforeEach, describe, expect, it } from "vitest";

describe("User", () => {
  const permissionA: PermissionDescriptor = {
    name: "permission-a" as PermissionName,
  };
  const permissionB: PermissionDescriptor = {
    name: "permission-b" as PermissionName,
  };
  const permissionC: PermissionDescriptor = {
    name: "permission-c" as PermissionName,
  };

  let permissionStore: PermissionStore;

  beforeEach(() => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [permissionA, "prompt"],
        [permissionB, "granted"],
        [permissionC, "denied"],
      ]),
    });
  });

  describe("grantPermission()", () => {
    it("grants the permission", () => {
      const user = createUser({ permissionStore });
      user.grantPermission(permissionA);

      expect(permissionStore.getState(permissionA)).toBe("granted");
    });
  });

  describe("denyPermission()", () => {
    it("denies the permission", () => {
      const user = createUser({ permissionStore });
      user.denyPermission(permissionA);

      expect(permissionStore.getState(permissionA)).toBe("denied");
    });
  });

  describe("resetPermission()", () => {
    it("resets the permission", () => {
      const user = createUser({ permissionStore });
      user.resetPermission(permissionB);

      expect(permissionStore.getState(permissionB)).toBe("prompt");
    });
  });

  describe("setAccessRequestHandler()", () => {
    it("handles access requests with the handler", async () => {
      const user = createUser({ permissionStore });
      user.setAccessRequestHandler(async (dialog) => {
        dialog.allow(true);
      });

      await expect(permissionStore.requestAccess(permissionA)).resolves.toBe(
        true,
      );
      expect(permissionStore.getState(permissionA)).toBe("granted");
    });
  });

  describe("when configured with an access request handler", () => {
    it("handles access requests with the handler", async () => {
      createUser({
        permissionStore,
        handleAccessRequest: async (dialog) => {
          dialog.allow(true);
        },
      });

      await expect(permissionStore.requestAccess(permissionA)).resolves.toBe(
        true,
      );
      expect(permissionStore.getState(permissionA)).toBe("granted");
    });
  });
});

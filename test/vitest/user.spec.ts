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

  let permissionStore: PermissionStore;

  beforeEach(() => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [permissionA, "PROMPT"],
        [permissionB, "GRANTED"],
      ]),
    });
  });

  describe("grantAccess()", () => {
    it("changes the permission to GRANTED", () => {
      const user = createUser({ permissionStore });
      user.grantAccess(permissionA);

      expect(permissionStore.getStatus(permissionA)).toBe("GRANTED");
    });
  });

  describe("blockAccess()", () => {
    it("changes the permission to BLOCKED", () => {
      const user = createUser({ permissionStore });
      user.blockAccess(permissionA);

      expect(permissionStore.getStatus(permissionA)).toBe("BLOCKED");
    });
  });

  describe("resetAccess()", () => {
    it("changes the permission to PROMPT", () => {
      const user = createUser({ permissionStore });
      user.resetAccess(permissionB);

      expect(permissionStore.getStatus(permissionB)).toBe("PROMPT");
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
      expect(permissionStore.getStatus(permissionA)).toBe("GRANTED");
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
      expect(permissionStore.getStatus(permissionA)).toBe("GRANTED");
    });
  });
});

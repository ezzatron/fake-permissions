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
        [permissionA, "PROMPT"],
        [permissionB, "GRANTED"],
        [permissionC, "PROMPT"],
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
        dialog.remember(true);
        dialog.allow();
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
          dialog.remember(true);
          dialog.allow();
        },
      });

      await expect(permissionStore.requestAccess(permissionA)).resolves.toBe(
        true,
      );
      expect(permissionStore.getStatus(permissionA)).toBe("GRANTED");
    });
  });

  it("records access requests", async () => {
    const user = createUser({ permissionStore });
    user.setAccessRequestHandler(async (dialog, descriptor) => {
      if (descriptor.name === ("permission-a" as PermissionName)) {
        dialog.allow();
      } else {
        dialog.dismiss();
      }
    });

    await permissionStore.requestAccess(permissionA);
    await permissionStore.requestAccess(permissionA);
    await permissionStore.requestAccess(permissionB);
    await permissionStore.requestAccess(permissionC);
    await permissionStore.requestAccess(permissionC);

    expect(user.accessRequestCount(permissionA)).toBe(1);
    expect(user.accessRequests(permissionA)).toEqual([
      {
        descriptor: permissionA,
        result: { shouldAllow: true, shouldRemember: false },
      },
    ]);

    expect(user.accessRequestCount(permissionB)).toBe(0);
    expect(user.accessRequests(permissionB)).toEqual([]);

    expect(user.accessRequestCount(permissionC)).toBe(2);
    expect(user.accessRequests(permissionC)).toEqual([
      {
        descriptor: permissionC,
        result: undefined,
      },
      {
        descriptor: permissionC,
        result: undefined,
      },
    ]);

    expect(user.accessRequestCount()).toBe(3);
    expect(user.accessRequests()).toEqual([
      {
        descriptor: permissionA,
        result: { shouldAllow: true, shouldRemember: false },
      },
      {
        descriptor: permissionC,
        result: undefined,
      },
      {
        descriptor: permissionC,
        result: undefined,
      },
    ]);
  });

  it("can have the recorded access requests cleared", async () => {
    const user = createUser({ permissionStore });

    await permissionStore.requestAccess(permissionA);
    await permissionStore.requestAccess(permissionA);
    await permissionStore.requestAccess(permissionC);

    expect(user.accessRequestCount(permissionA)).toBe(2);
    expect(user.accessRequestCount(permissionC)).toBe(1);

    user.clearAccessRequests(permissionA);

    expect(user.accessRequestCount(permissionA)).toBe(0);
    expect(user.accessRequestCount(permissionC)).toBe(1);

    user.clearAccessRequests();

    expect(user.accessRequestCount()).toBe(0);
    expect(user.accessRequests()).toEqual([]);
  });

  it("handles concurrent access requests", async () => {
    const user = createUser({ permissionStore });

    const { promise, resolve } = Promise.withResolvers<void>();
    user.setAccessRequestHandler(async (dialog, descriptor) => {
      await promise;

      if (descriptor.name === ("permission-a" as PermissionName)) {
        dialog.allow();
      } else {
        dialog.dismiss();
      }
    });

    const [
      isAllowedA1,
      isAllowedA2,
      isAllowedC1,
      isAllowedC2,
      isAllowedC3,
      isAllowedC4,
    ] = await Promise.all([
      permissionStore.requestAccess(permissionA),
      permissionStore.requestAccess(permissionA),
      permissionStore.requestAccess(permissionC),
      permissionStore.requestAccess(permissionC),
      permissionStore.requestAccess(permissionC),
      permissionStore.requestAccess(permissionC),
      (async () => {
        resolve();
      })(),
    ]);

    expect(isAllowedA1).toBe(true);
    expect(isAllowedA2).toBe(true);
    expect(isAllowedC1).toBe(false);
    expect(isAllowedC2).toBe(false);
    expect(isAllowedC3).toBe(false);
    expect(isAllowedC4).toBe(false);
    expect(user.accessRequests()).toEqual([
      {
        descriptor: permissionA,
        result: { shouldAllow: true, shouldRemember: false },
      },
      {
        descriptor: permissionC,
        result: undefined,
      },
    ]);
    expect(permissionStore.getStatus(permissionA)).toBe("ALLOWED");
    expect(permissionStore.getStatus(permissionC)).toBe("PROMPT");
  });
});

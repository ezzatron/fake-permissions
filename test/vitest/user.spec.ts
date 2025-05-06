import {
  createPermissionStore,
  createUser,
  type PermissionStore,
} from "fake-permissions";
import { beforeEach, describe, expect, it } from "vitest";
import { promiseWithResolvers } from "../async.js";

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
        isComplete: true,
      },
    ]);

    expect(user.accessRequestCount(permissionB)).toBe(0);
    expect(user.accessRequests(permissionB)).toEqual([]);

    expect(user.accessRequestCount(permissionC)).toBe(2);
    expect(user.accessRequests(permissionC)).toEqual([
      {
        descriptor: permissionC,
        result: undefined,
        isComplete: true,
      },
      {
        descriptor: permissionC,
        result: undefined,
        isComplete: true,
      },
    ]);

    expect(user.accessRequestCount()).toBe(3);
    expect(user.accessRequests()).toEqual([
      {
        descriptor: permissionA,
        result: { shouldAllow: true, shouldRemember: false },
        isComplete: true,
      },
      {
        descriptor: permissionC,
        result: undefined,
        isComplete: true,
      },
      {
        descriptor: permissionC,
        result: undefined,
        isComplete: true,
      },
    ]);
  });

  it("records access requests before the result is known", async () => {
    const user = createUser({ permissionStore });

    const { promise, resolve } = promiseWithResolvers<void>();
    user.setAccessRequestHandler(async (dialog) => {
      await promise;
      dialog.allow();
    });

    const accessRequest = permissionStore.requestAccess(permissionA);

    expect(user.accessRequestCount()).toBe(1);
    expect(user.accessRequests()).toEqual([
      {
        descriptor: permissionA,
        result: undefined,
        isComplete: false,
      },
    ]);

    resolve();
    await accessRequest;

    expect(user.accessRequestCount()).toBe(1);
    expect(user.accessRequests()).toEqual([
      {
        descriptor: permissionA,
        result: { shouldAllow: true, shouldRemember: false },
        isComplete: true,
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

    const { promise, resolve } = promiseWithResolvers<void>();
    user.setAccessRequestHandler(async (dialog, descriptor) => {
      await promise;

      if (descriptor.name === ("permission-a" as PermissionName)) {
        dialog.allow();
      } else {
        dialog.dismiss();
      }
    });

    const accessRequests = [
      permissionStore.requestAccess(permissionA),
      permissionStore.requestAccess(permissionA),
      permissionStore.requestAccess(permissionC),
      permissionStore.requestAccess(permissionC),
      permissionStore.requestAccess(permissionC),
      permissionStore.requestAccess(permissionC),
    ];

    expect(user.accessRequests()).toEqual([
      {
        descriptor: permissionA,
        result: undefined,
        isComplete: false,
      },
      {
        descriptor: permissionC,
        result: undefined,
        isComplete: false,
      },
    ]);

    const [
      isAllowedA1,
      isAllowedA2,
      isAllowedC1,
      isAllowedC2,
      isAllowedC3,
      isAllowedC4,
    ] = await Promise.all([
      ...accessRequests,
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
        isComplete: true,
      },
      {
        descriptor: permissionC,
        result: undefined,
        isComplete: true,
      },
    ]);
    expect(permissionStore.getStatus(permissionA)).toBe("ALLOWED");
    expect(permissionStore.getStatus(permissionC)).toBe("PROMPT");
  });
});

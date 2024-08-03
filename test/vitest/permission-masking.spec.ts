import {
  PermissionStore,
  User,
  createPermissionStore,
  createPermissions,
  createUser,
} from "fake-permissions";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

describe("Permission masking", () => {
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

  let user: User;
  let permissions: Permissions;
  let statusA: PermissionStatus;
  let statusB: PermissionStatus;
  let statusC: PermissionStatus;

  beforeEach(async () => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [permissionA, "prompt"],
        [permissionB, "prompt"],
        [permissionC, "prompt"],
      ]),
    });

    user = createUser({ permissionStore });
    permissions = createPermissions({
      mask: new Map([
        [
          permissionB,
          {
            denied: "prompt",
          },
        ],
        [
          permissionC,
          {
            granted: "prompt",
            prompt: "denied",
          },
        ],
      ]),
      permissionStore,
    });

    statusA = await permissions.query(structuredClone(permissionA));
    statusB = await permissions.query(structuredClone(permissionB));
    statusC = await permissions.query(structuredClone(permissionC));
  });

  it("affects masked permission states", async () => {
    user.denyPermission(permissionB);
    user.grantPermission(permissionC);

    expect(statusB.state).toBe("prompt");
    expect(statusC.state).toBe("prompt");

    user.resetPermission(permissionC);

    expect(statusC.state).toBe("denied");
  });

  it("doesn't affect unmasked permission states", async () => {
    expect(statusA.state).toBe("prompt");
    expect(statusB.state).toBe("prompt");

    user.denyPermission(permissionA);
    user.grantPermission(permissionB);

    expect(statusA.state).toBe("denied");
    expect(statusB.state).toBe("granted");
  });

  describe("when a change event listener is added", () => {
    let listener: Mock;

    beforeEach(() => {
      listener = vi.fn();
      statusA.addEventListener("change", listener);
      statusB.addEventListener("change", listener);
      statusC.addEventListener("change", listener);
    });

    afterEach(() => {
      statusA.removeEventListener("change", listener);
      statusB.removeEventListener("change", listener);
      statusC.removeEventListener("change", listener);
    });

    describe("when a permission state change results in the same permission after masking", () => {
      beforeEach(() => {
        // "prompt" is unmapped for permissionB
        user.resetPermission(permissionB);
        // "denied" is unmapped for permissionC
        user.denyPermission(permissionC);

        listener.mockClear();

        // "denied" is mapped to "prompt" for permissionB
        user.denyPermission(permissionB);
        // "prompt" is mapped to "denied" for permissionC
        user.resetPermission(permissionC);
      });

      it("does not dispatch an event to the listener", () => {
        expect(listener).toBeCalledTimes(0);
      });
    });

    describe("when a permission state change results in a different permission after masking", () => {
      beforeEach(() => {
        // unmapped -> unmapped
        user.grantPermission(permissionB);
        // mapped -> mapped
        user.grantPermission(permissionC);
        // mapped -> unmapped
        user.denyPermission(permissionC);
      });

      it("dispatches an event to the listener", () => {
        expect(listener).toBeCalledTimes(3);
      });
    });
  });
});

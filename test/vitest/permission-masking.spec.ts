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
        [permissionA, "PROMPT"],
        [permissionB, "PROMPT"],
        [permissionC, "PROMPT"],
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

  it("affects masked permission states", () => {
    user.blockAccess(permissionB);
    user.grantAccess(permissionC);

    expect(statusB.state).toBe("prompt");
    expect(statusC.state).toBe("prompt");

    user.resetAccess(permissionC);

    expect(statusC.state).toBe("denied");
  });

  it("doesn't affect unmasked permission states", () => {
    expect(statusA.state).toBe("prompt");
    expect(statusB.state).toBe("prompt");

    user.blockAccess(permissionA);
    user.grantAccess(permissionB);

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
        user.resetAccess(permissionB);
        // "denied" is unmapped for permissionC
        user.blockAccess(permissionC);

        listener.mockClear();

        // "denied" is mapped to "prompt" for permissionB
        user.blockAccess(permissionB);
        // "prompt" is mapped to "denied" for permissionC
        user.resetAccess(permissionC);
      });

      it("does not dispatch an event to the listener", () => {
        expect(listener).toBeCalledTimes(0);
      });
    });

    describe("when a permission state change results in a different permission after masking", () => {
      beforeEach(() => {
        // unmapped -> unmapped
        user.grantAccess(permissionB);
        // mapped -> mapped
        user.grantAccess(permissionC);
        // mapped -> unmapped
        user.blockAccess(permissionC);
      });

      it("dispatches an event to the listener", () => {
        expect(listener).toBeCalledTimes(3);
      });
    });
  });
});

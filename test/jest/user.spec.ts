import { jest } from "@jest/globals";
import {
  HandlePermissionRequest,
  PermissionStore,
  User,
  createPermissionStore,
  createUser,
} from "../../src/index.js";

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
  let user: User;

  beforeEach(() => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [permissionA, "prompt"],
        [permissionB, "granted"],
        [permissionC, "denied"],
      ]),
    });
  });

  describe("when no permission request callback is configured", () => {
    beforeEach(() => {
      user = createUser({ permissionStore });
    });

    describe('when a permission in the "prompt" state is requested', () => {
      it("denies the permission", async () => {
        expect(await user.requestPermission(permissionA)).toBe("denied");
        expect(permissionStore.get(permissionA)).toBe("denied");
      });
    });

    describe('when a permission in the "granted" state is requested', () => {
      it("leaves the permission granted", async () => {
        expect(await user.requestPermission(permissionB)).toBe("granted");
        expect(permissionStore.get(permissionB)).toBe("granted");
      });
    });

    describe('when a permission in the "denied" state is requested', () => {
      it("leaves the permission denied", async () => {
        expect(await user.requestPermission(permissionC)).toBe("denied");
        expect(permissionStore.get(permissionC)).toBe("denied");
      });
    });
  });

  describe("when a permission request callback is configured", () => {
    let handlePermissionRequest: jest.Mock<HandlePermissionRequest>;

    beforeEach(() => {
      handlePermissionRequest = jest.fn(
        async () => "granted" as PermissionState,
      );

      user = createUser({ permissionStore, handlePermissionRequest });
    });

    describe('when a permission in the "prompt" state is requested', () => {
      it("calls the callback with the permission descriptor", async () => {
        await user.requestPermission(permissionA);

        expect(handlePermissionRequest).toHaveBeenCalledWith({
          name: "permission-a",
        });
      });

      it("updates the permission state with the callback's return value", async () => {
        expect(await user.requestPermission(permissionA)).toBe("granted");
        expect(permissionStore.get(permissionA)).toBe("granted");
      });
    });

    describe('when a permission in the "granted" state is requested', () => {
      it("does not call the callback", async () => {
        await user.requestPermission(permissionB);

        expect(handlePermissionRequest).not.toHaveBeenCalled();
      });

      it("leaves the permission granted", async () => {
        expect(await user.requestPermission(permissionB)).toBe("granted");
        expect(permissionStore.get(permissionB)).toBe("granted");
      });
    });

    describe('when a permission in the "denied" state is requested', () => {
      it("does not call the callback", async () => {
        await user.requestPermission(permissionC);

        expect(handlePermissionRequest).not.toHaveBeenCalled();
      });

      it("leaves the permission denied", async () => {
        expect(await user.requestPermission(permissionC)).toBe("denied");
        expect(permissionStore.get(permissionC)).toBe("denied");
      });
    });
  });
});

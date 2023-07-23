import { jest } from "@jest/globals";
import {
  DENIED,
  GRANTED,
  PROMPT,
} from "../../src/constants/permission-state.js";
import {
  HandlePermissionRequest,
  PermissionStore,
  User,
  createPermissionStore,
  createUser,
} from "../../src/index.js";

type Names = "permission-a" | "permission-b" | "permission-c";

describe("User", () => {
  let permissionStore: PermissionStore<Names>;
  let user: User<Names>;

  beforeEach(() => {
    permissionStore = createPermissionStore({
      initialStates: {
        "permission-a": PROMPT,
        "permission-b": GRANTED,
        "permission-c": DENIED,
      },
    });
  });

  describe("when no permission request callback is configured", () => {
    beforeEach(() => {
      user = createUser({ permissionStore });
    });

    describe('when a permission in the "prompt" state is requested', () => {
      beforeEach(() => {
        user.requestPermission("permission-a");
      });

      it("denies the permission", () => {
        expect(permissionStore.get("permission-a")).toBe(DENIED);
      });
    });

    describe('when a permission in the "granted" state is requested', () => {
      beforeEach(() => {
        user.requestPermission("permission-b");
      });

      it("leaves the permission granted", () => {
        expect(permissionStore.get("permission-b")).toBe(GRANTED);
      });
    });

    describe('when a permission in the "denied" state is requested', () => {
      beforeEach(() => {
        user.requestPermission("permission-c");
      });

      it("leaves the permission denied", () => {
        expect(permissionStore.get("permission-c")).toBe(DENIED);
      });
    });
  });

  describe("when a permission request callback is configured", () => {
    let handlePermissionRequest: jest.Mock<HandlePermissionRequest<Names>>;

    beforeEach(() => {
      handlePermissionRequest = jest.fn(() => GRANTED);

      user = createUser({ permissionStore, handlePermissionRequest });
    });

    describe("when a permission is requested", () => {
      beforeEach(() => {
        user.requestPermission("permission-a");
        user.requestPermission("permission-b");
        user.requestPermission("permission-c");
      });

      it("calls the callback with the permission name and state", () => {
        expect(handlePermissionRequest).toHaveBeenCalledWith({
          name: "permission-a",
          state: PROMPT,
        });
        expect(handlePermissionRequest).toHaveBeenCalledWith({
          name: "permission-b",
          state: GRANTED,
        });
        expect(handlePermissionRequest).toHaveBeenCalledWith({
          name: "permission-c",
          state: DENIED,
        });
      });

      it("updates the permission state with the callback's return value", () => {
        expect(permissionStore.get("permission-a")).toBe(GRANTED);
        expect(permissionStore.get("permission-b")).toBe(GRANTED);
        expect(permissionStore.get("permission-c")).toBe(GRANTED);
      });
    });
  });
});

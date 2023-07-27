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
      initialStates: new Map([
        [{ name: "permission-a" }, PROMPT],
        [{ name: "permission-b" }, GRANTED],
        [{ name: "permission-c" }, DENIED],
      ]),
    });
  });

  describe("when no permission request callback is configured", () => {
    beforeEach(() => {
      user = createUser({ permissionStore });
    });

    describe('when a permission in the "prompt" state is requested', () => {
      beforeEach(() => {
        user.requestPermission({ name: "permission-a" });
      });

      it("denies the permission", () => {
        expect(permissionStore.get({ name: "permission-a" })).toBe(DENIED);
      });
    });

    describe('when a permission in the "granted" state is requested', () => {
      beforeEach(() => {
        user.requestPermission({ name: "permission-b" });
      });

      it("leaves the permission granted", () => {
        expect(permissionStore.get({ name: "permission-b" })).toBe(GRANTED);
      });
    });

    describe('when a permission in the "denied" state is requested', () => {
      beforeEach(() => {
        user.requestPermission({ name: "permission-c" });
      });

      it("leaves the permission denied", () => {
        expect(permissionStore.get({ name: "permission-c" })).toBe(DENIED);
      });
    });
  });

  describe("when a permission request callback is configured", () => {
    let handlePermissionRequest: jest.Mock<HandlePermissionRequest<Names>>;

    beforeEach(() => {
      handlePermissionRequest = jest.fn(() => GRANTED);

      user = createUser({ permissionStore, handlePermissionRequest });
    });

    describe('when a permission in the "prompt" state is requested', () => {
      beforeEach(() => {
        user.requestPermission({ name: "permission-a" });
      });

      it("calls the callback with the permission descriptor", () => {
        expect(handlePermissionRequest).toHaveBeenCalledWith({
          name: "permission-a",
        });
      });

      it("updates the permission state with the callback's return value", () => {
        expect(permissionStore.get({ name: "permission-a" })).toBe(GRANTED);
      });
    });

    describe('when a permission in the "granted" state is requested', () => {
      beforeEach(() => {
        user.requestPermission({ name: "permission-b" });
      });

      it("does not call the callback", () => {
        expect(handlePermissionRequest).not.toHaveBeenCalled();
      });

      it("leaves the permission granted", () => {
        expect(permissionStore.get({ name: "permission-b" })).toBe(GRANTED);
      });
    });

    describe('when a permission in the "denied" state is requested', () => {
      beforeEach(() => {
        user.requestPermission({ name: "permission-c" });
      });

      it("does not call the callback", () => {
        expect(handlePermissionRequest).not.toHaveBeenCalled();
      });

      it("leaves the permission denied", () => {
        expect(permissionStore.get({ name: "permission-c" })).toBe(DENIED);
      });
    });
  });
});

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
import { StdPermissionState } from "../../src/types/std.js";

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
      it("denies the permission", async () => {
        expect(await user.requestPermission({ name: "permission-a" })).toBe(
          DENIED,
        );
        expect(permissionStore.get({ name: "permission-a" })).toBe(DENIED);
      });
    });

    describe('when a permission in the "granted" state is requested', () => {
      it("leaves the permission granted", async () => {
        expect(await user.requestPermission({ name: "permission-b" })).toBe(
          GRANTED,
        );
        expect(permissionStore.get({ name: "permission-b" })).toBe(GRANTED);
      });
    });

    describe('when a permission in the "denied" state is requested', () => {
      it("leaves the permission denied", async () => {
        expect(await user.requestPermission({ name: "permission-c" })).toBe(
          DENIED,
        );
        expect(permissionStore.get({ name: "permission-c" })).toBe(DENIED);
      });
    });
  });

  describe("when a permission request callback is configured", () => {
    let handlePermissionRequest: jest.Mock<HandlePermissionRequest<Names>>;

    beforeEach(() => {
      handlePermissionRequest = jest.fn(
        async () => GRANTED as StdPermissionState,
      );

      user = createUser({ permissionStore, handlePermissionRequest });
    });

    describe('when a permission in the "prompt" state is requested', () => {
      it("calls the callback with the permission descriptor", async () => {
        await user.requestPermission({ name: "permission-a" });

        expect(handlePermissionRequest).toHaveBeenCalledWith({
          name: "permission-a",
        });
      });

      it("updates the permission state with the callback's return value", async () => {
        expect(await user.requestPermission({ name: "permission-a" })).toBe(
          GRANTED,
        );
        expect(permissionStore.get({ name: "permission-a" })).toBe(GRANTED);
      });
    });

    describe('when a permission in the "granted" state is requested', () => {
      it("does not call the callback", async () => {
        await user.requestPermission({ name: "permission-b" });

        expect(handlePermissionRequest).not.toHaveBeenCalled();
      });

      it("leaves the permission granted", async () => {
        expect(await user.requestPermission({ name: "permission-b" })).toBe(
          GRANTED,
        );
        expect(permissionStore.get({ name: "permission-b" })).toBe(GRANTED);
      });
    });

    describe('when a permission in the "denied" state is requested', () => {
      it("does not call the callback", async () => {
        await user.requestPermission({ name: "permission-c" });

        expect(handlePermissionRequest).not.toHaveBeenCalled();
      });

      it("leaves the permission denied", async () => {
        expect(await user.requestPermission({ name: "permission-c" })).toBe(
          DENIED,
        );
        expect(permissionStore.get({ name: "permission-c" })).toBe(DENIED);
      });
    });
  });
});

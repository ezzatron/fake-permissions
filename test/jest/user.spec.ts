import {
  DENIED,
  GRANTED,
  PROMPT,
} from "../../src/constants/permission-state.js";
import {
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

  describe("when no prompt response is configured", () => {
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
});

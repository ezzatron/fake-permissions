import { jest } from "@jest/globals";
import {
  DENIED,
  GRANTED,
  PROMPT,
} from "../../src/constants/permission-state.js";
import {
  PermissionStatus,
  Permissions,
  User,
  createPermissionStore,
  createPermissions,
  createUser,
} from "../../src/index.js";

type Names = "permission-a" | "permission-b" | "permission-c";

describe("PermissionStatus", () => {
  let user: User<Names>;
  let permissions: Permissions<Names>;
  let statusA: PermissionStatus<"permission-a">;
  let statusB: PermissionStatus<"permission-b">;
  let statusC: PermissionStatus<"permission-c">;

  beforeEach(async () => {
    const permissionStore = createPermissionStore({
      initialStates: {
        "permission-a": PROMPT,
        "permission-b": GRANTED,
        "permission-c": DENIED,
      },
    });

    user = createUser({ permissionStore });
    permissions = createPermissions({ permissionStore });

    statusA = await permissions.query({ name: "permission-a" });
    statusB = await permissions.query({ name: "permission-b" });
    statusC = await permissions.query({ name: "permission-c" });
  });

  it("cannot be instantiated", () => {
    const permissionStore = createPermissionStore({ initialStates: {} });
    const call = () => {
      new PermissionStatus({ name: "permission-a", permissionStore });
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });

  it("has a name that matches the queried permission name", async () => {
    expect(statusA.name).toBe("permission-a");
    expect(statusB.name).toBe("permission-b");
  });

  it("has an initial state that matches the permission set", async () => {
    expect(statusA.state).toBe(PROMPT);
    expect(statusB.state).toBe(GRANTED);
  });

  describe("when the user changes the permission state", () => {
    beforeEach(async () => {
      user.grantPermission("permission-a");
      user.denyPermission("permission-b");
      user.resetPermission("permission-c");
    });

    it("has a state that matches the new state", () => {
      expect(statusA.state).toBe(GRANTED);
      expect(statusB.state).toBe(DENIED);
      expect(statusC.state).toBe(PROMPT);
    });
  });

  describe("when a change event listener is added by calling addEventListener()", () => {
    let listener: jest.Mock;

    beforeEach(() => {
      listener = jest.fn();
      statusA.addEventListener("change", listener);
      statusB.addEventListener("change", listener);
      statusC.addEventListener("change", listener);
    });

    afterEach(() => {
      statusA.removeEventListener("change", listener);
      statusB.removeEventListener("change", listener);
      statusC.removeEventListener("change", listener);
    });

    describe("when the user changes the permission state", () => {
      beforeEach(async () => {
        user.grantPermission("permission-a");
        user.denyPermission("permission-b");
        user.resetPermission("permission-c");
      });

      it("dispatches an event", () => {
        expect(listener).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe("when a change event listener is added by setting onchange", () => {
    let listenerA: jest.Mock;

    beforeEach(() => {
      listenerA = jest.fn();

      statusA.onchange = listenerA;
      statusB.onchange = listenerA;
      statusC.onchange = listenerA;
    });

    afterEach(() => {
      statusA.onchange = null;
      statusB.onchange = null;
      statusC.onchange = null;
    });

    it("can be read", () => {
      expect(statusA.onchange).toBe(listenerA);
    });

    describe("when the user changes the permission state", () => {
      beforeEach(async () => {
        user.grantPermission("permission-a");
        user.denyPermission("permission-b");
        user.resetPermission("permission-c");
      });

      it("dispatches an event", () => {
        expect(listenerA).toHaveBeenCalledTimes(3);
      });
    });

    describe("when onchange is set to a different listener", () => {
      let listenerB: jest.Mock;

      beforeEach(() => {
        listenerB = jest.fn();

        statusA.onchange = listenerB;
        statusB.onchange = listenerB;
        statusC.onchange = listenerB;
      });

      describe("when the user changes the permission state", () => {
        beforeEach(async () => {
          user.grantPermission("permission-a");
          user.denyPermission("permission-b");
          user.resetPermission("permission-c");
        });

        it("does not dispatch an event to the old listener", () => {
          expect(listenerA).toHaveBeenCalledTimes(0);
        });

        it("dispatches an event to the new listener", () => {
          expect(listenerB).toHaveBeenCalledTimes(3);
        });
      });
    });
  });
});

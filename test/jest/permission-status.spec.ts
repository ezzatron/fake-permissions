import { jest } from "@jest/globals";
import {
  DENIED,
  GRANTED,
  PROMPT,
} from "../../src/constants/permission-state.js";
import {
  PermissionStatus,
  PermissionStore,
  Permissions,
  User,
  createPermissionStore,
  createPermissions,
  createUser,
} from "../../src/index.js";

type Names = "permission-a" | "permission-b" | "permission-c";

describe("PermissionStatus", () => {
  let permissionStore: PermissionStore<Names>;
  let subscribe: jest.SpiedFunction<typeof permissionStore.subscribe>;

  let user: User<Names>;
  let permissions: Permissions<Names>;
  let statusA: PermissionStatus<"permission-a">;
  let statusB: PermissionStatus<"permission-b">;
  let statusC: PermissionStatus<"permission-c">;

  beforeEach(async () => {
    permissionStore = createPermissionStore({
      initialStates: {
        "permission-a": PROMPT,
        "permission-b": GRANTED,
        "permission-c": DENIED,
      },
    });
    subscribe = jest.spyOn(permissionStore, "subscribe");

    user = createUser({ permissionStore });
    permissions = createPermissions({ permissionStore });

    statusA = await permissions.query({ name: "permission-a" });
    statusB = await permissions.query({ name: "permission-b" });
    statusC = await permissions.query({ name: "permission-c" });
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

  describe("before adding a change event listener", () => {
    it("does not subscribe to the permission store", () => {
      expect(subscribe).not.toHaveBeenCalled();
    });
  });

  describe("when a change event listener is added by setting onchange", () => {
    let listenerA: jest.Mock;
    let listenerB: jest.Mock;

    beforeEach(() => {
      listenerA = jest.fn();
      listenerB = jest.fn();

      statusA.onchange = listenerA;
      statusB.onchange = listenerA;
      statusC.onchange = listenerA;
    });

    afterEach(() => {
      statusA.onchange = null;
      statusB.onchange = null;
      statusC.onchange = null;
    });

    it("subscribes to the permission store", () => {
      expect(subscribe).toHaveBeenCalledTimes(3);
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

      it("dispatches an event to the listener", () => {
        expect(listenerA).toHaveBeenCalledTimes(3);
      });
    });

    describe("when onchange is set to a different listener", () => {
      beforeEach(() => {
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

    it("subscribes to the permission store", () => {
      expect(subscribe).toHaveBeenCalledTimes(3);
    });

    describe("when the user changes the permission state", () => {
      beforeEach(async () => {
        user.grantPermission("permission-a");
        user.denyPermission("permission-b");
        user.resetPermission("permission-c");
      });

      it("dispatches an event to the listener", () => {
        expect(listener).toHaveBeenCalledTimes(3);
      });
    });

    describe("when the listener is added again", () => {
      beforeEach(() => {
        statusA.addEventListener("change", listener);
        statusB.addEventListener("change", listener);
        statusC.addEventListener("change", listener);
      });

      describe("when the user changes the permission state", () => {
        beforeEach(async () => {
          user.grantPermission("permission-a");
          user.denyPermission("permission-b");
          user.resetPermission("permission-c");
        });

        it("dispatches an event to the listener only once", () => {
          expect(listener).toHaveBeenCalledTimes(3);
        });
      });
    });

    describe("when the listener is removed", () => {
      beforeEach(() => {
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

        it("does not dispatch an event to the listener", () => {
          expect(listener).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe("when an object-based change event listener is added by calling addEventListener()", () => {
    let listener: { handleEvent: jest.Mock };

    beforeEach(() => {
      listener = { handleEvent: jest.fn() };
      statusA.addEventListener("change", listener);
      statusB.addEventListener("change", listener);
      statusC.addEventListener("change", listener);
    });

    afterEach(() => {
      statusA.removeEventListener("change", listener);
      statusB.removeEventListener("change", listener);
      statusC.removeEventListener("change", listener);
    });

    it("subscribes to the permission store", () => {
      expect(subscribe).toHaveBeenCalledTimes(3);
    });

    describe("when the user changes the permission state", () => {
      beforeEach(async () => {
        user.grantPermission("permission-a");
        user.denyPermission("permission-b");
        user.resetPermission("permission-c");
      });

      it("dispatches an event to the listener", () => {
        expect(listener.handleEvent).toHaveBeenCalledTimes(3);
      });
    });

    describe("when the listener is added again", () => {
      beforeEach(() => {
        statusA.addEventListener("change", listener);
        statusB.addEventListener("change", listener);
        statusC.addEventListener("change", listener);
      });

      describe("when the user changes the permission state", () => {
        beforeEach(async () => {
          user.grantPermission("permission-a");
          user.denyPermission("permission-b");
          user.resetPermission("permission-c");
        });

        it("dispatches an event to the listener only once", () => {
          expect(listener.handleEvent).toHaveBeenCalledTimes(3);
        });
      });
    });

    describe("when the listener is removed", () => {
      beforeEach(() => {
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

        it("does not dispatch an event to the listener", () => {
          expect(listener.handleEvent).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('when a change event listener is added by calling addEventListener() with the "once" option', () => {
    let listener: jest.Mock;

    beforeEach(() => {
      listener = jest.fn();
      statusA.addEventListener("change", listener, { once: true });
      statusB.addEventListener("change", listener, { once: true });
      statusC.addEventListener("change", listener, { once: true });
    });

    afterEach(() => {
      statusA.removeEventListener("change", listener);
      statusB.removeEventListener("change", listener);
      statusC.removeEventListener("change", listener);
    });

    describe("when the user changes the permission state multiple times", () => {
      beforeEach(async () => {
        user.grantPermission("permission-a");
        user.denyPermission("permission-b");
        user.resetPermission("permission-c");

        user.resetPermission("permission-a");
        user.grantPermission("permission-b");
        user.denyPermission("permission-c");
      });

      it("dispatches an event to the listener only once", () => {
        expect(listener).toHaveBeenCalledTimes(3);
      });
    });

    describe("when the listener is added again", () => {
      beforeEach(() => {
        statusA.addEventListener("change", listener);
        statusB.addEventListener("change", listener);
        statusC.addEventListener("change", listener);
      });

      describe("when the user changes the permission state", () => {
        beforeEach(async () => {
          user.grantPermission("permission-a");
          user.denyPermission("permission-b");
          user.resetPermission("permission-c");
        });

        it("dispatches an event to the listener only once", () => {
          expect(listener).toHaveBeenCalledTimes(3);
        });
      });
    });

    describe("when the listener is removed", () => {
      beforeEach(() => {
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

        it("does not dispatch an event to the listener", () => {
          expect(listener).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('when a change event listener is added by calling addEventListener() with the "signal" option', () => {
    let listener: jest.Mock;
    let controller: AbortController;

    beforeEach(() => {
      listener = jest.fn();
      controller = new AbortController();
      const { signal } = controller;

      statusA.addEventListener("change", listener, { signal });
      statusB.addEventListener("change", listener, { signal });
      statusC.addEventListener("change", listener, { signal });
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

      it("dispatches an event to the listener", () => {
        expect(listener).toHaveBeenCalledTimes(3);
      });
    });

    describe("when the signal is aborted", () => {
      beforeEach(() => {
        controller.abort();
      });

      describe("when the user changes the permission state", () => {
        beforeEach(async () => {
          user.grantPermission("permission-a");
          user.denyPermission("permission-b");
          user.resetPermission("permission-c");
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('when a change event listener is added by calling addEventListener() in the "capture" phase', () => {
    let listener: jest.Mock;

    beforeEach(() => {
      listener = jest.fn();
      statusA.addEventListener("change", listener, true);
      statusB.addEventListener("change", listener, true);
      statusC.addEventListener("change", listener, true);
    });

    afterEach(() => {
      statusA.removeEventListener("change", listener, true);
      statusB.removeEventListener("change", listener, true);
      statusC.removeEventListener("change", listener, true);
    });

    describe("when the user changes the permission state", () => {
      beforeEach(async () => {
        user.grantPermission("permission-a");
        user.denyPermission("permission-b");
        user.resetPermission("permission-c");
      });

      it("dispatches an event to the listener", () => {
        expect(listener).toHaveBeenCalledTimes(3);
      });
    });

    describe('when the listener is added again in the "capture" phase', () => {
      beforeEach(() => {
        statusA.addEventListener("change", listener, true);
        statusB.addEventListener("change", listener, true);
        statusC.addEventListener("change", listener, true);
      });

      describe("when the user changes the permission state", () => {
        beforeEach(async () => {
          user.grantPermission("permission-a");
          user.denyPermission("permission-b");
          user.resetPermission("permission-c");
        });

        it("dispatches an event to the listener only once", () => {
          expect(listener).toHaveBeenCalledTimes(3);
        });
      });
    });

    describe('when the listener is added again in the "bubble" phase', () => {
      beforeEach(() => {
        statusA.addEventListener("change", listener, false);
        statusB.addEventListener("change", listener, false);
        statusC.addEventListener("change", listener, false);
      });

      describe("when the user changes the permission state", () => {
        beforeEach(async () => {
          user.grantPermission("permission-a");
          user.denyPermission("permission-b");
          user.resetPermission("permission-c");
        });

        it("dispatches an event to the listener in both phases", () => {
          expect(listener).toHaveBeenCalledTimes(6);
        });
      });
    });

    describe('when the listener is removed in the "capture" phase', () => {
      beforeEach(() => {
        statusA.removeEventListener("change", listener, true);
        statusB.removeEventListener("change", listener, true);
        statusC.removeEventListener("change", listener, true);
      });

      describe("when the user changes the permission state", () => {
        beforeEach(async () => {
          user.grantPermission("permission-a");
          user.denyPermission("permission-b");
          user.resetPermission("permission-c");
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe("when removeEventListener() is called with a change event listener that is not registered", () => {
    let listener: jest.Mock;

    beforeEach(() => {
      listener = jest.fn();
    });

    it("has no effect", () => {
      expect(() => {
        statusA.removeEventListener("change", listener);
      }).not.toThrow();
    });
  });

  describe("when a non-change event listener is added", () => {
    let listener: jest.Mock;

    beforeEach(() => {
      listener = jest.fn();
      statusA.addEventListener("event-a", listener);
    });

    afterEach(() => {
      statusA.removeEventListener("event-a", listener);
    });

    it("does not subscribe to the permission store", () => {
      expect(subscribe).not.toHaveBeenCalled();
    });

    describe("when the relevant event is dispatched", () => {
      beforeEach(async () => {
        statusA.dispatchEvent(new Event("event-a"));
      });

      it("dispatches the event to the listener", () => {
        expect(listener).toHaveBeenCalledTimes(1);
      });
    });

    describe("when the listener is added again", () => {
      beforeEach(() => {
        statusA.addEventListener("event-a", listener);
      });

      describe("when the relevant event is dispatched", () => {
        beforeEach(async () => {
          statusA.dispatchEvent(new Event("event-a"));
        });

        it("dispatches the event to the listener only once", () => {
          expect(listener).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe("when the listener is removed", () => {
      beforeEach(() => {
        statusA.removeEventListener("event-a", listener);
      });

      describe("when the relevant event is dispatched", () => {
        beforeEach(async () => {
          statusA.dispatchEvent(new Event("event-a"));
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toHaveBeenCalledTimes(0);
        });
      });
    });
  });
});

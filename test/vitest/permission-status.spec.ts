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
  type MockInstance,
} from "vitest";
import { mockFn, type Mocked } from "../helpers.js";

describe("PermissionStatus", () => {
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
  let subscribe: MockInstance<
    Parameters<PermissionStore["subscribe"]>,
    ReturnType<PermissionStore["subscribe"]>
  >;

  let user: User;
  let permissions: Permissions;
  let statusA: PermissionStatus;
  let statusB: PermissionStatus;
  let statusC: PermissionStatus;

  beforeEach(async () => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [permissionA, "prompt"],
        [permissionB, "granted"],
        [permissionC, "denied"],
      ]),
    });
    subscribe = vi.spyOn(permissionStore, "subscribe");

    user = createUser({ permissionStore });
    permissions = createPermissions({ permissionStore });

    statusA = await permissions.query(permissionA);
    statusB = await permissions.query(permissionB);
    statusC = await permissions.query(permissionC);
  });

  it("has a string tag", () => {
    expect(Object.prototype.toString.call(statusA)).toBe(
      "[object PermissionStatus]",
    );
  });

  it("cannot be instantiated directly", () => {
    const call = () => {
      new (statusA.constructor as new (p: object) => unknown)({});
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });

  it("has a name that matches the queried permission name", async () => {
    expect(statusA.name).toBe("permission-a");
    expect(statusB.name).toBe("permission-b");
  });

  it("has an initial state that matches the permission store", async () => {
    expect(statusA.state).toBe("prompt");
    expect(statusB.state).toBe("granted");
  });

  describe("when the user changes the permission state", () => {
    beforeEach(async () => {
      user.grantPermission(permissionA);
      user.denyPermission(permissionB);
      user.resetPermission(permissionC);
    });

    it("has a state that matches the new state", () => {
      expect(statusA.state).toBe("granted");
      expect(statusB.state).toBe("denied");
      expect(statusC.state).toBe("prompt");
    });
  });

  describe("before adding a change event listener", () => {
    it("does not subscribe to the permission store", () => {
      expect(subscribe).not.toHaveBeenCalled();
    });
  });

  describe("when a change event listener is added by setting onchange", () => {
    let listenerA: Mocked;
    let listenerB: Mocked;

    beforeEach(() => {
      listenerA = mockFn();
      listenerB = mockFn();

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
        user.grantPermission(permissionA);
        user.denyPermission(permissionB);
        user.resetPermission(permissionC);
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
          user.grantPermission(permissionA);
          user.denyPermission(permissionB);
          user.resetPermission(permissionC);
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
    let listener: Mocked;

    beforeEach(() => {
      listener = mockFn();
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
        user.grantPermission(permissionA);
        user.denyPermission(permissionB);
        user.resetPermission(permissionC);
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
          user.grantPermission(permissionA);
          user.denyPermission(permissionB);
          user.resetPermission(permissionC);
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
          user.grantPermission(permissionA);
          user.denyPermission(permissionB);
          user.resetPermission(permissionC);
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe("when an object-based change event listener is added by calling addEventListener()", () => {
    let listener: { handleEvent: Mocked };

    beforeEach(() => {
      listener = { handleEvent: mockFn() };
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
        user.grantPermission(permissionA);
        user.denyPermission(permissionB);
        user.resetPermission(permissionC);
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
          user.grantPermission(permissionA);
          user.denyPermission(permissionB);
          user.resetPermission(permissionC);
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
          user.grantPermission(permissionA);
          user.denyPermission(permissionB);
          user.resetPermission(permissionC);
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener.handleEvent).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('when a change event listener is added by calling addEventListener() with the "once" option', () => {
    let listener: Mocked;

    beforeEach(() => {
      listener = mockFn();
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
        user.grantPermission(permissionA);
        user.denyPermission(permissionB);
        user.resetPermission(permissionC);

        user.resetPermission(permissionA);
        user.grantPermission(permissionB);
        user.denyPermission(permissionC);
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
          user.grantPermission(permissionA);
          user.denyPermission(permissionB);
          user.resetPermission(permissionC);
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
          user.grantPermission(permissionA);
          user.denyPermission(permissionB);
          user.resetPermission(permissionC);
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('when a change event listener is added by calling addEventListener() with the "signal" option', () => {
    let listener: Mocked;
    let controller: AbortController;

    beforeEach(() => {
      listener = mockFn();
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
        user.grantPermission(permissionA);
        user.denyPermission(permissionB);
        user.resetPermission(permissionC);
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
          user.grantPermission(permissionA);
          user.denyPermission(permissionB);
          user.resetPermission(permissionC);
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('when a change event listener is added by calling addEventListener() in the "capture" phase', () => {
    let listener: Mocked;

    beforeEach(() => {
      listener = mockFn();
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
        user.grantPermission(permissionA);
        user.denyPermission(permissionB);
        user.resetPermission(permissionC);
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
          user.grantPermission(permissionA);
          user.denyPermission(permissionB);
          user.resetPermission(permissionC);
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
          user.grantPermission(permissionA);
          user.denyPermission(permissionB);
          user.resetPermission(permissionC);
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
          user.grantPermission(permissionA);
          user.denyPermission(permissionB);
          user.resetPermission(permissionC);
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe("when removeEventListener() is called with a change event listener that is not registered", () => {
    let listener: Mocked;

    beforeEach(() => {
      listener = mockFn();
    });

    it("has no effect", () => {
      expect(() => {
        statusA.removeEventListener("change", listener);
      }).not.toThrow();
    });
  });

  describe("when a non-change event listener is added", () => {
    let listener: Mocked;

    beforeEach(() => {
      listener = mockFn();
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

  describe("when a null event listener is added", () => {
    it("has no effect", () => {
      expect(() => {
        statusA.addEventListener(
          "event-a" as "change",
          null as unknown as EventListener,
        );
      }).not.toThrow();
    });
  });

  describe("when a null event listener is removed", () => {
    it("has no effect", () => {
      expect(() => {
        statusA.removeEventListener(
          "event-a" as "change",
          null as unknown as EventListener,
        );
      }).not.toThrow();
    });
  });
});

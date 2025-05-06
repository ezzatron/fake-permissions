import {
  createPermissionStore,
  createPermissions,
  createUser,
  type PermissionAccessStatus,
  type PermissionStore,
  type User,
} from "fake-permissions";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
  type MockInstance,
} from "vitest";

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
  let subscribe: MockInstance<PermissionStore["subscribe"]>;

  let user: User;
  let permissions: Permissions;
  let statusA: PermissionStatus;
  let statusB: PermissionStatus;
  let statusC: PermissionStatus;

  beforeEach(async () => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [permissionA, "PROMPT"],
        [permissionB, "GRANTED"],
        [permissionC, "BLOCKED"],
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

  it("has a name that matches the queried permission name", () => {
    expect(statusA.name).toBe("permission-a");
    expect(statusB.name).toBe("permission-b");
  });

  it("has an initial state that matches the permission store", () => {
    expect(statusA.state).toBe("prompt");
    expect(statusB.state).toBe("granted");
  });

  it.each`
    status                     | state
    ${"PROMPT"}                | ${"prompt"}
    ${"GRANTED"}               | ${"granted"}
    ${"BLOCKED"}               | ${"denied"}
    ${"BLOCKED_AUTOMATICALLY"} | ${"denied"}
    ${"ALLOWED"}               | ${"prompt"}
    ${"DENIED"}                | ${"prompt"}
  `(
    "has a default mask that maps permission store statuses to W3C permission states",
    ({
      status,
      state,
    }: {
      status: PermissionAccessStatus;
      state: PermissionState;
    }) => {
      permissionStore.setStatus(permissionA, status);

      expect(statusA.state).toBe(state);
    },
  );

  describe("when the user changes the permission state", () => {
    beforeEach(() => {
      user.grantAccess(permissionA);
      user.blockAccess(permissionB);
      user.resetAccess(permissionC);
    });

    it("has a state that matches the new state", () => {
      expect(statusA.state).toBe("granted");
      expect(statusB.state).toBe("denied");
      expect(statusC.state).toBe("prompt");
    });
  });

  describe("before adding a change event listener", () => {
    it("does not subscribe to the permission store", () => {
      expect(subscribe).not.toBeCalled();
    });
  });

  describe("when a change event listener is added by setting onchange", () => {
    let listenerA: Mock;
    let listenerB: Mock;

    beforeEach(() => {
      listenerA = vi.fn();
      listenerB = vi.fn();

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
      expect(subscribe).toBeCalledTimes(3);
    });

    it("can be read", () => {
      expect(statusA.onchange).toBe(listenerA);
    });

    describe("when the user changes the permission state", () => {
      beforeEach(() => {
        user.grantAccess(permissionA);
        user.blockAccess(permissionB);
        user.resetAccess(permissionC);
      });

      it("dispatches an event to the listener", () => {
        expect(listenerA).toBeCalledTimes(3);
      });
    });

    describe("when onchange is set to a different listener", () => {
      beforeEach(() => {
        statusA.onchange = listenerB;
        statusB.onchange = listenerB;
        statusC.onchange = listenerB;
      });

      describe("when the user changes the permission state", () => {
        beforeEach(() => {
          user.grantAccess(permissionA);
          user.blockAccess(permissionB);
          user.resetAccess(permissionC);
        });

        it("does not dispatch an event to the old listener", () => {
          expect(listenerA).toBeCalledTimes(0);
        });

        it("dispatches an event to the new listener", () => {
          expect(listenerB).toBeCalledTimes(3);
        });
      });
    });
  });

  describe("when a change event listener is added by calling addEventListener()", () => {
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

    it("subscribes to the permission store", () => {
      expect(subscribe).toBeCalledTimes(3);
    });

    describe("when the user changes the permission state", () => {
      beforeEach(() => {
        user.grantAccess(permissionA);
        user.blockAccess(permissionB);
        user.resetAccess(permissionC);
      });

      it("dispatches an event to the listener", () => {
        expect(listener).toBeCalledTimes(3);
      });
    });

    describe("when the listener is added again", () => {
      beforeEach(() => {
        statusA.addEventListener("change", listener);
        statusB.addEventListener("change", listener);
        statusC.addEventListener("change", listener);
      });

      describe("when the user changes the permission state", () => {
        beforeEach(() => {
          user.grantAccess(permissionA);
          user.blockAccess(permissionB);
          user.resetAccess(permissionC);
        });

        it("dispatches an event to the listener only once", () => {
          expect(listener).toBeCalledTimes(3);
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
        beforeEach(() => {
          user.grantAccess(permissionA);
          user.blockAccess(permissionB);
          user.resetAccess(permissionC);
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toBeCalledTimes(0);
        });
      });
    });
  });

  describe("when an object-based change event listener is added by calling addEventListener()", () => {
    let listener: { handleEvent: Mock };

    beforeEach(() => {
      listener = { handleEvent: vi.fn() };
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
      expect(subscribe).toBeCalledTimes(3);
    });

    describe("when the user changes the permission state", () => {
      beforeEach(() => {
        user.grantAccess(permissionA);
        user.blockAccess(permissionB);
        user.resetAccess(permissionC);
      });

      it("dispatches an event to the listener", () => {
        expect(listener.handleEvent).toBeCalledTimes(3);
      });
    });

    describe("when the listener is added again", () => {
      beforeEach(() => {
        statusA.addEventListener("change", listener);
        statusB.addEventListener("change", listener);
        statusC.addEventListener("change", listener);
      });

      describe("when the user changes the permission state", () => {
        beforeEach(() => {
          user.grantAccess(permissionA);
          user.blockAccess(permissionB);
          user.resetAccess(permissionC);
        });

        it("dispatches an event to the listener only once", () => {
          expect(listener.handleEvent).toBeCalledTimes(3);
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
        beforeEach(() => {
          user.grantAccess(permissionA);
          user.blockAccess(permissionB);
          user.resetAccess(permissionC);
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener.handleEvent).toBeCalledTimes(0);
        });
      });
    });
  });

  describe('when a change event listener is added by calling addEventListener() with the "once" option', () => {
    let listener: Mock;

    beforeEach(() => {
      listener = vi.fn();
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
      beforeEach(() => {
        user.grantAccess(permissionA);
        user.blockAccess(permissionB);
        user.resetAccess(permissionC);

        user.resetAccess(permissionA);
        user.grantAccess(permissionB);
        user.blockAccess(permissionC);
      });

      it("dispatches an event to the listener only once", () => {
        expect(listener).toBeCalledTimes(3);
      });
    });

    describe("when the listener is added again", () => {
      beforeEach(() => {
        statusA.addEventListener("change", listener);
        statusB.addEventListener("change", listener);
        statusC.addEventListener("change", listener);
      });

      describe("when the user changes the permission state", () => {
        beforeEach(() => {
          user.grantAccess(permissionA);
          user.blockAccess(permissionB);
          user.resetAccess(permissionC);
        });

        it("dispatches an event to the listener only once", () => {
          expect(listener).toBeCalledTimes(3);
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
        beforeEach(() => {
          user.grantAccess(permissionA);
          user.blockAccess(permissionB);
          user.resetAccess(permissionC);
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toBeCalledTimes(0);
        });
      });
    });
  });

  describe('when a change event listener is added by calling addEventListener() with the "signal" option', () => {
    let listener: Mock;
    let controller: AbortController;

    beforeEach(() => {
      listener = vi.fn();
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
      beforeEach(() => {
        user.grantAccess(permissionA);
        user.blockAccess(permissionB);
        user.resetAccess(permissionC);
      });

      it("dispatches an event to the listener", () => {
        expect(listener).toBeCalledTimes(3);
      });
    });

    describe("when the signal is aborted", () => {
      beforeEach(() => {
        controller.abort();
      });

      describe("when the user changes the permission state", () => {
        beforeEach(() => {
          user.grantAccess(permissionA);
          user.blockAccess(permissionB);
          user.resetAccess(permissionC);
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toBeCalledTimes(0);
        });
      });
    });
  });

  describe('when a change event listener is added by calling addEventListener() in the "capture" phase', () => {
    let listener: Mock;

    beforeEach(() => {
      listener = vi.fn();
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
      beforeEach(() => {
        user.grantAccess(permissionA);
        user.blockAccess(permissionB);
        user.resetAccess(permissionC);
      });

      it("dispatches an event to the listener", () => {
        expect(listener).toBeCalledTimes(3);
      });
    });

    describe('when the listener is added again in the "capture" phase', () => {
      beforeEach(() => {
        statusA.addEventListener("change", listener, true);
        statusB.addEventListener("change", listener, true);
        statusC.addEventListener("change", listener, true);
      });

      describe("when the user changes the permission state", () => {
        beforeEach(() => {
          user.grantAccess(permissionA);
          user.blockAccess(permissionB);
          user.resetAccess(permissionC);
        });

        it("dispatches an event to the listener only once", () => {
          expect(listener).toBeCalledTimes(3);
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
        beforeEach(() => {
          user.grantAccess(permissionA);
          user.blockAccess(permissionB);
          user.resetAccess(permissionC);
        });

        it("dispatches an event to the listener in both phases", () => {
          expect(listener).toBeCalledTimes(6);
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
        beforeEach(() => {
          user.grantAccess(permissionA);
          user.blockAccess(permissionB);
          user.resetAccess(permissionC);
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toBeCalledTimes(0);
        });
      });
    });
  });

  describe("when removeEventListener() is called with a change event listener that is not registered", () => {
    let listener: Mock;

    beforeEach(() => {
      listener = vi.fn();
    });

    it("has no effect", () => {
      expect(() => {
        statusA.removeEventListener("change", listener);
      }).not.toThrow();
    });
  });

  describe("when a non-change event listener is added", () => {
    let listener: Mock;

    beforeEach(() => {
      listener = vi.fn();
      statusA.addEventListener("event-a", listener);
    });

    afterEach(() => {
      statusA.removeEventListener("event-a", listener);
    });

    it("does not subscribe to the permission store", () => {
      expect(subscribe).not.toBeCalled();
    });

    describe("when the relevant event is dispatched", () => {
      beforeEach(() => {
        statusA.dispatchEvent(new Event("event-a"));
      });

      it("dispatches the event to the listener", () => {
        expect(listener).toBeCalledTimes(1);
      });
    });

    describe("when the listener is added again", () => {
      beforeEach(() => {
        statusA.addEventListener("event-a", listener);
      });

      describe("when the relevant event is dispatched", () => {
        beforeEach(() => {
          statusA.dispatchEvent(new Event("event-a"));
        });

        it("dispatches the event to the listener only once", () => {
          expect(listener).toBeCalledTimes(1);
        });
      });
    });

    describe("when the listener is removed", () => {
      beforeEach(() => {
        statusA.removeEventListener("event-a", listener);
      });

      describe("when the relevant event is dispatched", () => {
        beforeEach(() => {
          statusA.dispatchEvent(new Event("event-a"));
        });

        it("does not dispatch an event to the listener", () => {
          expect(listener).toBeCalledTimes(0);
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

import {
  PermissionStore,
  createDelegatedPermissions,
  createPermissionStore,
  createPermissions,
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

describe("Delegated permissions", () => {
  const permissionA: PermissionDescriptor = {
    name: "permission-a" as PermissionName,
  };
  const permissionB: PermissionDescriptor = {
    name: "permission-b" as PermissionName,
  };
  const permissionC: PermissionDescriptor = {
    name: "permission-c" as PermissionName,
  };

  let permissionStoreA: PermissionStore;
  let permissionStoreB: PermissionStore;
  let delegateA: Permissions;
  let delegateB: Permissions;
  let permissions: Permissions;
  let selectDelegate: (delegate: Permissions) => void;
  let isSelectedDelegate: (delegate: Permissions) => boolean;
  let statusA: PermissionStatus;
  let statusB: PermissionStatus;
  let statusC: PermissionStatus;
  let listenerA: Mock;
  let listenerB: Mock;
  let listenerC: Mock;

  beforeEach(() => {
    permissionStoreA = createPermissionStore({
      initialStates: new Map([
        [permissionA, "PROMPT"],
        [permissionB, "GRANTED"],
        [permissionC, "BLOCKED"],
      ]),
    });
    permissionStoreB = createPermissionStore({
      initialStates: new Map([
        [permissionA, "GRANTED"],
        [permissionB, "BLOCKED"],
        [permissionC, "PROMPT"],
      ]),
    });

    delegateA = createPermissions({ permissionStore: permissionStoreA });
    delegateB = createPermissions({ permissionStore: permissionStoreB });

    ({ permissions, selectDelegate, isSelectedDelegate } =
      createDelegatedPermissions({ delegates: [delegateA, delegateB] }));
  });

  it("has a string tag", () => {
    expect(Object.prototype.toString.call(permissions)).toBe(
      "[object Permissions]",
    );
  });

  it("cannot be instantiated directly", async () => {
    statusA = await permissions.query(permissionA);

    const instantiatePermissions = () => {
      new (permissions.constructor as new (p: object) => unknown)({});
    };
    const instantiateStatus = () => {
      new (statusA.constructor as new (p: object) => unknown)({
        descriptor: {},
      });
    };

    expect(instantiatePermissions).toThrow(TypeError);
    expect(instantiatePermissions).toThrow("Illegal constructor");
    expect(instantiateStatus).toThrow(TypeError);
    expect(instantiateStatus).toThrow("Illegal constructor");
  });

  it("requires at least one delegate", () => {
    const call = () => {
      createDelegatedPermissions({ delegates: [] });
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("No delegates provided");
  });

  it("doesn't allow selecting a delegate that is not in the list", () => {
    const delegateC = createPermissions({
      permissionStore: createPermissionStore({
        initialStates: new Map([
          [permissionA, "PROMPT"],
          [permissionB, "GRANTED"],
          [permissionC, "BLOCKED"],
        ]),
      }),
    });

    const call = () => {
      selectDelegate(delegateC);
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Unknown delegate");
  });

  describe("before selecting a delegate", () => {
    it("has selected the first delegate", () => {
      expect(isSelectedDelegate(delegateA)).toBe(true);
      expect(isSelectedDelegate(delegateB)).toBe(false);
    });

    describe("when querying a permission", () => {
      beforeEach(async () => {
        statusA = await permissions.query(permissionA);
        statusB = await permissions.query(permissionB);
        statusC = await permissions.query(permissionC);

        listenerA = vi.fn();
        listenerB = vi.fn();
        listenerC = vi.fn();

        statusA.addEventListener("change", listenerA);
        statusB.addEventListener("change", listenerB);
        statusC.addEventListener("change", listenerC);
      });

      afterEach(() => {
        statusA.removeEventListener("change", listenerA);
        statusB.removeEventListener("change", listenerB);
        statusC.removeEventListener("change", listenerC);
      });

      it("returns a status with a state that matches the first delegate", () => {
        expect(statusA.state).toBe("prompt");
        expect(statusB.state).toBe("granted");
        expect(statusC.state).toBe("denied");
      });

      describe("when the first delegate's state changes", () => {
        beforeEach(() => {
          permissionStoreA.setStatus(permissionA, "BLOCKED");
          permissionStoreA.setStatus(permissionB, "PROMPT");
          permissionStoreA.setStatus(permissionC, "GRANTED");
        });

        it("dispatches change events", () => {
          expect(listenerA).toBeCalledTimes(1);
          expect(listenerB).toBeCalledTimes(1);
          expect(listenerC).toBeCalledTimes(1);
        });

        it("updates the state on the status to match the new state", () => {
          expect(statusA.state).toBe("denied");
          expect(statusB.state).toBe("prompt");
          expect(statusC.state).toBe("granted");
        });
      });

      describe("when another delegate's state changes", () => {
        beforeEach(() => {
          permissionStoreB.setStatus(permissionA, "BLOCKED");
          permissionStoreB.setStatus(permissionB, "PROMPT");
          permissionStoreB.setStatus(permissionC, "GRANTED");
        });

        it("does not dispatch change events", () => {
          expect(listenerA).toBeCalledTimes(0);
          expect(listenerB).toBeCalledTimes(0);
          expect(listenerC).toBeCalledTimes(0);
        });

        it("does not update the state on the status", () => {
          expect(statusA.state).toBe("prompt");
          expect(statusB.state).toBe("granted");
          expect(statusC.state).toBe("denied");
        });
      });

      describe("when selecting a delegate with a different state", () => {
        beforeEach(() => {
          selectDelegate(delegateB);
        });

        it("dispatches change events", () => {
          expect(listenerA).toBeCalledTimes(1);
          expect(listenerB).toBeCalledTimes(1);
          expect(listenerC).toBeCalledTimes(1);
        });

        it("returns a status with a state that matches the selected delegate", () => {
          expect(statusA.state).toBe("granted");
          expect(statusB.state).toBe("denied");
          expect(statusC.state).toBe("prompt");
        });
      });

      describe("when selecting a delegate with the same state", () => {
        beforeEach(() => {
          permissionStoreB.setStatus(
            permissionA,
            permissionStoreA.getStatus(permissionA),
          );
          permissionStoreB.setStatus(
            permissionB,
            permissionStoreA.getStatus(permissionB),
          );
          permissionStoreB.setStatus(
            permissionC,
            permissionStoreA.getStatus(permissionC),
          );

          selectDelegate(delegateB);
        });

        it("does not dispatch change events", () => {
          expect(listenerA).toBeCalledTimes(0);
          expect(listenerB).toBeCalledTimes(0);
          expect(listenerC).toBeCalledTimes(0);
        });

        it("returns a status with a state that matches the first delegate", () => {
          expect(statusA.state).toBe("prompt");
          expect(statusB.state).toBe("granted");
          expect(statusC.state).toBe("denied");
        });
      });

      describe("when a change event listener is added by setting onchange", () => {
        beforeEach(() => {
          listenerA = vi.fn();
          listenerB = vi.fn();
          listenerC = vi.fn();

          statusA.onchange = listenerA;
          statusB.onchange = listenerB;
          statusC.onchange = listenerC;
        });

        afterEach(() => {
          statusA.onchange = null;
          statusB.onchange = null;
          statusC.onchange = null;
        });

        it("can be read", () => {
          expect(statusA.onchange).toBe(listenerA);
          expect(statusB.onchange).toBe(listenerB);
          expect(statusC.onchange).toBe(listenerC);
        });

        describe("when the first delegate's state changes", () => {
          beforeEach(() => {
            permissionStoreA.setStatus(permissionA, "BLOCKED");
            permissionStoreA.setStatus(permissionB, "PROMPT");
            permissionStoreA.setStatus(permissionC, "GRANTED");
          });

          it("dispatches change events", () => {
            expect(listenerA).toBeCalledTimes(1);
            expect(listenerB).toBeCalledTimes(1);
            expect(listenerC).toBeCalledTimes(1);
          });
        });
      });

      describe("when a non-change event listener is added", () => {
        beforeEach(() => {
          listenerA = vi.fn();
          statusA.addEventListener("event-a", listenerA);
        });

        afterEach(() => {
          statusA.removeEventListener("event-a", listenerA);
        });

        describe("when a matching event is dispatched", () => {
          beforeEach(() => {
            statusA.dispatchEvent(new Event("event-a"));
          });

          it("dispatches the event to the listener", () => {
            expect(listenerA).toBeCalledTimes(1);
          });
        });
      });
    });
  });

  describe("after selecting a delegate", () => {
    beforeEach(() => {
      selectDelegate(delegateB);
    });

    it("has selected the specified delegate", () => {
      expect(isSelectedDelegate(delegateB)).toBe(true);
      expect(isSelectedDelegate(delegateA)).toBe(false);
    });

    describe("when querying a permission", () => {
      beforeEach(async () => {
        statusA = await permissions.query(permissionA);
        statusB = await permissions.query(permissionB);
        statusC = await permissions.query(permissionC);

        listenerA = vi.fn();
        listenerB = vi.fn();
        listenerC = vi.fn();

        statusA.addEventListener("change", listenerA);
        statusB.addEventListener("change", listenerB);
        statusC.addEventListener("change", listenerC);
      });

      it("returns a status with a state that matches the selected delegate", () => {
        expect(statusA.state).toBe("granted");
        expect(statusB.state).toBe("denied");
        expect(statusC.state).toBe("prompt");
      });

      describe("when the selected delegate's state changes", () => {
        beforeEach(() => {
          permissionStoreB.setStatus(permissionA, "PROMPT");
          permissionStoreB.setStatus(permissionB, "GRANTED");
          permissionStoreB.setStatus(permissionC, "BLOCKED");
        });

        it("dispatches change events", () => {
          expect(listenerA).toBeCalledTimes(1);
          expect(listenerB).toBeCalledTimes(1);
          expect(listenerC).toBeCalledTimes(1);
        });

        it("updates the state on the status to match the new state", () => {
          expect(statusA.state).toBe("prompt");
          expect(statusB.state).toBe("granted");
          expect(statusC.state).toBe("denied");
        });
      });

      describe("when another delegate's state changes", () => {
        beforeEach(() => {
          permissionStoreA.setStatus(permissionA, "BLOCKED");
          permissionStoreA.setStatus(permissionB, "PROMPT");
          permissionStoreA.setStatus(permissionC, "GRANTED");
        });

        it("does not dispatch change events", () => {
          expect(listenerA).toBeCalledTimes(0);
          expect(listenerB).toBeCalledTimes(0);
          expect(listenerC).toBeCalledTimes(0);
        });

        it("does not update the state on the status", () => {
          expect(statusA.state).toBe("granted");
          expect(statusB.state).toBe("denied");
          expect(statusC.state).toBe("prompt");
        });
      });
    });
  });
});

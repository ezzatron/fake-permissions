import {
  IsDelegateSelected,
  PermissionStore,
  SelectDelegate,
  createDelegatedPermissions,
  createPermissionStore,
  createPermissions,
} from "fake-permissions";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockFn, type Mocked } from "../helpers.js";

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
  let selectDelegate: SelectDelegate;
  let isDelegateSelected: IsDelegateSelected;
  let statusA: PermissionStatus;
  let statusB: PermissionStatus;
  let statusC: PermissionStatus;
  let listenerA: Mocked;
  let listenerB: Mocked;
  let listenerC: Mocked;

  beforeEach(() => {
    permissionStoreA = createPermissionStore({
      initialStates: new Map([
        [permissionA, "prompt"],
        [permissionB, "granted"],
        [permissionC, "denied"],
      ]),
    });
    permissionStoreB = createPermissionStore({
      initialStates: new Map([
        [permissionA, "granted"],
        [permissionB, "denied"],
        [permissionC, "prompt"],
      ]),
    });

    delegateA = createPermissions({ permissionStore: permissionStoreA });
    delegateB = createPermissions({ permissionStore: permissionStoreB });

    ({ permissions, selectDelegate, isDelegateSelected } =
      createDelegatedPermissions({
        delegates: [delegateA, delegateB],
      }));
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

  describe("before selecting a delegate", () => {
    it("has selected the first delegate", () => {
      expect(isDelegateSelected(delegateA)).toBe(true);
      expect(isDelegateSelected(delegateB)).toBe(false);
    });

    describe("when querying a permission", () => {
      beforeEach(async () => {
        statusA = await permissions.query(permissionA);
        statusB = await permissions.query(permissionB);
        statusC = await permissions.query(permissionC);

        listenerA = mockFn();
        listenerB = mockFn();
        listenerC = mockFn();

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
          permissionStoreA.set(permissionA, "denied");
          permissionStoreA.set(permissionB, "prompt");
          permissionStoreA.set(permissionC, "granted");
        });

        it("dispatches change events", () => {
          expect(listenerA).toHaveBeenCalledTimes(1);
          expect(listenerB).toHaveBeenCalledTimes(1);
          expect(listenerC).toHaveBeenCalledTimes(1);
        });

        it("updates the state on the status to match the new state", () => {
          expect(statusA.state).toBe("denied");
          expect(statusB.state).toBe("prompt");
          expect(statusC.state).toBe("granted");
        });
      });

      describe("when another delegate's state changes", () => {
        beforeEach(() => {
          permissionStoreB.set(permissionA, "denied");
          permissionStoreB.set(permissionB, "prompt");
          permissionStoreB.set(permissionC, "granted");
        });

        it("does not dispatch change events", () => {
          expect(listenerA).toHaveBeenCalledTimes(0);
          expect(listenerB).toHaveBeenCalledTimes(0);
          expect(listenerC).toHaveBeenCalledTimes(0);
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
          expect(listenerA).toHaveBeenCalledTimes(1);
          expect(listenerB).toHaveBeenCalledTimes(1);
          expect(listenerC).toHaveBeenCalledTimes(1);
        });

        it("returns a status with a state that matches the selected delegate", () => {
          expect(statusA.state).toBe("granted");
          expect(statusB.state).toBe("denied");
          expect(statusC.state).toBe("prompt");
        });
      });

      describe("when selecting a delegate with the same state", () => {
        beforeEach(() => {
          permissionStoreB.set(permissionA, permissionStoreA.get(permissionA));
          permissionStoreB.set(permissionB, permissionStoreA.get(permissionB));
          permissionStoreB.set(permissionC, permissionStoreA.get(permissionC));

          selectDelegate(delegateB);
        });

        it("does not dispatch change events", () => {
          expect(listenerA).toHaveBeenCalledTimes(0);
          expect(listenerB).toHaveBeenCalledTimes(0);
          expect(listenerC).toHaveBeenCalledTimes(0);
        });

        it("returns a status with a state that matches the first delegate", () => {
          expect(statusA.state).toBe("prompt");
          expect(statusB.state).toBe("granted");
          expect(statusC.state).toBe("denied");
        });
      });

      describe("when a change event listener is added by setting onchange", () => {
        beforeEach(() => {
          listenerA = mockFn();
          listenerB = mockFn();
          listenerC = mockFn();

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
            permissionStoreA.set(permissionA, "denied");
            permissionStoreA.set(permissionB, "prompt");
            permissionStoreA.set(permissionC, "granted");
          });

          it("dispatches change events", () => {
            expect(listenerA).toHaveBeenCalledTimes(1);
            expect(listenerB).toHaveBeenCalledTimes(1);
            expect(listenerC).toHaveBeenCalledTimes(1);
          });
        });
      });

      describe("when a non-change event listener is added", () => {
        beforeEach(() => {
          listenerA = mockFn();
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
            expect(listenerA).toHaveBeenCalledTimes(1);
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
      expect(isDelegateSelected(delegateB)).toBe(true);
      expect(isDelegateSelected(delegateA)).toBe(false);
    });

    describe("when querying a permission", () => {
      beforeEach(async () => {
        statusA = await permissions.query(permissionA);
        statusB = await permissions.query(permissionB);
        statusC = await permissions.query(permissionC);

        listenerA = mockFn();
        listenerB = mockFn();
        listenerC = mockFn();

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
          permissionStoreB.set(permissionA, "prompt");
          permissionStoreB.set(permissionB, "granted");
          permissionStoreB.set(permissionC, "denied");
        });

        it("dispatches change events", () => {
          expect(listenerA).toHaveBeenCalledTimes(1);
          expect(listenerB).toHaveBeenCalledTimes(1);
          expect(listenerC).toHaveBeenCalledTimes(1);
        });

        it("updates the state on the status to match the new state", () => {
          expect(statusA.state).toBe("prompt");
          expect(statusB.state).toBe("granted");
          expect(statusC.state).toBe("denied");
        });
      });

      describe("when another delegate's state changes", () => {
        beforeEach(() => {
          permissionStoreA.set(permissionA, "denied");
          permissionStoreA.set(permissionB, "prompt");
          permissionStoreA.set(permissionC, "granted");
        });

        it("does not dispatch change events", () => {
          expect(listenerA).toHaveBeenCalledTimes(0);
          expect(listenerB).toHaveBeenCalledTimes(0);
          expect(listenerC).toHaveBeenCalledTimes(0);
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

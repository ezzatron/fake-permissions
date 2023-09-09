import { jest } from "@jest/globals";
import {
  DENIED,
  GRANTED,
  PROMPT,
} from "../../src/constants/permission-state.js";
import {
  PermissionStore,
  SelectDelegate,
  createDelegatedPermissions,
  createPermissionStore,
  createPermissions,
} from "../../src/index.js";

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
  let statusA: PermissionStatus;
  let statusB: PermissionStatus;
  let statusC: PermissionStatus;
  let listenerA: jest.Mock;
  let listenerB: jest.Mock;
  let listenerC: jest.Mock;

  beforeEach(() => {
    permissionStoreA = createPermissionStore({
      initialStates: new Map([
        [permissionA, PROMPT],
        [permissionB, GRANTED],
        [permissionC, DENIED],
      ]),
    });
    permissionStoreB = createPermissionStore({
      initialStates: new Map([
        [permissionA, GRANTED],
        [permissionB, DENIED],
        [permissionC, PROMPT],
      ]),
    });

    delegateA = createPermissions({ permissionStore: permissionStoreA });
    delegateB = createPermissions({ permissionStore: permissionStoreB });

    ({ permissions, selectDelegate } = createDelegatedPermissions({
      delegates: [delegateA, delegateB],
    }));
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
    describe("when querying a permission", () => {
      beforeEach(async () => {
        statusA = await permissions.query(permissionA);
        statusB = await permissions.query(permissionB);
        statusC = await permissions.query(permissionC);

        listenerA = jest.fn();
        listenerB = jest.fn();
        listenerC = jest.fn();

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
        expect(statusA.state).toBe(PROMPT);
        expect(statusB.state).toBe(GRANTED);
        expect(statusC.state).toBe(DENIED);
      });

      describe("when the first delegate's state changes", () => {
        beforeEach(() => {
          permissionStoreA.set(permissionA, DENIED);
          permissionStoreA.set(permissionB, PROMPT);
          permissionStoreA.set(permissionC, GRANTED);
        });

        it("dispatches change events", () => {
          expect(listenerA).toHaveBeenCalledTimes(1);
          expect(listenerB).toHaveBeenCalledTimes(1);
          expect(listenerC).toHaveBeenCalledTimes(1);
        });

        it("updates the state on the status to match the new state", () => {
          expect(statusA.state).toBe(DENIED);
          expect(statusB.state).toBe(PROMPT);
          expect(statusC.state).toBe(GRANTED);
        });
      });

      describe("when another delegate's state changes", () => {
        beforeEach(() => {
          permissionStoreB.set(permissionA, DENIED);
          permissionStoreB.set(permissionB, PROMPT);
          permissionStoreB.set(permissionC, GRANTED);
        });

        it("does not dispatch change events", () => {
          expect(listenerA).toHaveBeenCalledTimes(0);
          expect(listenerB).toHaveBeenCalledTimes(0);
          expect(listenerC).toHaveBeenCalledTimes(0);
        });

        it("does not update the state on the status", () => {
          expect(statusA.state).toBe(PROMPT);
          expect(statusB.state).toBe(GRANTED);
          expect(statusC.state).toBe(DENIED);
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
          expect(statusA.state).toBe(GRANTED);
          expect(statusB.state).toBe(DENIED);
          expect(statusC.state).toBe(PROMPT);
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
          expect(statusA.state).toBe(PROMPT);
          expect(statusB.state).toBe(GRANTED);
          expect(statusC.state).toBe(DENIED);
        });
      });

      describe("when a change event listener is added by setting onchange", () => {
        beforeEach(() => {
          listenerA = jest.fn();
          listenerB = jest.fn();
          listenerC = jest.fn();

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
            permissionStoreA.set(permissionA, DENIED);
            permissionStoreA.set(permissionB, PROMPT);
            permissionStoreA.set(permissionC, GRANTED);
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
          listenerA = jest.fn();
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

    describe("when querying a permission", () => {
      beforeEach(async () => {
        statusA = await permissions.query(permissionA);
        statusB = await permissions.query(permissionB);
        statusC = await permissions.query(permissionC);

        listenerA = jest.fn();
        listenerB = jest.fn();
        listenerC = jest.fn();

        statusA.addEventListener("change", listenerA);
        statusB.addEventListener("change", listenerB);
        statusC.addEventListener("change", listenerC);
      });

      it("returns a status with a state that matches the selected delegate", () => {
        expect(statusA.state).toBe(GRANTED);
        expect(statusB.state).toBe(DENIED);
        expect(statusC.state).toBe(PROMPT);
      });

      describe("when the selected delegate's state changes", () => {
        beforeEach(() => {
          permissionStoreB.set(permissionA, PROMPT);
          permissionStoreB.set(permissionB, GRANTED);
          permissionStoreB.set(permissionC, DENIED);
        });

        it("dispatches change events", () => {
          expect(listenerA).toHaveBeenCalledTimes(1);
          expect(listenerB).toHaveBeenCalledTimes(1);
          expect(listenerC).toHaveBeenCalledTimes(1);
        });

        it("updates the state on the status to match the new state", () => {
          expect(statusA.state).toBe(PROMPT);
          expect(statusB.state).toBe(GRANTED);
          expect(statusC.state).toBe(DENIED);
        });
      });

      describe("when another delegate's state changes", () => {
        beforeEach(() => {
          permissionStoreA.set(permissionA, DENIED);
          permissionStoreA.set(permissionB, PROMPT);
          permissionStoreA.set(permissionC, GRANTED);
        });

        it("does not dispatch change events", () => {
          expect(listenerA).toHaveBeenCalledTimes(0);
          expect(listenerB).toHaveBeenCalledTimes(0);
          expect(listenerC).toHaveBeenCalledTimes(0);
        });

        it("does not update the state on the status", () => {
          expect(statusA.state).toBe(GRANTED);
          expect(statusB.state).toBe(DENIED);
          expect(statusC.state).toBe(PROMPT);
        });
      });
    });
  });
});

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
  SelectDelegate,
  createDelegatedPermissions,
  createPermissionStore,
  createPermissions,
} from "../../src/index.js";

type Names = "permission-a" | "permission-b" | "permission-c";

describe("Delegated permissions", () => {
  let permissionStoreA: PermissionStore<Names>;
  let permissionStoreB: PermissionStore<Names>;
  let delegateA: Permissions<Names>;
  let delegateB: Permissions<Names>;
  let permissions: Permissions<Names>;
  let selectDelegate: SelectDelegate<Names>;
  let statusA: PermissionStatus<"permission-a">;
  let statusB: PermissionStatus<"permission-b">;
  let statusC: PermissionStatus<"permission-c">;
  let listenerA: jest.Mock;
  let listenerB: jest.Mock;
  let listenerC: jest.Mock;

  beforeEach(() => {
    permissionStoreA = createPermissionStore({
      initialStates: new Map([
        [{ name: "permission-a" }, PROMPT],
        [{ name: "permission-b" }, GRANTED],
        [{ name: "permission-c" }, DENIED],
      ]),
    });
    permissionStoreB = createPermissionStore({
      initialStates: new Map([
        [{ name: "permission-a" }, GRANTED],
        [{ name: "permission-b" }, DENIED],
        [{ name: "permission-c" }, PROMPT],
      ]),
    });

    delegateA = createPermissions({ permissionStore: permissionStoreA });
    delegateB = createPermissions({ permissionStore: permissionStoreB });

    ({ permissions, selectDelegate } = createDelegatedPermissions<Names>({
      delegates: [delegateA, delegateB],
    }));
  });

  it("cannot be instantiated directly", async () => {
    statusA = await permissions.query({ name: "permission-a" });

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
        statusA = await permissions.query({ name: "permission-a" });
        statusB = await permissions.query({ name: "permission-b" });
        statusC = await permissions.query({ name: "permission-c" });

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
          permissionStoreA.set({ name: "permission-a" }, DENIED);
          permissionStoreA.set({ name: "permission-b" }, PROMPT);
          permissionStoreA.set({ name: "permission-c" }, GRANTED);
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
          permissionStoreB.set({ name: "permission-a" }, DENIED);
          permissionStoreB.set({ name: "permission-b" }, PROMPT);
          permissionStoreB.set({ name: "permission-c" }, GRANTED);
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
          permissionStoreB.set(
            { name: "permission-a" },
            permissionStoreA.get({ name: "permission-a" }),
          );
          permissionStoreB.set(
            { name: "permission-b" },
            permissionStoreA.get({ name: "permission-b" }),
          );
          permissionStoreB.set(
            { name: "permission-c" },
            permissionStoreA.get({ name: "permission-c" }),
          );

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
            permissionStoreA.set({ name: "permission-a" }, DENIED);
            permissionStoreA.set({ name: "permission-b" }, PROMPT);
            permissionStoreA.set({ name: "permission-c" }, GRANTED);
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
        statusA = await permissions.query({ name: "permission-a" });
        statusB = await permissions.query({ name: "permission-b" });
        statusC = await permissions.query({ name: "permission-c" });

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
          permissionStoreB.set({ name: "permission-a" }, PROMPT);
          permissionStoreB.set({ name: "permission-b" }, GRANTED);
          permissionStoreB.set({ name: "permission-c" }, DENIED);
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
          permissionStoreA.set({ name: "permission-a" }, DENIED);
          permissionStoreA.set({ name: "permission-b" }, PROMPT);
          permissionStoreA.set({ name: "permission-c" }, GRANTED);
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

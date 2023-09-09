import { jest } from "@jest/globals";
import {
  GEOLOCATION,
  NOTIFICATIONS,
  PUSH,
} from "../../src/constants/permission-name.js";
import {
  DENIED,
  GRANTED,
  PROMPT,
} from "../../src/constants/permission-state.js";
import { PermissionStore, createPermissionStore } from "../../src/index.js";

describe("PermissionStore()", () => {
  const geolocation: PermissionDescriptor = { name: GEOLOCATION };
  const geolocationWithExtra: PermissionDescriptor = {
    name: GEOLOCATION,
    extra: true,
  } as PermissionDescriptor;
  const notifications: PermissionDescriptor = { name: NOTIFICATIONS };
  const push: PermissionDescriptor = { name: PUSH };
  const pushUserVisibleOnlyFalse: PermissionDescriptor = {
    name: PUSH,
    userVisibleOnly: false,
  } as PermissionDescriptor;
  const pushUserVisibleOnlyTrue: PermissionDescriptor = {
    name: PUSH,
    userVisibleOnly: true,
  } as PermissionDescriptor;
  const pushWithExtra: PermissionDescriptor = {
    name: PUSH,
    extra: true,
  } as PermissionDescriptor;

  let permissionStore: PermissionStore;

  beforeEach(() => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [{ name: GEOLOCATION }, DENIED],
        [pushUserVisibleOnlyFalse, GRANTED],
        [pushUserVisibleOnlyTrue, PROMPT],
      ]),

      isMatchingDescriptor(a, b) {
        if (a.name === PUSH && b.name === PUSH) {
          // a.userVisibleOnly is always present (comes from an initialStates key)
          return (
            "userVisibleOnly" in a &&
            a.userVisibleOnly ===
              ("userVisibleOnly" in b ? b.userVisibleOnly : false)
          );
        }

        return a.name === b.name;
      },
    });
  });

  describe("has()", () => {
    describe("when called with non-matching descriptor", () => {
      it("returns false", () => {
        expect(permissionStore.has(notifications)).toBe(false);
      });
    });

    describe("when called with matching descriptor", () => {
      it("returns true", () => {
        expect(permissionStore.has(geolocation)).toBe(true);
        expect(permissionStore.has(push)).toBe(true);
        expect(permissionStore.has(pushUserVisibleOnlyFalse)).toBe(true);
        expect(permissionStore.has(pushUserVisibleOnlyTrue)).toBe(true);
      });
    });

    describe("when called with matching descriptor with extra properties", () => {
      it("returns true", () => {
        expect(permissionStore.has(geolocationWithExtra)).toBe(true);
      });
    });
  });

  describe("get()", () => {
    describe("when called with non-matching descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.get(notifications);
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"notifications"}',
        );
      });
    });

    describe("when called with matching descriptor", () => {
      it("returns the state of the permission", () => {
        expect(permissionStore.get(geolocation)).toBe(DENIED);
        expect(permissionStore.get(push)).toBe(GRANTED);
        expect(permissionStore.get(pushUserVisibleOnlyFalse)).toBe(GRANTED);
        expect(permissionStore.get(pushUserVisibleOnlyTrue)).toBe(PROMPT);
      });
    });

    describe("when called with matching descriptor with extra properties", () => {
      it("returns the state of the permission", () => {
        expect(permissionStore.get(geolocationWithExtra)).toBe(DENIED);
      });
    });
  });

  describe("set()", () => {
    describe("when called with non-matching descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.set(notifications, PROMPT);
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"notifications"}',
        );
      });
    });

    describe("when called with matching descriptor", () => {
      it("sets the state of the permission", () => {
        permissionStore.set(geolocation, GRANTED);
        permissionStore.set(pushUserVisibleOnlyFalse, PROMPT);
        permissionStore.set(pushUserVisibleOnlyTrue, DENIED);

        expect(permissionStore.get(geolocation)).toBe(GRANTED);
        expect(permissionStore.get(push)).toBe(PROMPT);
        expect(permissionStore.get(pushUserVisibleOnlyFalse)).toBe(PROMPT);
        expect(permissionStore.get(pushUserVisibleOnlyTrue)).toBe(DENIED);
      });
    });

    describe("when called with matching descriptor with extra properties", () => {
      it("sets the state of the permission", () => {
        permissionStore.set(geolocationWithExtra, PROMPT);

        expect(permissionStore.get(geolocation)).toBe(PROMPT);
      });
    });
  });

  describe("subscribe()", () => {
    let subscriber: jest.Mock;

    beforeEach(() => {
      permissionStore.subscribe((subscriber = jest.fn()));
    });

    afterEach(() => {
      permissionStore.unsubscribe(subscriber);
    });

    describe("when a permission state changes", () => {
      beforeEach(() => {
        permissionStore.set(pushUserVisibleOnlyFalse, DENIED);
      });

      it("calls the subscriber", () => {
        expect(subscriber).toHaveBeenCalledTimes(1);
      });

      it("calls the subscriber with a callback for matching the descriptor", () => {
        expect(subscriber).toHaveBeenCalledWith(expect.any(Function));

        const callback = subscriber.mock.calls[0][0] as (
          d: PermissionDescriptor,
        ) => boolean;

        expect(callback(push)).toBe(true);
        expect(callback(pushUserVisibleOnlyFalse)).toBe(true);
        expect(callback(pushUserVisibleOnlyTrue)).toBe(false);
        expect(callback(pushWithExtra)).toBe(true);

        expect(callback(geolocation)).toBe(false);
        expect(callback(geolocationWithExtra)).toBe(false);
      });
    });
  });
});

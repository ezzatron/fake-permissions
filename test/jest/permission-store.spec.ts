import { jest } from "@jest/globals";
import { PermissionStore, createPermissionStore } from "../../src/index.js";

describe("PermissionStore()", () => {
  const geolocation: PermissionDescriptor = { name: "geolocation" };
  const geolocationWithExtra: PermissionDescriptor = {
    name: "geolocation",
    extra: true,
  } as PermissionDescriptor;
  const notifications: PermissionDescriptor = { name: "notifications" };
  const push: PermissionDescriptor = { name: "push" };
  const pushUserVisibleOnlyFalse: PermissionDescriptor = {
    name: "push",
    userVisibleOnly: false,
  } as PermissionDescriptor;
  const pushUserVisibleOnlyTrue: PermissionDescriptor = {
    name: "push",
    userVisibleOnly: true,
  } as PermissionDescriptor;
  const pushWithExtra: PermissionDescriptor = {
    name: "push",
    extra: true,
  } as PermissionDescriptor;

  let permissionStore: PermissionStore;

  beforeEach(() => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [geolocation, "denied"],
        [pushUserVisibleOnlyFalse, "granted"],
        [pushUserVisibleOnlyTrue, "prompt"],
      ]),

      isMatchingDescriptor(a, b) {
        if (a.name === "push" && b.name === "push") {
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
        expect(permissionStore.get(geolocation)).toBe("denied");
        expect(permissionStore.get(push)).toBe("granted");
        expect(permissionStore.get(pushUserVisibleOnlyFalse)).toBe("granted");
        expect(permissionStore.get(pushUserVisibleOnlyTrue)).toBe("prompt");
      });
    });

    describe("when called with matching descriptor with extra properties", () => {
      it("returns the state of the permission", () => {
        expect(permissionStore.get(geolocationWithExtra)).toBe("denied");
      });
    });
  });

  describe("set()", () => {
    describe("when called with non-matching descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.set(notifications, "prompt");
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"notifications"}',
        );
      });
    });

    describe("when called with matching descriptor", () => {
      it("sets the state of the permission", () => {
        permissionStore.set(geolocation, "granted");
        permissionStore.set(pushUserVisibleOnlyFalse, "prompt");
        permissionStore.set(pushUserVisibleOnlyTrue, "denied");

        expect(permissionStore.get(geolocation)).toBe("granted");
        expect(permissionStore.get(push)).toBe("prompt");
        expect(permissionStore.get(pushUserVisibleOnlyFalse)).toBe("prompt");
        expect(permissionStore.get(pushUserVisibleOnlyTrue)).toBe("denied");
      });
    });

    describe("when called with matching descriptor with extra properties", () => {
      it("sets the state of the permission", () => {
        permissionStore.set(geolocationWithExtra, "prompt");

        expect(permissionStore.get(geolocation)).toBe("prompt");
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
        permissionStore.set(pushUserVisibleOnlyFalse, "denied");
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

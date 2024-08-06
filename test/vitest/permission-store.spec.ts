import { PermissionStore, createPermissionStore } from "fake-permissions";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

describe("PermissionStore()", () => {
  const geolocation: PermissionDescriptor = { name: "geolocation" };
  const geolocationWithExtra: PermissionDescriptor = {
    name: "geolocation",
    extra: true,
  } as PermissionDescriptor;
  const midi: PermissionDescriptor = { name: "midi" };
  const midiSysexFalse: PermissionDescriptor = {
    name: "midi",
    sysex: false,
  } as PermissionDescriptor;
  const midiSysexTrue: PermissionDescriptor = {
    name: "midi",
    sysex: true,
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

  let permissionStore: PermissionStore;

  beforeEach(() => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [geolocation, "denied"],
        [midiSysexFalse, "granted"],
        [midiSysexTrue, "prompt"],
        [pushUserVisibleOnlyFalse, "granted"],
        [pushUserVisibleOnlyTrue, "prompt"],
      ]),

      isMatchingDescriptor(a, b) {
        if (a.name === "midi" && b.name === "midi") {
          // a.sysex is always present (comes from an initialStates key)
          return "sysex" in a && a.sysex === ("sysex" in b ? b.sysex : false);
        }

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
    let subscriber: Mock;
    let unsubscribe: () => void;

    beforeEach(() => {
      unsubscribe = permissionStore.subscribe((subscriber = vi.fn()));
    });

    afterEach(() => {
      unsubscribe();
    });

    describe("when a permission state changes", () => {
      beforeEach(() => {
        permissionStore.set(pushUserVisibleOnlyFalse, "denied");
      });

      it("calls the subscriber", () => {
        expect(subscriber).toBeCalledTimes(1);
        expect(subscriber).toBeCalledWith(
          pushUserVisibleOnlyFalse,
          "denied",
          "granted",
        );
      });
    });

    describe("when a permission state is updated to the same state", () => {
      beforeEach(() => {
        permissionStore.set(pushUserVisibleOnlyFalse, "granted");
      });

      it("does not call the subscriber", () => {
        expect(subscriber).toBeCalledTimes(0);
      });
    });
  });

  describe("when created with default options", () => {
    beforeEach(() => {
      permissionStore = createPermissionStore();
    });

    it.each([
      ["geolocation"],
      ["midi"],
      ["notifications"],
      ["persistent-storage"],
      ["push"],
      ["screen-wake-lock"],
      ["storage-access"],
    ] as const)(
      "should create a permission store with the standard permissions (%s)",
      (name) => {
        expect(permissionStore.has({ name })).toBe(true);
      },
    );

    it("should create a permission store that understands midi descriptors with the sysex property", () => {
      expect(permissionStore.get(midi)).toBe("prompt");
      expect(permissionStore.get(midiSysexFalse)).toBe("prompt");
      expect(permissionStore.get(midiSysexTrue)).toBe("prompt");

      permissionStore.set(midiSysexTrue, "denied");
      permissionStore.set(midiSysexFalse, "granted");

      expect(permissionStore.get(midi)).toBe("granted");
      expect(permissionStore.get(midiSysexFalse)).toBe("granted");
      expect(permissionStore.get(midiSysexTrue)).toBe("denied");
    });

    it("should create a permission store that understands push descriptors with the userVisibleOnly property", () => {
      expect(permissionStore.get(push)).toBe("prompt");
      expect(permissionStore.get(pushUserVisibleOnlyFalse)).toBe("prompt");
      expect(permissionStore.get(pushUserVisibleOnlyTrue)).toBe("prompt");

      permissionStore.set(pushUserVisibleOnlyTrue, "denied");
      permissionStore.set(pushUserVisibleOnlyFalse, "granted");

      expect(permissionStore.get(push)).toBe("granted");
      expect(permissionStore.get(pushUserVisibleOnlyFalse)).toBe("granted");
      expect(permissionStore.get(pushUserVisibleOnlyTrue)).toBe("denied");
    });
  });

  describe("when created with a custom initialStates option", () => {
    beforeEach(() => {
      permissionStore = createPermissionStore({
        initialStates: new Map([
          [push, "granted"],
          [pushUserVisibleOnlyTrue, "prompt"],
          [midi, "granted"],
          [midiSysexTrue, "prompt"],
        ]),
      });
    });

    it("should create a permission store that understands non-normalized midi descriptors in the initial states", () => {
      expect(permissionStore.get(midi)).toBe("granted");
      expect(permissionStore.get(midiSysexFalse)).toBe("granted");
      expect(permissionStore.get(midiSysexTrue)).toBe("prompt");

      permissionStore.set(midiSysexFalse, "prompt");
      permissionStore.set(midiSysexTrue, "denied");

      expect(permissionStore.get(midi)).toBe("prompt");
      expect(permissionStore.get(midiSysexFalse)).toBe("prompt");
      expect(permissionStore.get(midiSysexTrue)).toBe("denied");
    });

    it("should create a permission store that understands non-normalized push descriptors in the initial states", () => {
      expect(permissionStore.get(push)).toBe("granted");
      expect(permissionStore.get(pushUserVisibleOnlyFalse)).toBe("granted");
      expect(permissionStore.get(pushUserVisibleOnlyTrue)).toBe("prompt");

      permissionStore.set(pushUserVisibleOnlyFalse, "prompt");
      permissionStore.set(pushUserVisibleOnlyTrue, "denied");

      expect(permissionStore.get(push)).toBe("prompt");
      expect(permissionStore.get(pushUserVisibleOnlyFalse)).toBe("prompt");
      expect(permissionStore.get(pushUserVisibleOnlyTrue)).toBe("denied");
    });
  });
});

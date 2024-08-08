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

  describe("isKnownDescriptor()", () => {
    describe("when called with an unknown descriptor", () => {
      it("returns false", () => {
        expect(permissionStore.isKnownDescriptor(notifications)).toBe(false);
      });
    });

    describe("when called with a known descriptor", () => {
      it("returns true", () => {
        expect(permissionStore.isKnownDescriptor(geolocation)).toBe(true);
        expect(permissionStore.isKnownDescriptor(push)).toBe(true);
        expect(
          permissionStore.isKnownDescriptor(pushUserVisibleOnlyFalse),
        ).toBe(true);
        expect(permissionStore.isKnownDescriptor(pushUserVisibleOnlyTrue)).toBe(
          true,
        );
      });
    });

    describe("when called with a known descriptor with extra properties", () => {
      it("returns true", () => {
        expect(permissionStore.isKnownDescriptor(geolocationWithExtra)).toBe(
          true,
        );
      });
    });
  });

  describe("isMatchingDescriptor()", () => {
    it("forwards the call to the configured isMatchingDescriptor option", () => {
      expect(permissionStore.isMatchingDescriptor(midiSysexFalse, midi)).toBe(
        true,
      );
      expect(permissionStore.isMatchingDescriptor(midi, midiSysexFalse)).toBe(
        false,
      );
      expect(permissionStore.isMatchingDescriptor(midiSysexTrue, midi)).toBe(
        false,
      );
      expect(permissionStore.isMatchingDescriptor(midi, midiSysexTrue)).toBe(
        false,
      );
    });
  });

  describe("getState()", () => {
    describe("when called with an unknown descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.getState(notifications);
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"notifications"}',
        );
      });
    });

    describe("when called with a known descriptor", () => {
      it("returns the state of the permission", () => {
        expect(permissionStore.getState(geolocation)).toBe("denied");
        expect(permissionStore.getState(push)).toBe("granted");
        expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe(
          "granted",
        );
        expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe(
          "prompt",
        );
      });
    });

    describe("when called with a known descriptor with extra properties", () => {
      it("returns the state of the permission", () => {
        expect(permissionStore.getState(geolocationWithExtra)).toBe("denied");
      });
    });
  });

  describe("setState()", () => {
    describe("when called with an unknown descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.setState(notifications, "prompt");
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"notifications"}',
        );
      });
    });

    describe("when called with a known descriptor", () => {
      it("sets the state of the permission", () => {
        permissionStore.setState(geolocation, "granted");
        permissionStore.setState(pushUserVisibleOnlyFalse, "prompt");
        permissionStore.setState(pushUserVisibleOnlyTrue, "denied");

        expect(permissionStore.getState(geolocation)).toBe("granted");
        expect(permissionStore.getState(push)).toBe("prompt");
        expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe(
          "prompt",
        );
        expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe(
          "denied",
        );
      });
    });

    describe("when called with a known descriptor with extra properties", () => {
      it("sets the state of the permission", () => {
        permissionStore.setState(geolocationWithExtra, "prompt");

        expect(permissionStore.getState(geolocation)).toBe("prompt");
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
        permissionStore.setState(pushUserVisibleOnlyFalse, "denied");
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
        permissionStore.setState(pushUserVisibleOnlyFalse, "granted");
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
        expect(permissionStore.isKnownDescriptor({ name })).toBe(true);
      },
    );

    it("should create a permission store that understands midi descriptors with the sysex property", () => {
      expect(permissionStore.getState(midi)).toBe("prompt");
      expect(permissionStore.getState(midiSysexFalse)).toBe("prompt");
      expect(permissionStore.getState(midiSysexTrue)).toBe("prompt");

      permissionStore.setState(midiSysexTrue, "denied");
      permissionStore.setState(midiSysexFalse, "granted");

      expect(permissionStore.getState(midi)).toBe("granted");
      expect(permissionStore.getState(midiSysexFalse)).toBe("granted");
      expect(permissionStore.getState(midiSysexTrue)).toBe("denied");
    });

    it("should create a permission store that understands push descriptors with the userVisibleOnly property", () => {
      expect(permissionStore.getState(push)).toBe("prompt");
      expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe("prompt");
      expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe("prompt");

      permissionStore.setState(pushUserVisibleOnlyTrue, "denied");
      permissionStore.setState(pushUserVisibleOnlyFalse, "granted");

      expect(permissionStore.getState(push)).toBe("granted");
      expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe(
        "granted",
      );
      expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe("denied");
    });

    describe("isMatchingDescriptor()", () => {
      it("returns true for matching descriptors", () => {
        expect(permissionStore.isMatchingDescriptor(midiSysexFalse, midi)).toBe(
          true,
        );
        expect(permissionStore.isMatchingDescriptor(midi, midiSysexFalse)).toBe(
          true,
        );
      });

      it("returns false for non-matching descriptors", () => {
        expect(permissionStore.isMatchingDescriptor(midiSysexTrue, midi)).toBe(
          false,
        );
        expect(permissionStore.isMatchingDescriptor(midi, midiSysexTrue)).toBe(
          false,
        );
      });
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
      expect(permissionStore.getState(midi)).toBe("granted");
      expect(permissionStore.getState(midiSysexFalse)).toBe("granted");
      expect(permissionStore.getState(midiSysexTrue)).toBe("prompt");

      permissionStore.setState(midiSysexFalse, "prompt");
      permissionStore.setState(midiSysexTrue, "denied");

      expect(permissionStore.getState(midi)).toBe("prompt");
      expect(permissionStore.getState(midiSysexFalse)).toBe("prompt");
      expect(permissionStore.getState(midiSysexTrue)).toBe("denied");
    });

    it("should create a permission store that understands non-normalized push descriptors in the initial states", () => {
      expect(permissionStore.getState(push)).toBe("granted");
      expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe(
        "granted",
      );
      expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe("prompt");

      permissionStore.setState(pushUserVisibleOnlyFalse, "prompt");
      permissionStore.setState(pushUserVisibleOnlyTrue, "denied");

      expect(permissionStore.getState(push)).toBe("prompt");
      expect(permissionStore.getState(pushUserVisibleOnlyFalse)).toBe("prompt");
      expect(permissionStore.getState(pushUserVisibleOnlyTrue)).toBe("denied");
    });
  });
});

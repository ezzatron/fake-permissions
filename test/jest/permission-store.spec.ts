import { jest } from "@jest/globals";
import {
  GEOLOCATION,
  MIDI,
  PUSH,
} from "../../src/constants/permission-name.js";
import {
  DENIED,
  GRANTED,
  PROMPT,
} from "../../src/constants/permission-state.js";
import {
  PermissionDescriptor,
  PermissionStore,
  createPermissionStore,
} from "../../src/index.js";

type Names = typeof GEOLOCATION | typeof MIDI | typeof PUSH;

describe("PermissionStore()", () => {
  let permissionStore: PermissionStore<Names>;

  beforeEach(() => {
    permissionStore = createPermissionStore({
      initialStates: new Map([
        [{ name: GEOLOCATION }, DENIED],
        [{ name: MIDI }, GRANTED],
        [{ name: MIDI, sysex: true }, PROMPT],
        [{ name: PUSH }, GRANTED],
        [{ name: PUSH, userVisibleOnly: true }, PROMPT],
      ]),

      isMatchingDescriptor(a, b) {
        if (a.name === MIDI && b.name === MIDI) {
          return (a.sysex ?? false) === (b.sysex ?? false);
        }

        if (a.name === PUSH && b.name === PUSH) {
          return (a.userVisibleOnly ?? false) === (b.userVisibleOnly ?? false);
        }

        return a.name === b.name;
      },
    });
  });

  describe("has()", () => {
    describe("when called with non-matching descriptor", () => {
      it("returns false", () => {
        expect(
          permissionStore.has({
            name: "camera",
          } as unknown as PermissionDescriptor<Names>),
        ).toBe(false);
      });
    });

    describe("when called with matching descriptor", () => {
      it("returns true", () => {
        expect(permissionStore.has({ name: GEOLOCATION })).toBe(true);
        expect(permissionStore.has({ name: MIDI })).toBe(true);
        expect(permissionStore.has({ name: MIDI, sysex: false })).toBe(true);
        expect(permissionStore.has({ name: MIDI, sysex: true })).toBe(true);
        expect(permissionStore.has({ name: PUSH })).toBe(true);
        expect(
          permissionStore.has({ name: PUSH, userVisibleOnly: false }),
        ).toBe(true);
        expect(permissionStore.has({ name: PUSH, userVisibleOnly: true })).toBe(
          true,
        );
      });
    });

    describe("when called with matching descriptor with extra properties", () => {
      it("returns true", () => {
        expect(
          permissionStore.has({
            name: GEOLOCATION,
            extra: true,
          } as PermissionDescriptor<Names>),
        ).toBe(true);
      });
    });
  });

  describe("get()", () => {
    describe("when called with non-matching descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.get({
            name: "camera",
          } as unknown as PermissionDescriptor<Names>);
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"camera"}',
        );
      });
    });

    describe("when called with matching descriptor", () => {
      it("returns the state of the permission", () => {
        expect(permissionStore.get({ name: GEOLOCATION })).toBe(DENIED);
        expect(permissionStore.get({ name: MIDI })).toBe(GRANTED);
        expect(permissionStore.get({ name: MIDI, sysex: false })).toBe(GRANTED);
        expect(permissionStore.get({ name: MIDI, sysex: true })).toBe(PROMPT);
        expect(permissionStore.get({ name: PUSH })).toBe(GRANTED);
        expect(
          permissionStore.get({ name: PUSH, userVisibleOnly: false }),
        ).toBe(GRANTED);
        expect(permissionStore.get({ name: PUSH, userVisibleOnly: true })).toBe(
          PROMPT,
        );
      });
    });

    describe("when called with matching descriptor with extra properties", () => {
      it("returns the state of the permission", () => {
        expect(
          permissionStore.get({
            name: GEOLOCATION,
            extra: true,
          } as PermissionDescriptor<Names>),
        ).toBe(DENIED);
      });
    });
  });

  describe("set()", () => {
    describe("when called with non-matching descriptor", () => {
      it("throws a TypeError", () => {
        const call = () => {
          permissionStore.set(
            {
              name: "camera",
            } as unknown as PermissionDescriptor<Names>,
            PROMPT,
          );
        };

        expect(call).toThrow(TypeError);
        expect(call).toThrow(
          'No permission state for descriptor {"name":"camera"}',
        );
      });
    });

    describe("when called with matching descriptor", () => {
      it("sets the state of the permission", () => {
        permissionStore.set({ name: GEOLOCATION }, GRANTED);
        permissionStore.set({ name: MIDI }, PROMPT);
        permissionStore.set({ name: MIDI, sysex: true }, DENIED);
        permissionStore.set({ name: PUSH }, PROMPT);
        permissionStore.set({ name: PUSH, userVisibleOnly: true }, DENIED);

        expect(permissionStore.get({ name: GEOLOCATION })).toBe(GRANTED);
        expect(permissionStore.get({ name: MIDI })).toBe(PROMPT);
        expect(permissionStore.get({ name: MIDI, sysex: false })).toBe(PROMPT);
        expect(permissionStore.get({ name: MIDI, sysex: true })).toBe(DENIED);
        expect(permissionStore.get({ name: PUSH })).toBe(PROMPT);
        expect(
          permissionStore.get({ name: PUSH, userVisibleOnly: false }),
        ).toBe(PROMPT);
        expect(permissionStore.get({ name: PUSH, userVisibleOnly: true })).toBe(
          DENIED,
        );
      });
    });

    describe("when called with matching descriptor with extra properties", () => {
      it("sets the state of the permission", () => {
        permissionStore.set(
          {
            name: GEOLOCATION,
            extra: true,
          } as PermissionDescriptor<Names>,
          PROMPT,
        );
        expect(permissionStore.get({ name: GEOLOCATION })).toBe(PROMPT);
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
        permissionStore.set({ name: MIDI }, DENIED);
      });

      it("calls the subscriber", () => {
        expect(subscriber).toHaveBeenCalledTimes(1);
      });

      it("calls the subscriber with a callback for matching the descriptor", () => {
        expect(subscriber).toHaveBeenCalledWith(expect.any(Function));

        const callback = subscriber.mock.calls[0][0] as (
          d: PermissionDescriptor<Names>,
        ) => boolean;

        expect(callback({ name: MIDI })).toBe(true);
        expect(callback({ name: MIDI, sysex: false })).toBe(true);
        expect(callback({ name: MIDI, sysex: true })).toBe(false);
        expect(
          callback({
            name: MIDI,
            extra: "extra",
          } as PermissionDescriptor<Names>),
        ).toBe(true);

        expect(callback({ name: GEOLOCATION })).toBe(false);
        expect(
          callback({
            name: GEOLOCATION,
            extra: "extra",
          } as PermissionDescriptor<Names>),
        ).toBe(false);
      });
    });
  });
});

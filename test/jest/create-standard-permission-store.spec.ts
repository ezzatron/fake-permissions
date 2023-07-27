import * as permissionNames from "../../src/constants/permission-name.js";
import { MIDI } from "../../src/constants/permission-name.js";
import {
  DENIED,
  GRANTED,
  PROMPT,
} from "../../src/constants/permission-state.js";
import {
  PermissionDescriptor,
  PermissionName,
  PermissionStore,
  createStandardPermissionStore,
} from "../../src/index.js";

describe("createStandardPermissionStore()", () => {
  let permissionStore: PermissionStore<PermissionName>;

  beforeEach(() => {
    permissionStore = createStandardPermissionStore();
  });

  it("should create a permission store with the standard permissions", () => {
    for (const name of Object.values(permissionNames)) {
      expect(
        permissionStore.has({ name } as PermissionDescriptor<PermissionName>),
      ).toBe(true);
    }
  });

  it("should create a permission store that understands midi descriptors", () => {
    expect(permissionStore.get({ name: MIDI })).toBe(PROMPT);
    expect(permissionStore.get({ name: MIDI, sysex: false })).toBe(PROMPT);
    expect(permissionStore.get({ name: MIDI, sysex: true })).toBe(PROMPT);

    permissionStore.set({ name: MIDI, sysex: true }, DENIED);
    permissionStore.set({ name: MIDI, sysex: false }, GRANTED);

    expect(permissionStore.get({ name: MIDI })).toBe(GRANTED);
    expect(permissionStore.get({ name: MIDI, sysex: false })).toBe(GRANTED);
    expect(permissionStore.get({ name: MIDI, sysex: true })).toBe(DENIED);
  });
});

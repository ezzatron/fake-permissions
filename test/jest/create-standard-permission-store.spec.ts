import * as permissionNames from "../../src/constants/permission-name.js";
import { PUSH } from "../../src/constants/permission-name.js";
import {
  DENIED,
  GRANTED,
  PROMPT,
} from "../../src/constants/permission-state.js";
import {
  PermissionStore,
  createStandardPermissionStore,
} from "../../src/index.js";

describe("createStandardPermissionStore()", () => {
  const push: PermissionDescriptor = { name: PUSH };
  const pushUserVisibleOnlyFalse: PermissionDescriptor = {
    name: PUSH,
    userVisibleOnly: false,
  } as PermissionDescriptor;
  const pushUserVisibleOnlyTrue: PermissionDescriptor = {
    name: PUSH,
    userVisibleOnly: true,
  } as PermissionDescriptor;

  let permissionStore: PermissionStore;

  beforeEach(() => {
    permissionStore = createStandardPermissionStore();
  });

  it("should create a permission store with the standard permissions", () => {
    for (const name of Object.values(permissionNames)) {
      expect(permissionStore.has({ name })).toBe(true);
    }
  });

  it("should create a permission store that understands push descriptors with the userVisibleOnly property", () => {
    expect(permissionStore.get(push)).toBe(PROMPT);
    expect(permissionStore.get(pushUserVisibleOnlyFalse)).toBe(PROMPT);
    expect(permissionStore.get(pushUserVisibleOnlyTrue)).toBe(PROMPT);

    permissionStore.set(pushUserVisibleOnlyTrue, DENIED);
    permissionStore.set(pushUserVisibleOnlyFalse, GRANTED);

    expect(permissionStore.get(push)).toBe(GRANTED);
    expect(permissionStore.get(pushUserVisibleOnlyFalse)).toBe(GRANTED);
    expect(permissionStore.get(pushUserVisibleOnlyTrue)).toBe(DENIED);
  });
});

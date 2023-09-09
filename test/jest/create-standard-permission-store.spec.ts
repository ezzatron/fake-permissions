import {
  PermissionStore,
  createStandardPermissionStore,
} from "../../src/index.js";

describe("createStandardPermissionStore()", () => {
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
    permissionStore = createStandardPermissionStore();
  });

  it.each([
    ["geolocation"],
    ["notifications"],
    ["persistent-storage"],
    ["push"],
    ["screen-wake-lock"],
    ["xr-spatial-tracking"],
  ] as const)(
    "should create a permission store with the standard permissions (%s)",
    (name) => {
      expect(permissionStore.has({ name })).toBe(true);
    },
  );

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

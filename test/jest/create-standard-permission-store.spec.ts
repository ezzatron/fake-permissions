import * as permissionNames from "../../src/constants/permission-name.js";
import {
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
      expect(permissionStore.has(name)).toBe(true);
    }
  });
});

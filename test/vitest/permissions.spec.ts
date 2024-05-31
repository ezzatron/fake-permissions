import { createPermissionStore, createPermissions } from "fake-permissions";
import { beforeEach, describe, expect, it } from "vitest";

describe("Permissions", () => {
  const permissionA: PermissionDescriptor = {
    name: "permission-a" as PermissionName,
  };
  const permissionB: PermissionDescriptor = {
    name: "permission-b" as PermissionName,
  };

  let permissions: Permissions;
  let callQueryWith: (...a: unknown[]) => () => Promise<unknown>;

  beforeEach(() => {
    const permissionStore = createPermissionStore({
      initialStates: new Map([
        [permissionA, "prompt"],
        [permissionB, "prompt"],
      ]),
    });

    permissions = createPermissions({ permissionStore });

    callQueryWith = (...a: unknown[]) => {
      return async () => {
        await (permissions.query as (...a: unknown[]) => unknown)(...a);
      };
    };
  });

  it("cannot be instantiated directly", () => {
    const call = () => {
      new (permissions.constructor as new (p: object) => unknown)({});
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });

  describe("when queried without arguments", () => {
    it("throws a TypeError", async () => {
      const call = callQueryWith();

      await expect(call).rejects.toThrow(TypeError);
      await expect(call).rejects.toThrow(
        "Failed to execute 'query' on 'Permissions': 1 argument required, but only 0 present.",
      );
    });
  });

  describe("when queried with a non-object descriptor", () => {
    it("throws a TypeError", async () => {
      const call = callQueryWith(null);

      await expect(call).rejects.toThrow(TypeError);
      await expect(call).rejects.toThrow(
        "Failed to execute 'query' on 'Permissions': parameter 1 is not of type 'object'.",
      );
    });
  });

  describe("when queried with an empty object descriptor", () => {
    it("throws a TypeError", async () => {
      const call = callQueryWith({});

      await expect(call).rejects.toThrow(TypeError);
      await expect(call).rejects.toThrow(
        "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': Required member is undefined.",
      );
    });
  });

  describe("when queried with a non-string permission name", () => {
    it("throws a TypeError", async () => {
      const call = callQueryWith({ name: null });

      await expect(call).rejects.toThrow(TypeError);
      await expect(call).rejects.toThrow(
        "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value 'null' is not a valid enum value of type PermissionName.",
      );
    });
  });

  describe("when queried with an empty string permission name", () => {
    it("throws a TypeError", async () => {
      const call = callQueryWith({ name: "" });

      await expect(call).rejects.toThrow(TypeError);
      await expect(call).rejects.toThrow(
        "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value '' is not a valid enum value of type PermissionName.",
      );
    });
  });

  describe("when queried with a permission name not in the store", () => {
    it("throws a TypeError", async () => {
      const call = callQueryWith({ name: "non-existent" });

      await expect(call).rejects.toThrow(TypeError);
      await expect(call).rejects.toThrow(
        "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value 'non-existent' is not a valid enum value of type PermissionName.",
      );
    });
  });

  describe("when queried with a permission name in the store", () => {
    it("returns a status for the queried permission", async () => {
      const statusA = await permissions.query(permissionA);
      const statusB = await permissions.query(permissionB);

      expect(statusA.constructor.name).toBe("PermissionStatus");
      expect(statusA.name).toBe("permission-a");
      expect(statusB.constructor.name).toBe("PermissionStatus");
      expect(statusB.name).toBe("permission-b");
    });
  });
});

import { Permissions, PermissionStatus } from "../../src/index.js";

describe("Permissions", () => {
  let permissions: Permissions<"permission-a" | "permission-b">;
  let callQueryWith: (...a: unknown[]) => () => Promise<unknown>;

  beforeEach(() => {
    permissions = new Permissions({
      permissionNames: new Set(["permission-a", "permission-b"]),
    });

    callQueryWith = (...a: unknown[]) => {
      return async () => {
        await (permissions.query as AnyFn)(...a);
      };
    };
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

  describe("when queried with a permission name not in the set", () => {
    it("throws a TypeError", async () => {
      const call = callQueryWith({ name: "non-existent" });

      await expect(call).rejects.toThrow(TypeError);
      await expect(call).rejects.toThrow(
        "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value 'non-existent' is not a valid enum value of type PermissionName.",
      );
    });
  });

  describe("when queried with a permission name in the set", () => {
    it("returns a status", async () => {
      expect(await permissions.query({ name: "permission-a" })).toBeInstanceOf(
        PermissionStatus,
      );
      expect(await permissions.query({ name: "permission-b" })).toBeInstanceOf(
        PermissionStatus,
      );
    });
  });

  describe("when queried", () => {
    let status: PermissionStatus<"permission-a">;

    beforeEach(async () => {
      status = await permissions.query({ name: "permission-a" });
    });

    it("returns a status with the correct name", () => {
      expect(status.name).toBe("permission-a");
    });
  });
});

type AnyFn = (...a: unknown[]) => unknown;

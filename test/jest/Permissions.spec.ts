import * as defaultPermissionNames from "../../src/constants/permission-name.js";
import { Permissions } from "../../src/permissions.js";

const defaultPermissionNamesData: [PermissionName][] = Object.values(
  defaultPermissionNames,
).map((name) => [name]);

describe("Permissions", () => {
  let permissions: Permissions;
  let callQueryWith: (...a: unknown[]) => () => Promise<unknown>;

  beforeEach(() => {
    permissions = new Permissions();

    callQueryWith = (...a: unknown[]) => {
      return async () => {
        await (permissions.query as AnyFn)(...a);
      };
    };
  });

  describe("query()", () => {
    describe("when called without arguments", () => {
      it("throws a TypeError", async () => {
        const call = callQueryWith();

        await expect(call).rejects.toThrow(TypeError);
        await expect(call).rejects.toThrow(
          "Failed to execute 'query' on 'Permissions': 1 argument required, but only 0 present.",
        );
      });
    });

    describe("when called with a non-object descriptor", () => {
      it("throws a TypeError", async () => {
        const call = callQueryWith(null);

        await expect(call).rejects.toThrow(TypeError);
        await expect(call).rejects.toThrow(
          "Failed to execute 'query' on 'Permissions': parameter 1 is not of type 'object'.",
        );
      });
    });

    describe("when called with an empty object descriptor", () => {
      it("throws a TypeError", async () => {
        const call = callQueryWith({});

        await expect(call).rejects.toThrow(TypeError);
        await expect(call).rejects.toThrow(
          "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': Required member is undefined.",
        );
      });
    });

    describe("when called with a non-string permission name", () => {
      it("throws a TypeError", async () => {
        const call = callQueryWith({ name: null });

        await expect(call).rejects.toThrow(TypeError);
        await expect(call).rejects.toThrow(
          "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value 'null' is not a valid enum value of type PermissionName.",
        );
      });
    });

    describe("when called with an empty string permission name", () => {
      it("throws a TypeError", async () => {
        const call = callQueryWith({ name: "" });

        await expect(call).rejects.toThrow(TypeError);
        await expect(call).rejects.toThrow(
          "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value '' is not a valid enum value of type PermissionName.",
        );
      });
    });

    describe("when called with a non-existent permission name", () => {
      it("throws a TypeError", async () => {
        const call = callQueryWith({ name: "nonexistent" });

        await expect(call).rejects.toThrow(TypeError);
        await expect(call).rejects.toThrow(
          "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value 'nonexistent' is not a valid enum value of type PermissionName.",
        );
      });
    });

    describe("when using the default permission name set", () => {
      describe.each(defaultPermissionNamesData)(
        "when called with a permission name of '%s'",
        (name) => {
          it("returns a status", async () => {
            expect(await permissions.query({ name })).toBeDefined();
          });
        },
      );
    });

    describe("when using a custom permission name set", () => {
      const permissionNameA = "permission-name-a" as PermissionName;
      const permissionNameB = "permission-name-b" as PermissionName;

      beforeEach(() => {
        permissions = new Permissions({
          permissionNames: new Set([permissionNameA, permissionNameB]),
        });
      });

      describe("when called with a permission name in the custom set", () => {
        it("returns statuses", async () => {
          expect(
            await permissions.query({ name: permissionNameA }),
          ).toBeDefined();
          expect(
            await permissions.query({ name: permissionNameB }),
          ).toBeDefined();
        });
      });

      describe("when called with a permission name not in the custom set", () => {
        it("throws a TypeError", async () => {
          const call = callQueryWith({ name: "nonexistent" });

          await expect(call).rejects.toThrow(TypeError);
          await expect(call).rejects.toThrow(
            "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value 'nonexistent' is not a valid enum value of type PermissionName.",
          );
        });
      });
    });
  });
});

type AnyFn = (...a: unknown[]) => unknown;

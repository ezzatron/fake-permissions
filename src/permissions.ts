import { PermissionStatus } from "./permission-status.js";
import { PermissionStore } from "./permission-store.js";
import { PermissionDescriptor } from "./types/permission-descriptor.js";
import { PermissionName } from "./types/permission-name.js";
import { StdPermissionName, StdPermissions } from "./types/std.js";

export class Permissions<Names extends string = PermissionName> {
  constructor({
    permissionStore,
  }: {
    permissionStore: PermissionStore<Names>;
  }) {
    this.#permissionStore = permissionStore;
  }

  async query<Name extends Names>(
    descriptor: PermissionDescriptor<Name>,
  ): Promise<PermissionStatus<Name>> {
    if (arguments.length < 1) {
      throw new TypeError(
        "Failed to execute 'query' on 'Permissions': 1 argument required, but only 0 present.",
      );
    }

    if (!descriptor) {
      throw new TypeError(
        "Failed to execute 'query' on 'Permissions': parameter 1 is not of type 'object'.",
      );
    }

    if (!("name" in descriptor)) {
      throw new TypeError(
        "Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': Required member is undefined.",
      );
    }

    const { name } = descriptor;

    if (!this.#permissionStore.has(name)) {
      throw new TypeError(
        `Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value '${name}' is not a valid enum value of type PermissionName.`,
      );
    }

    return new PermissionStatus<Name>(this.#permissionStore, name);
  }

  readonly #permissionStore: PermissionStore<Names>;
}

Permissions<StdPermissionName> satisfies new (
  ...args: never[]
) => StdPermissions;

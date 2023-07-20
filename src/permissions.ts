import * as defaultPermissionNameMap from "./constants/permission-name.js";
import { PermissionStatus } from "./permission-status.js";
import { PermissionName } from "./types/permission-name.js";
import { StdPermissionStatus, StdPermissions } from "./types/std.js";

const defaultPermissionNames = new Set(Object.values(defaultPermissionNameMap));

export class Permissions {
  readonly #permissionNames: Set<PermissionName>;

  constructor({
    permissionNames = defaultPermissionNames,
  }: { permissionNames?: Set<PermissionName> } = {}) {
    this.#permissionNames = permissionNames;
  }

  async query(descriptor: PermissionDescriptor): Promise<StdPermissionStatus> {
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

    if (!this.#permissionNames.has(name)) {
      throw new TypeError(
        `Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value '${name}' is not a valid enum value of type PermissionName.`,
      );
    }

    return new PermissionStatus(name);
  }
}

Permissions satisfies new () => StdPermissions;

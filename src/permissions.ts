import { PermissionStatus } from "./permission-status.js";
import { PermissionStore } from "./permission-store.js";
import { PermissionDescriptor } from "./types/permission-descriptor.js";
import { PermissionName } from "./types/permission-name.js";
import { StdPermissionName, StdPermissions } from "./types/std.js";

export const CREATE = Symbol("CREATE");

type PermissionParameters<Names extends string> = {
  permissionStore: PermissionStore<Names>;
};

export function createPermissions<Names extends string = PermissionName>(
  parameters: PermissionParameters<Names>,
): Permissions<Names> {
  return Permissions[CREATE](parameters);
}

export class Permissions<Names extends string> {
  static [CREATE]<N extends string>(
    parameters: PermissionParameters<N>,
  ): Permissions<N> {
    Permissions.#canConstruct = true;

    return new Permissions(parameters);
  }

  /**
   * @deprecated Use the `createPermissions()` function instead.
   */
  constructor({ permissionStore }: PermissionParameters<Names>) {
    if (!Permissions.#canConstruct) throw new TypeError("Illegal constructor");
    Permissions.#canConstruct = false;

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

  static #canConstruct = false;
  readonly #permissionStore: PermissionStore<Names>;
}

Permissions<StdPermissionName> satisfies new (
  ...args: never[]
) => StdPermissions;

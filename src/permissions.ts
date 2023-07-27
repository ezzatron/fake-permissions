import { PermissionStatus } from "./permission-status.js";
import { PermissionStore } from "./permission-store.js";
import { CREATE } from "./private.js";
import { PermissionDescriptor } from "./types/permission-descriptor.js";
import { PermissionStatus as PermissionStatusInterface } from "./types/permission-status.js";
import { Permissions as PermissionsInterface } from "./types/permissions.js";
import { StdPermissionName, StdPermissions } from "./types/std.js";

export function createPermissions<Names extends string>(
  parameters: PermissionParameters<Names>,
): Permissions<Names> {
  return Permissions[CREATE](parameters);
}

type PermissionParameters<Names extends string> = {
  permissionStore: PermissionStore<Names>;
};

class Permissions<Names extends string> {
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
  ): Promise<PermissionStatusInterface<Name>> {
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

    if (!this.#permissionStore.has(descriptor as PermissionDescriptor<Names>)) {
      throw new TypeError(
        `Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value '${descriptor.name}' is not a valid enum value of type PermissionName.`,
      );
    }

    return PermissionStatus[CREATE]<Name>({
      descriptor,
      permissionStore: this
        .#permissionStore as unknown as PermissionStore<Name>,
    });
  }

  static #canConstruct = false;
  readonly #permissionStore: PermissionStore<Names>;
}

Permissions satisfies new (...args: never[]) => PermissionsInterface<never>;
Permissions<StdPermissionName> satisfies new (
  ...args: never[]
) => StdPermissions;

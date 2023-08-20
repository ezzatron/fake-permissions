import { createPermissionStatus } from "./permission-status.js";
import { PermissionStore } from "./permission-store.js";
import { PermissionDescriptor } from "./types/permission-descriptor.js";
import { PermissionStatus as PermissionStatusInterface } from "./types/permission-status.js";

type PermissionParameters<Names extends string> = {
  permissionStore: PermissionStore<Names>;
};

let canConstruct = false;

export function createPermissions<Names extends string>(
  parameters: PermissionParameters<Names>,
): Permissions<Names> {
  canConstruct = true;

  return new Permissions(parameters);
}

export class Permissions<Names extends string> {
  /**
   * @deprecated Use the `createPermissions()` function instead.
   */
  constructor({ permissionStore }: PermissionParameters<Names>) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

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

    return createPermissionStatus<Name>({
      descriptor,
      permissionStore: this
        .#permissionStore as unknown as PermissionStore<Name>,
    });
  }

  readonly #permissionStore: PermissionStore<Names>;
}

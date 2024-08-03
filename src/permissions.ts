import { createPermissionStatus } from "./permission-status.js";
import { PermissionStore } from "./permission-store.js";
import type { PermissionMask, PermissionsMask } from "./permissions-mask.js";

type PermissionParameters = {
  mask?: PermissionsMask;
  permissionStore: PermissionStore;
};

let canConstruct = false;

export function createPermissions(
  parameters: PermissionParameters,
): globalThis.Permissions {
  canConstruct = true;

  return new Permissions(parameters);
}

export class Permissions {
  /**
   * @deprecated Use the `createPermissions()` function instead.
   */
  constructor({ mask = new Map(), permissionStore }: PermissionParameters) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.#mask = mask;
    this.#permissionStore = permissionStore;
  }

  async query(descriptor: PermissionDescriptor): Promise<PermissionStatus> {
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

    if (!this.#permissionStore.has(descriptor)) {
      throw new TypeError(
        `Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value '${descriptor.name}' is not a valid enum value of type PermissionName.`,
      );
    }

    return createPermissionStatus({
      descriptor,
      mask: this.#findMask(descriptor),
      permissionStore: this.#permissionStore,
    });
  }

  #findMask(descriptor: PermissionDescriptor): PermissionMask {
    for (const [maskDescriptor, mask] of this.#mask.entries()) {
      if (
        this.#permissionStore.isMatchingDescriptor(descriptor, maskDescriptor)
      ) {
        return mask;
      }
    }

    return {};
  }

  readonly [Symbol.toStringTag] = "Permissions";

  readonly #mask: PermissionsMask;
  readonly #permissionStore: PermissionStore;
}

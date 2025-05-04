import {
  findMask,
  normalizeMask,
  type PermissionMask,
} from "./permission-mask.js";
import { createPermissionStatus } from "./permission-status.js";
import { PermissionStore } from "./permission-store.js";

/**
 * @inline
 * @see {@link createPermissions} to create a Permissions API.
 */
export type PermissionsParameters = {
  masks?: Map<PermissionDescriptor, Partial<PermissionMask>>;
  permissionStore: PermissionStore;
};

let canConstruct = false;

export function createPermissions(
  params: PermissionsParameters,
): globalThis.Permissions {
  canConstruct = true;

  return new Permissions(params);
}

export class Permissions {
  /**
   * @deprecated Use {@link createPermissions} instead.
   */
  constructor({ masks = new Map(), permissionStore }: PermissionsParameters) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.#masks = masks;
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

    if (!this.#permissionStore.isKnownDescriptor(descriptor)) {
      throw new TypeError(
        `Failed to execute 'query' on 'Permissions': Failed to read the 'name' property from 'PermissionDescriptor': The provided value '${descriptor.name}' is not a valid enum value of type PermissionName.`,
      );
    }

    return createPermissionStatus({
      descriptor,
      mask: normalizeMask(
        findMask(this.#permissionStore, this.#masks, descriptor) ?? {},
      ),
      permissionStore: this.#permissionStore,
    });
  }

  readonly [Symbol.toStringTag] = "Permissions";

  readonly #masks: Map<PermissionDescriptor, Partial<PermissionMask>>;
  readonly #permissionStore: PermissionStore;
}

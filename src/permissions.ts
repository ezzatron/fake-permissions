import { createPermissionStatus } from "./permission-status.js";
import type {
  PermissionAccessStatus,
  PermissionAccessStatusAllowed,
  PermissionAccessStatusBlocked,
  PermissionAccessStatusBlockedAutomatically,
  PermissionAccessStatusDenied,
  PermissionAccessStatusGranted,
  PermissionAccessStatusPrompt,
  PermissionStore,
} from "./permission-store.js";

export type _DocsTypes =
  | PermissionAccessStatus
  | PermissionAccessStatusAllowed
  | PermissionAccessStatusBlocked
  | PermissionAccessStatusBlockedAutomatically
  | PermissionAccessStatusDenied
  | PermissionAccessStatusGranted
  | PermissionAccessStatusPrompt;

/**
 * Parameters for creating a fake W3C
 * {@link globalThis.Permissions | Permissions} API.
 *
 * @see {@link createPermissions} to create a fake W3C
 *   {@link globalThis.Permissions | Permissions} API.
 */
export interface PermissionsParameters {
  /**
   * The permission store to use.
   */
  permissionStore: PermissionStore;
}

let canConstruct = false;

/**
 * Create a fake W3C {@link globalThis.Permissions | Permissions} API.
 *
 * @param params - The parameters for creating the fake W3C
 *   {@link globalThis.Permissions | Permissions} API.
 *
 * @returns A fake W3C {@link globalThis.Permissions | Permissions} API.
 *
 * @inlineType PermissionsParameters
 */
export function createPermissions(
  params: PermissionsParameters,
): globalThis.Permissions {
  canConstruct = true;

  return new Permissions(params);
}

export class Permissions {
  /**
   * @internal
   * @deprecated Use {@link createPermissions} instead.
   */
  constructor({ permissionStore }: PermissionsParameters) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

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
      permissionStore: this.#permissionStore,
    });
  }

  readonly [Symbol.toStringTag] = "Permissions";

  readonly #permissionStore: PermissionStore;
}

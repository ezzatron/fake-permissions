import {
  findMask,
  normalizeMask,
  type PermissionMask,
} from "./permission-mask.js";
import { createPermissionStatus } from "./permission-status.js";
import { PermissionStore } from "./permission-store.js";

/* eslint-disable @typescript-eslint/no-unused-vars -- imports for docs */
import type {
  PermissionAccessStatus,
  PermissionAccessStatusAllowed,
  PermissionAccessStatusBlocked,
  PermissionAccessStatusBlockedAutomatically,
  PermissionAccessStatusDenied,
  PermissionAccessStatusGranted,
  PermissionAccessStatusPrompt,
} from "./permission-store.js";
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Parameters for creating a fake W3C
 * {@link globalThis.Permissions | Permissions} API.
 *
 * @see {@link createPermissions} to create a fake W3C
 *   {@link globalThis.Permissions | Permissions} API.
 */
export interface PermissionsParameters {
  /**
   * Permission masks to apply when mapping {@link PermissionAccessStatus}
   * values to {@link PermissionState} values for various permissions.
   *
   * Internally, this library stores more granular statuses for permissions than
   * what is exposed via the W3C {@link globalThis.Permissions | Permissions}
   * API. This mapping defines how the internal {@link PermissionAccessStatus}
   * values are exposed via the fake
   * {@link globalThis.Permissions | Permissions} API's {@link PermissionState}
   * values.
   *
   * For example, some browsers support allowing one-time access to a
   * permission. This usually results in the {@link PermissionState} remaining
   * as {@link PermissionState | `"prompt"`} even after access has been allowed
   * or denied. In order to emulate this behavior, the default behavior of this
   * library is to use a mask that maps both
   * {@link PermissionAccessStatusAllowed | `"ALLOWED"`} and
   * {@link PermissionAccessStatusDenied | `"DENIED"`} to
   * {@link PermissionState | `"prompt"`}.
   *
   * If no explicit mappings are provided, the default mapping is:
   *
   * | {@link PermissionAccessStatus}                                                 | {@link PermissionState}               |
   * | :----------------------------------------------------------------------------- | :------------------------------------ |
   * | {@link PermissionAccessStatusPrompt | `"PROMPT"`}                              | {@link PermissionState | `"prompt"`}  |
   * | {@link PermissionAccessStatusGranted | `"GRANTED"`}                            | {@link PermissionState | `"granted"`} |
   * | {@link PermissionAccessStatusBlocked | `"BLOCKED"`}                            | {@link PermissionState | `"denied"`}  |
   * | {@link PermissionAccessStatusBlockedAutomatically | `"BLOCKED_AUTOMATICALLY"`} | {@link PermissionState | `"denied"`}  |
   * | {@link PermissionAccessStatusAllowed | `"ALLOWED"`}                            | {@link PermissionState | `"prompt"`}  |
   * | {@link PermissionAccessStatusDenied | `"DENIED"`}                              | {@link PermissionState | `"prompt"`}  |
   */
  masks?: Map<PermissionDescriptor, Partial<PermissionMask>>;

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

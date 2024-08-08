import { BaseEventTarget } from "./event-target.js";
import {
  PermissionStore,
  type PermissionAccessStatus,
  type PermissionStoreSubscriber,
  type Unsubscribe,
} from "./permission-store.js";
import type { PermissionMask } from "./permissions-mask.js";

type PermissionStatusParameters = {
  descriptor: PermissionDescriptor;
  mask: PermissionMask;
  permissionStore: PermissionStore;
};

let canConstruct = false;

export function createPermissionStatus(
  parameters: PermissionStatusParameters,
): globalThis.PermissionStatus {
  canConstruct = true;

  return new PermissionStatus(parameters);
}

export class PermissionStatus extends BaseEventTarget {
  readonly name: PermissionName;

  /**
   * @deprecated Use the `Permissions.query()` method instead.
   */
  constructor({
    descriptor,
    mask,
    permissionStore,
  }: PermissionStatusParameters) {
    super({
      onListenerCountChange: (() => {
        let unsubscribe: Unsubscribe | undefined;

        return (type, count) => {
          if (type !== "change") return;

          if (count > 0) {
            unsubscribe = permissionStore.subscribe(
              this.#handlePermissionStoreChange,
            );
          } else {
            unsubscribe?.();
          }
        };
      })(),
    });

    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.name = descriptor.name;
    this.#descriptor = descriptor;
    this.#mask = mask;
    this.#permissionStore = permissionStore;
    this.#onchange = null;

    this.#handlePermissionStoreChange = (descriptor, toStatus, fromStatus) => {
      if (!permissionStore.isMatchingDescriptor(descriptor, this.#descriptor)) {
        return;
      }

      const toState = statusToState(toStatus);
      const maskedToState = this.#mask[toState] ?? toState;

      const fromState = statusToState(fromStatus);
      const maskedFromState = this.#mask[fromState] ?? fromState;

      if (maskedToState === maskedFromState) return;

      this.dispatchEvent(new Event("change"));
    };
  }

  get state(): PermissionState {
    const state = statusToState(
      this.#permissionStore.getStatus(this.#descriptor),
    );

    return this.#mask[state] ?? state;
  }

  get onchange(): EventListener | null {
    return this.#onchange;
  }

  set onchange(listener: EventListener | null) {
    if (this.#onchange) this.removeEventListener("change", this.#onchange);
    this.#onchange = listener;
    if (this.#onchange) this.addEventListener("change", this.#onchange);
  }

  readonly [Symbol.toStringTag] = "PermissionStatus";

  #onchange: EventListener | null;
  readonly #descriptor: PermissionDescriptor;
  readonly #handlePermissionStoreChange: PermissionStoreSubscriber;
  readonly #mask: PermissionMask;
  readonly #permissionStore: PermissionStore;
}

function statusToState(status: PermissionAccessStatus): PermissionState {
  if (status === "GRANTED") return "granted";
  if (status === "BLOCKED") return "denied";
  if (status === "BLOCKED_AUTOMATICALLY") return "denied";
  return "prompt";
}

import { BaseEventTarget } from "./event-target.js";
import type { PermissionMask } from "./permission-mask.js";
import {
  PermissionStore,
  type PermissionStoreSubscriber,
} from "./permission-store.js";

interface PermissionStatusParameters {
  descriptor: PermissionDescriptor;
  mask: PermissionMask;
  permissionStore: PermissionStore;
}

let canConstruct = false;

export function createPermissionStatus(
  params: PermissionStatusParameters,
): globalThis.PermissionStatus {
  canConstruct = true;

  return new PermissionStatus(params);
}

export class PermissionStatus extends BaseEventTarget {
  readonly name: PermissionName;

  /**
   * @internal
   * @deprecated Use {@link Permissions.query} instead.
   */
  constructor({
    descriptor,
    mask,
    permissionStore,
  }: PermissionStatusParameters) {
    super({
      onListenerCountChange: (() => {
        let unsubscribe: () => void | undefined;

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

    this.#handlePermissionStoreChange = (
      descriptor,
      { toStatus, fromStatus },
    ) => {
      if (!permissionStore.isMatchingDescriptor(descriptor, this.#descriptor)) {
        return;
      }

      const toState = this.#mask[toStatus];
      const fromState = this.#mask[fromStatus];

      if (toState === fromState) return;

      this.dispatchEvent(new Event("change"));
    };
  }

  get state(): PermissionState {
    return this.#mask[this.#permissionStore.getStatus(this.#descriptor)];
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

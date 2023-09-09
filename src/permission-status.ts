import { BaseEventTarget } from "./event-target.js";
import { PermissionStore } from "./permission-store.js";

type PermissionStatusParameters = {
  descriptor: PermissionDescriptor;
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
  constructor({ descriptor, permissionStore }: PermissionStatusParameters) {
    super({
      onListenerCountChange: (type, count) => {
        if (type !== "change") return;

        if (count > 0) {
          permissionStore.subscribe(this.#handlePermissionStoreChange);
        } else {
          permissionStore.unsubscribe(this.#handlePermissionStoreChange);
        }
      },
    });

    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.name = descriptor.name;
    this.#descriptor = descriptor;
    this.#permissionStore = permissionStore;
    this.#onchange = null;

    this.#handlePermissionStoreChange = (isMatchingDescriptor) => {
      if (isMatchingDescriptor(this.#descriptor)) {
        this.dispatchEvent(new Event("change"));
      }
    };
  }

  get state(): PermissionState {
    return this.#permissionStore.get(this.#descriptor);
  }

  get onchange(): EventListener | null {
    return this.#onchange;
  }

  set onchange(listener: EventListener | null) {
    if (this.#onchange) this.removeEventListener("change", this.#onchange);
    this.#onchange = listener;
    if (this.#onchange) this.addEventListener("change", this.#onchange);
  }

  readonly #descriptor: PermissionDescriptor;
  readonly #permissionStore: PermissionStore;
  #onchange: EventListener | null;
  readonly #handlePermissionStoreChange: (
    isMatchingDescriptor: (descriptor: PermissionDescriptor) => boolean,
  ) => void;
}

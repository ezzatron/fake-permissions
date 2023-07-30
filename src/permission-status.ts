import { BaseEventTarget } from "./event-target.js";
import { PermissionStore } from "./permission-store.js";
import { PermissionDescriptor } from "./types/permission-descriptor.js";
import { PermissionStatus as PermissionStatusInterface } from "./types/permission-status.js";
import { StdPermissionState, StdPermissionStatus } from "./types/std.js";

type PermissionStatusParameters<Names extends string> = {
  descriptor: PermissionDescriptor<Names>;
  permissionStore: PermissionStore<Names>;
};

let canConstruct = false;

export function createPermissionStatus<Names extends string>(
  parameters: PermissionStatusParameters<Names>,
): PermissionStatus<Names> {
  canConstruct = true;

  return new PermissionStatus(parameters);
}

export class PermissionStatus<Name extends string> extends BaseEventTarget {
  readonly name: Name;

  /**
   * @deprecated Use the `Permissions.query()` method instead.
   */
  constructor({
    descriptor,
    permissionStore,
  }: PermissionStatusParameters<Name>) {
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

    this.name = descriptor.name as Name;
    this.#descriptor = descriptor;
    this.#permissionStore = permissionStore;
    this.#onchange = null;

    this.#handlePermissionStoreChange = (isMatchingDescriptor) => {
      if (isMatchingDescriptor(this.#descriptor)) {
        this.dispatchEvent(new Event("change"));
      }
    };
  }

  get state(): StdPermissionState {
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

  readonly #descriptor: PermissionDescriptor<Name>;
  readonly #permissionStore: PermissionStore<Name>;
  #onchange: EventListener | null;
  readonly #handlePermissionStoreChange: (
    isMatchingDescriptor: (descriptor: PermissionDescriptor<Name>) => boolean,
  ) => void;
}

PermissionStatus satisfies new (
  ...args: never[]
) => PermissionStatusInterface<never>;
PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

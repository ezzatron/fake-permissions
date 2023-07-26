import { BaseEventTarget } from "./event-target.js";
import { PermissionStore } from "./permission-store.js";
import { CREATE } from "./private.js";
import { PermissionStatus as PermissionStatusInterface } from "./types/permission-status.js";
import { StdPermissionState, StdPermissionStatus } from "./types/std.js";

type PermissionStatusParameters<Names extends string> = {
  name: Names;
  permissionStore: PermissionStore<Names>;
};

export class PermissionStatus<Name extends string> extends BaseEventTarget {
  static [CREATE]<N extends string>(
    parameters: PermissionStatusParameters<N>,
  ): PermissionStatus<N> {
    PermissionStatus.#canConstruct = true;

    return new PermissionStatus(parameters);
  }

  readonly name: Name;

  /**
   * @deprecated Use the `Permissions.query()` method instead.
   */
  constructor({ name, permissionStore }: PermissionStatusParameters<Name>) {
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

    if (!PermissionStatus.#canConstruct) {
      throw new TypeError("Illegal constructor");
    }
    PermissionStatus.#canConstruct = false;

    this.#permissionStore = permissionStore;
    this.name = name;
    this.#onchange = null;

    this.#handlePermissionStoreChange = (name) => {
      if (name === this.name) this.dispatchEvent(new Event("change"));
    };
  }

  get state(): StdPermissionState {
    return this.#permissionStore.get(this.name);
  }

  get onchange(): EventListener | null {
    return this.#onchange;
  }

  set onchange(listener: EventListener | null) {
    if (this.#onchange) this.removeEventListener("change", this.#onchange);
    this.#onchange = listener;
    if (this.#onchange) this.addEventListener("change", this.#onchange);
  }

  static #canConstruct = false;
  readonly #permissionStore: PermissionStore<Name>;
  #onchange: EventListener | null;
  readonly #handlePermissionStoreChange: (name: string) => void;
}

PermissionStatus satisfies new (
  ...args: never[]
) => PermissionStatusInterface<never>;
PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

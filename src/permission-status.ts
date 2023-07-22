import { PermissionStore } from "./permission-store.js";
import { CREATE } from "./private.js";
import { StdPermissionStatus } from "./types/std.js";

type PermissionStatusParameters<Names extends string> = {
  name: Names;
  permissionStore: PermissionStore<Names>;
};

export class PermissionStatus<Name extends string> extends EventTarget {
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
    super();

    if (!PermissionStatus.#canConstruct) {
      throw new TypeError("Illegal constructor");
    }
    PermissionStatus.#canConstruct = false;

    this.#permissionStore = permissionStore;
    this.name = name;
    this.#onchange = null;

    permissionStore.subscribe((name) => {
      if (name === this.name) this.dispatchEvent(new Event("change"));
    });
  }

  get state(): PermissionState {
    return this.#permissionStore.get(this.name);
  }

  get onchange(): Listener | null {
    return this.#onchange;
  }

  set onchange(listener: Listener | null) {
    if (this.#onchange) this.removeEventListener("change", this.#onchange);
    this.addEventListener("change", (this.#onchange = listener));
  }

  static #canConstruct = false;
  readonly #permissionStore: PermissionStore<Name>;
  #onchange: Listener | null;
}

PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

type Listener = (ev: Event) => void;

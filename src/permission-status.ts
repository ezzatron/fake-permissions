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
  onchange: ((ev: Event) => void) | null = null;

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
  }

  get state(): PermissionState {
    return this.#permissionStore.get(this.name);
  }

  static #canConstruct = false;
  readonly #permissionStore: PermissionStore<Name>;
}

PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

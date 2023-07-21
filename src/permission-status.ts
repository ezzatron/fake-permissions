import { PermissionStore } from "./permission-store.js";
import { StdPermissionStatus } from "./types/std.js";

export class PermissionStatus<Name extends string> extends EventTarget {
  readonly name: Name;
  onchange: ((ev: Event) => void) | null = null;

  constructor(permissionStore: PermissionStore<Name>, name: Name) {
    super();

    this.#permissionStore = permissionStore;
    this.name = name;
  }

  get state(): PermissionState {
    return this.#permissionStore.get(this.name);
  }

  readonly #permissionStore: PermissionStore<Name>;
}

PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

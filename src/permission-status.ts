import { PermissionStore } from "./permission-store.js";
import { StdPermissionStatus } from "./types/std.js";

export class PermissionStatus<Name extends string> {
  readonly name: Name;
  onchange: ((ev: Event) => void) | null = null;

  constructor(permissionStore: PermissionStore<Name>, name: Name) {
    this.#permissionStore = permissionStore;
    this.name = name;
  }

  get state(): PermissionState {
    return this.#permissionStore.get(this.name);
  }

  addEventListener(): void {
    throw new Error("Not implemented");
  }

  removeEventListener(): void {
    throw new Error("Not implemented");
  }

  dispatchEvent(): boolean {
    throw new Error("Not implemented");
  }

  readonly #permissionStore: PermissionStore<Name>;
}

PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

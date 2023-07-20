import { PermissionSet } from "./types/permission-set.js";
import { StdPermissionStatus } from "./types/std.js";

export class PermissionStatus<Name extends string> {
  readonly name: Name;
  onchange: ((ev: Event) => void) | null = null;

  constructor(permissionSet: PermissionSet<Name>, name: Name) {
    this.#permissionSet = permissionSet;
    this.name = name;
  }

  get state(): PermissionState {
    return this.#permissionSet[this.name];
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

  readonly #permissionSet: PermissionSet<Name>;
}

PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

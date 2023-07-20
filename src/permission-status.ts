import { StdPermissionStatus } from "./types/std.js";

export class PermissionStatus {
  readonly name: PermissionName;

  constructor(name: PermissionName) {
    this.name = name;
  }

  get state(): PermissionState {
    throw new Error("Not implemented");
  }

  addEventListener() {
    throw new Error("Not implemented");
  }

  removeEventListener() {
    throw new Error("Not implemented");
  }

  dispatchEvent(): boolean {
    throw new Error("Not implemented");
  }

  onchange() {
    throw new Error("Not implemented");
  }
}

PermissionStatus satisfies new (name: PermissionName) => StdPermissionStatus;

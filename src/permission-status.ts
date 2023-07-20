import { PROMPT } from "./constants/permission-state.js";
import { StdPermissionStatus } from "./types/std.js";

export class PermissionStatus<Name extends string> {
  readonly name: Name;

  constructor(name: Name) {
    this.name = name;
  }

  get state(): PermissionState {
    return PROMPT;
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

PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

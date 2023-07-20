import { StdPermissionState, StdPermissionStatus } from "./types/std.js";

export class PermissionStatus<Name extends string> {
  readonly name: Name;

  constructor(initialState: StdPermissionState, name: Name) {
    this.#initialState = initialState;
    this.name = name;
  }

  get state(): PermissionState {
    return this.#initialState;
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

  readonly #initialState: StdPermissionState;
}

PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

import { StdPermissionState } from "./std.js";

export interface PermissionStatus<Name extends string> extends EventTarget {
  readonly name: Name;
  readonly state: StdPermissionState;
  onchange: ((event: Event) => void) | null;
}

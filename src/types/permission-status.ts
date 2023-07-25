import { StdEventTargetInterface, StdPermissionState } from "./std.js";

export interface PermissionStatus<Name extends string>
  extends StdEventTargetInterface {
  readonly name: Name;
  readonly state: StdPermissionState;
  onchange: ((event: Event) => void) | null;
}

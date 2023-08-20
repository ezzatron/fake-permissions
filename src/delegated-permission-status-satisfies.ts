import { PermissionStatus } from "./permission-status.js";
import { PermissionStatus as PermissionStatusInterface } from "./types/permission-status.js";
import { StdPermissionStatus } from "./types/std.js";

PermissionStatus satisfies new (
  ...args: never[]
) => PermissionStatusInterface<never>;
PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

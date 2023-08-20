import { PermissionStatus } from "./permission-status.js";
import { PermissionStatus as PermissionStatusInterface } from "./types/permission-status.js";
import { StdPermissionStatus } from "./types/std.js";

// this file needs to be broken out because @swc/jest doesn't support satisfies

PermissionStatus satisfies new (
  ...args: never[]
) => PermissionStatusInterface<never>;
PermissionStatus satisfies new (...args: never[]) => StdPermissionStatus;

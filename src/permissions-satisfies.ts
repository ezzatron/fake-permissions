import { Permissions } from "./permissions.js";
import { Permissions as PermissionsInterface } from "./types/permissions.js";
import { StdPermissionName, StdPermissions } from "./types/std.js";

// this file needs to be broken out because @swc/jest doesn't support satisfies

Permissions satisfies new (...args: never[]) => PermissionsInterface<never>;
Permissions<StdPermissionName> satisfies new (
  ...args: never[]
) => StdPermissions;

import { Permissions } from "./delegated-permissions.js";
import { Permissions as PermissionsInterface } from "./types/permissions.js";
import { StdPermissionName, StdPermissions } from "./types/std.js";

Permissions satisfies new (...args: never[]) => PermissionsInterface<never>;
Permissions<StdPermissionName> satisfies new (
  ...args: never[]
) => StdPermissions;

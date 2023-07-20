import * as permissionNames from "../constants/permission-name.js";

export type PermissionName =
  (typeof permissionNames)[keyof typeof permissionNames];

import { DENIED, GRANTED, PROMPT } from "./constants/permission-state.js";
import { PermissionSet } from "./types/permission-set.js";

export class User<Names extends string> {
  readonly permissionSet: PermissionSet<Names>;

  constructor({ permissionSet }: { permissionSet: PermissionSet<Names> }) {
    this.permissionSet = permissionSet;
  }

  grantPermission(name: Names): void {
    this.permissionSet[name] = GRANTED;
  }

  denyPermission(name: Names): void {
    this.permissionSet[name] = DENIED;
  }

  resetPermission(name: Names): void {
    this.permissionSet[name] = PROMPT;
  }
}

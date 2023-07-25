import { PermissionDescriptor } from "./permission-descriptor.js";
import { PermissionStatus } from "./permission-status.js";

export interface Permissions<Names extends string> {
  query<Name extends Names>(
    descriptor: PermissionDescriptor<Name>,
  ): Promise<PermissionStatus<Name>>;
}

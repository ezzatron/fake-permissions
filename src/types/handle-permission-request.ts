import { SyncOrAsync } from "./async.js";
import { PermissionDescriptor } from "./permission-descriptor.js";
import { StdPermissionState } from "./std.js";

export type HandlePermissionRequest<Names extends string> = (
  descriptor: PermissionDescriptor<Names>,
) => SyncOrAsync<StdPermissionState>;

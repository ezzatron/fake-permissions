import { SyncOrAsync } from "./async.js";

export type HandlePermissionRequest = (
  descriptor: PermissionDescriptor,
) => SyncOrAsync<PermissionState>;

import { StdPermissionState } from "./std.js";

export type PermissionSet<Names extends string> = Record<
  Names,
  StdPermissionState
>;

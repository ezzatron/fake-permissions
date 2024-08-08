// TODO: make masks use the new PermissionAccessStatus enum
export type PermissionsMask = Map<PermissionDescriptor, PermissionMask>;
export type PermissionMask = Partial<Record<PermissionState, PermissionState>>;

export type PermissionsMask = Map<PermissionDescriptor, PermissionMask>;
export type PermissionMask = Partial<Record<PermissionState, PermissionState>>;

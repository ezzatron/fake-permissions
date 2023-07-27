export type PermissionDescriptor<Name extends string> =
  | ("midi" extends Name ? MidiPermissionDescriptor : never)
  | ("push" extends Name ? PushPermissionDescriptor : never)
  | (string extends "midi" | "push"
      ? never
      : GenericPermissionDescriptor<Exclude<Name, "midi" | "push">>);

interface MidiPermissionDescriptor extends GenericPermissionDescriptor<"midi"> {
  sysex?: boolean;
}

interface PushPermissionDescriptor extends GenericPermissionDescriptor<"push"> {
  userVisibleOnly?: boolean;
}

interface GenericPermissionDescriptor<Name extends string> {
  name: Name;
}

import { MIDI as _MIDI, PUSH as _PUSH } from "../constants/permission-name.js";

type MIDI = typeof _MIDI;
type PUSH = typeof _PUSH;

export type PermissionDescriptor<Name extends string> =
  | (MIDI extends Name ? MidiPermissionDescriptor : never)
  | (PUSH extends Name ? PushPermissionDescriptor : never)
  | (Exclude<Name, MIDI | PUSH> extends never
      ? never
      : GenericPermissionDescriptor<Exclude<Name, MIDI | PUSH>>);

interface MidiPermissionDescriptor extends GenericPermissionDescriptor<MIDI> {
  sysex?: boolean;
}

interface PushPermissionDescriptor extends GenericPermissionDescriptor<PUSH> {
  userVisibleOnly?: boolean;
}

interface GenericPermissionDescriptor<Name extends string> {
  name: Name;
}

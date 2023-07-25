import { StdEventTarget } from "./types/std.js";

export class BaseEventTarget extends StdEventTarget {}

export function normalizeOptions(
  options: AddEventListenerOptions | boolean | undefined,
): AddEventListenerOptions {
  return typeof options === "boolean" ? { capture: options } : options ?? {};
}

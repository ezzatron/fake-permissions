export function normalizeOptions(
  options: AddEventListenerOptions | boolean | undefined,
): AddEventListenerOptions {
  return typeof options === "boolean" ? { capture: options } : options ?? {};
}

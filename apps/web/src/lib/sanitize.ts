const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/g;

export function sanitize(value: string) {
  return value.replace(CONTROL_CHAR_PATTERN, '').trim();
}

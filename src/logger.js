export function logError(message, error) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(message, error);
  }
}

// SPDX-License-Identifier: Apache-2.0

let installed = false;

/**
 * Logs uncaught JS errors, then defers to React Native's default handler so
 * fatal errors still crash visibly instead of leaving a broken app running.
 */
export function installGlobalErrorHandler(): void {
  if (installed) {
    return;
  }
  installed = true;
  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    console.error(isFatal ? 'Fatal JS error' : 'Uncaught JS error', error);
    previous(error, isFatal);
  });
}

// SPDX-License-Identifier: Apache-2.0
import generated from './licences.generated.json';

/** One open-source package shipped with the app. */
export interface LicencedPackage {
  name: string;
  version: string;
  /** SPDX licence expression, e.g. `MIT` or `(MIT OR Apache-2.0)`. */
  licence: string;
  repository: string | null;
  /** Index into {@link licenceTexts}, or null when the package ships no licence file. */
  text: number | null;
}

/** Generated on install by scripts/generate-licences.mjs from the production dependencies. */
export const licencedPackages: readonly LicencedPackage[] = generated.packages;

/** De-duplicated licence texts referenced by {@link LicencedPackage.text}. */
export const licenceTexts: readonly string[] = generated.texts;

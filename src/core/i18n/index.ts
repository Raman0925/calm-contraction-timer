// SPDX-License-Identifier: Apache-2.0
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';

/** Languages bundled with the app. Add `hi` here once its strings are translated. */
export const resources = {
  en: { translation: en },
} as const;

export type SupportedLanguage = keyof typeof resources;

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

/** Initialises i18next synchronously with the bundled resources. Safe to call more than once. */
export function initI18n(language: SupportedLanguage = DEFAULT_LANGUAGE): typeof i18next {
  if (!i18next.isInitialized) {
    i18next
      .use(initReactI18next)
      .init({
        resources,
        lng: language,
        fallbackLng: DEFAULT_LANGUAGE,
        initAsync: false,
        interpolation: { escapeValue: false },
        returnNull: false,
      })
      .catch((error: unknown) => {
        console.error('i18n failed to initialise', error);
      });
  }
  return i18next;
}

export { i18next as i18n };

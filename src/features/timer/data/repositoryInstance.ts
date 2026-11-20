// SPDX-License-Identifier: Apache-2.0
import { getAppDatabase } from '@core/db/client';
import type { ContractionRepository } from './contractionRepository';
import { DrizzleContractionRepository } from './DrizzleContractionRepository';

let repository: Promise<ContractionRepository> | undefined;

/** The app-wide repository, so every writer notifies the same subscribers. */
export function getContractionRepository(): Promise<ContractionRepository> {
  repository ??= getAppDatabase().then(db => new DrizzleContractionRepository(db));
  repository.catch(() => {
    repository = undefined;
  });
  return repository;
}

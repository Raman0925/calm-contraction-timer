// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';
import type { Contraction } from '../domain/contraction';
import type { ContractionRepository } from '../data/contractionRepository';

/** All stored contractions, oldest first; null until the first load finishes. Reloads on every write. */
export function useContractions(repository: ContractionRepository): Contraction[] | null {
  const [contractions, setContractions] = useState<Contraction[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      repository
        .listAll()
        .then(list => {
          if (!cancelled) {
            setContractions(list);
          }
        })
        .catch((error: unknown) => {
          console.error('Loading contractions failed', error);
        });
    };
    load();
    const unsubscribe = repository.subscribe(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [repository]);

  return contractions;
}

// SPDX-License-Identifier: Apache-2.0

/** Outcome of an operation that can fail in an expected way. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Wraps a successful value. */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/** Wraps an expected failure. */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

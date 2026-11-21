// SPDX-License-Identifier: Apache-2.0
import NativeLiveUpdate from './NativeLiveUpdate';

/** Promotes the ongoing notification to a Live Update where Android supports it. */
export interface LiveUpdate {
  promote(channelId: string, shortText: string, postedWhen: number): Promise<boolean>;
}

/** LiveUpdate backed by the Kotlin TurboModule; a no-op below Android 16. */
export const nativeLiveUpdate: LiveUpdate = {
  promote: (channelId, shortText, postedWhen) =>
    NativeLiveUpdate.promote(channelId, shortText, postedWhen),
};

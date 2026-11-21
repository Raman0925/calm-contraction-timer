// SPDX-License-Identifier: Apache-2.0
import type { AdsService, ConsentState } from './adsService';
import { useAdsStore } from './adsStore';

const log = (what: string) => (error: unknown) => {
  console.error(what, error);
};

/**
 * Consent first, ads second. On launch, consent from the previous session is
 * used straight away while fresh consent is gathered (showing the form when
 * required); a late stored answer never overrides a fresh one. The SDK is
 * initialised once, only when ads may be requested. If gathering fails, a
 * later `start()` (e.g. when the app returns to the foreground) tries again.
 * Every failure is caught, so ads can never affect the rest of the app.
 */
export class AdsController {
  private gathered = false;
  private running: Promise<void> | null = null;
  private initializing: Promise<void> | null = null;

  constructor(private readonly ads: AdsService) {}

  /** Runs the consent flow until it succeeds once this launch. */
  start(): Promise<void> {
    if (this.gathered) {
      return Promise.resolve();
    }
    this.running ??= this.run().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  /** Lets the user change their consent choice (Settings → Privacy options). */
  async showPrivacyOptions(): Promise<void> {
    try {
      this.apply(await this.ads.showPrivacyOptions());
    } catch (error) {
      log('Showing privacy options failed')(error);
    }
  }

  private async run(): Promise<void> {
    const cached = this.ads
      .cachedConsent()
      .then(state => {
        if (!this.gathered) {
          this.apply(state);
        }
      })
      .catch(log('Reading stored consent failed'));
    const fresh = this.ads
      .gatherConsent()
      .then(state => {
        this.gathered = true;
        this.apply(state);
      })
      .catch(log('Gathering consent failed'));
    await Promise.all([cached, fresh]);
  }

  private apply(state: ConsentState): void {
    useAdsStore.setState({
      canRequestAds: state.canRequestAds,
      privacyOptionsRequired: state.privacyOptionsRequired,
    });
    if (state.canRequestAds) {
      this.initializeOnce();
    }
  }

  private initializeOnce(): void {
    this.initializing ??= this.ads
      .initialize()
      .then(() => {
        useAdsStore.setState({ ready: true });
      })
      .catch((error: unknown) => {
        log('Starting the ads SDK failed')(error);
        this.initializing = null;
      });
  }
}

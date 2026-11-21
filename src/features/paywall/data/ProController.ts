// SPDX-License-Identifier: Apache-2.0
import { PRO_PRODUCT_ID } from '@core/config';
import {
  needsAcknowledgement,
  proOwnership,
  type BillingErrorKind,
  type ProOwnership,
  type StorePurchase,
} from '../domain/entitlement';
import { BillingError, type BillingService } from './billingService';
import { useProStore } from './proStore';

const log = (what: string) => (error: unknown) => {
  console.error(what, error);
};

/** Outcome of asking the store what this account owns. */
export type RestoreResult = 'owned' | 'none' | 'error';

/**
 * Runs the Pro purchase lifecycle: connect, restore owned purchases,
 * acknowledge them within Google Play's 3-day window, and handle pending,
 * cancelled and failed purchases. Every failure is caught here, so billing
 * can never affect the timer.
 */
export class ProController {
  private connecting: Promise<boolean> | null = null;
  /** Counts purchase events, so a restore that started earlier never revokes a newer purchase. */
  private purchaseEvents = 0;

  constructor(
    private readonly billing: BillingService,
    private readonly productId: string = PRO_PRODUCT_ID,
  ) {}

  /** Connects, loads the price and restores. Safe when the store is unavailable. */
  async start(): Promise<void> {
    if (await this.ensureConnected()) {
      await Promise.all([this.loadOffer(), this.restore()]);
    }
  }

  /** Reconnects if an earlier attempt failed and loads a missing price; e.g. when the paywall opens. */
  async refresh(): Promise<void> {
    if ((await this.ensureConnected()) && !useProStore.getState().offer) {
      await this.loadOffer();
    }
  }

  async stop(): Promise<void> {
    this.connecting = null;
    await this.billing.disconnect().catch(log('Disconnecting from Google Play failed'));
  }

  /** Asks the store what this account owns; also revokes Pro after a refund. */
  async restore(): Promise<RestoreResult> {
    if (!(await this.ensureConnected())) {
      return 'error';
    }
    const eventsBefore = this.purchaseEvents;
    try {
      const purchases = await this.billing.ownedPurchases();
      // A purchase that arrived while we were asking is newer than this answer.
      const ownership = await this.apply(purchases, eventsBefore === this.purchaseEvents);
      return ownership === 'owned' ? 'owned' : 'none';
    } catch (error) {
      log('Restoring purchases failed')(error);
      return 'error';
    }
  }

  /** Opens the Google Play purchase sheet; the outcome arrives through the store listener. */
  async buy(): Promise<void> {
    if (!(await this.ensureConnected())) {
      this.fail('unavailable');
      return;
    }
    useProStore.setState({ status: 'purchasing', error: null });
    try {
      await this.billing.buyPro();
    } catch (error) {
      this.fail(error instanceof BillingError ? error.kind : 'failed');
    }
  }

  private ensureConnected(): Promise<boolean> {
    this.connecting ??= this.billing
      .connect({
        onPurchase: purchase => {
          this.purchaseEvents += 1;
          this.apply([purchase], false).catch(log('Handling a purchase failed'));
        },
        onError: kind => {
          this.fail(kind);
        },
      })
      .then(() => true)
      .catch((error: unknown) => {
        log('Connecting to Google Play failed')(error);
        this.connecting = null;
        return false;
      });
    return this.connecting;
  }

  private async loadOffer(): Promise<void> {
    const offer = await this.billing.fetchPro().catch((error: unknown) => {
      log('Loading the Pro price failed')(error);
      return null;
    });
    useProStore.setState({ offer });
  }

  /**
   * Acknowledges completed purchases, then grants Pro or marks it pending. Only
   * a complete, up-to-date list (a restore) may revoke Pro.
   */
  private async apply(purchases: StorePurchase[], complete: boolean): Promise<ProOwnership> {
    for (const purchase of needsAcknowledgement(purchases, this.productId)) {
      // Pro is granted even if this fails; the next restore retries within Play's 3-day window.
      await this.billing.acknowledge(purchase).catch(log('Acknowledging Pro failed'));
    }
    const ownership = proOwnership(purchases, this.productId);
    if (ownership === 'owned') {
      useProStore.setState({ isPro: true, status: 'idle', error: null });
    } else if (ownership === 'pending') {
      useProStore.setState({ status: 'pending', error: null });
    } else if (complete) {
      useProStore.setState({ isPro: false, status: 'idle' });
    } else {
      // A purchase event in an unknown state: stop showing "purchasing".
      useProStore.setState(state => (state.status === 'purchasing' ? { status: 'idle' } : {}));
    }
    return ownership;
  }

  private fail(kind: BillingErrorKind): void {
    if (kind === 'already-owned') {
      this.restore().catch(log('Restoring after already-owned failed'));
      return;
    }
    if (kind === 'cancelled') {
      useProStore.setState({ status: 'idle', error: null });
      return;
    }
    useProStore.setState(
      kind === 'pending' ? { status: 'pending', error: null } : { status: 'error', error: kind },
    );
  }
}

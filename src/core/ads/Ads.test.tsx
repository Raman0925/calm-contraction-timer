// SPDX-License-Identifier: Apache-2.0
import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { BannerAd } from 'react-native-google-mobile-ads';
import { App } from '@app/App';
import { AppThemeProvider } from '@core/design';
import { useProStore } from '@features/paywall/data/proStore';
import { FakeBilling } from '@features/paywall/data/testing/FakeBilling';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { createTestServices } from '@features/timer/ui/testing/createTestServices';
import { TimerScreen } from '@features/timer/ui/TimerScreen';
import { TimerServicesProvider } from '@features/timer/ui/TimerServices';
import { AdsProvider } from './AdsProvider';
import { useAdsStore } from './adsStore';
import { FakeAds } from './testing/FakeAds';

async function openApp(ads: FakeAds, pro = false) {
  const setup = await createTestServices();
  const billing = new FakeBilling();
  billing.owned = pro ? [billing.proPurchase('purchased', true)] : [];
  useProStore.setState({ isPro: pro });
  await render(<App services={setup.services} billing={billing} ads={ads} />);
  await screen.findByTestId('timer-screen');
}

async function openTab(name: RegExp) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

/** Gives the banner container a size, as the device would. */
async function layOutBanner() {
  await fireEvent(await screen.findByTestId('history-ad'), 'layout', {
    nativeEvent: { layout: { width: 328, height: 0 } },
  });
}

describe('Ads', () => {
  beforeEach(() => {
    useAdsStore.setState({ canRequestAds: false, ready: false, privacyOptionsRequired: false });
    jest.mocked(BannerAd).mockClear();
  });

  it('shows one banner at the bottom of History, sized to its container', async () => {
    await openApp(new FakeAds());
    await openTab(/History/);
    await layOutBanner();
    expect(screen.getByTestId('banner-ad')).toBeOnTheScreen();
    expect(jest.mocked(BannerAd).mock.calls.at(-1)?.[0]).toMatchObject({ width: 328 });
  });

  it('never shows ads on the timer screen, even when ads are ready', async () => {
    useAdsStore.setState({ canRequestAds: true, ready: true });
    const setup = await createTestServices();
    await render(
      <NavigationContainer>
        <TimerServicesProvider services={setup.services}>
          <AdsProvider ads={new FakeAds()} enabled>
            <AppThemeProvider preference="light" autoNight={false} sessionActive={false}>
              <TimerScreen />
            </AppThemeProvider>
          </AdsProvider>
        </TimerServicesProvider>
      </NavigationContainer>,
    );
    await screen.findByTestId('timer-screen');
    expect(screen.queryByTestId('banner-ad')).toBeNull();
  });

  it('removes the banner when no ad loads', async () => {
    await openApp(new FakeAds());
    await openTab(/History/);
    await layOutBanner();
    await act(() => {
      jest.mocked(BannerAd).mock.calls.at(-1)?.[0].onAdFailedToLoad?.(new Error('no fill'));
    });
    expect(screen.queryByTestId('history-ad')).toBeNull();
  });

  it('shows no banner without consent', async () => {
    const ads = new FakeAds();
    ads.fresh = { canRequestAds: false, privacyOptionsRequired: true };
    await openApp(ads);
    await openTab(/History/);
    await screen.findByTestId('history-screen');
    expect(screen.queryByTestId('history-ad')).toBeNull();
  });

  it('never starts consent or ads for Pro users', async () => {
    const ads = new FakeAds();
    await openApp(ads, true);
    await openTab(/History/);
    await screen.findByTestId('history-screen');
    expect(screen.queryByTestId('history-ad')).toBeNull();
    expect(ads.gatherCalls).toBe(0);
    expect(ads.initializeCalls).toBe(0);
  });

  it('removes the banner as soon as Pro is bought', async () => {
    await openApp(new FakeAds());
    await openTab(/History/);
    await layOutBanner();
    await act(() => {
      useProStore.setState({ isPro: true });
    });
    expect(screen.queryByTestId('history-ad')).toBeNull();
  });

  it('does not show the consent form mid-session when Pro is lost', async () => {
    const ads = new FakeAds();
    await openApp(ads, true);
    await act(() => {
      useProStore.setState({ isPro: false });
    });
    await openTab(/History/);
    await screen.findByTestId('history-screen');
    expect(ads.gatherCalls).toBe(0);
  });

  it('waits for the medical disclaimer before asking for consent', async () => {
    useSettingsStore.setState({ disclaimerAcceptedAt: null });
    const ads = new FakeAds();
    const setup = await createTestServices();
    await render(<App services={setup.services} billing={new FakeBilling()} ads={ads} />);
    await screen.findByTestId('onboarding-screen');
    expect(ads.gatherCalls).toBe(0);

    await act(() => {
      useSettingsStore.setState({ disclaimerAcceptedAt: Date.UTC(2026, 0, 1) });
    });
    await waitFor(() => {
      expect(ads.gatherCalls).toBe(1);
    });
  });

  it('opens privacy options from Settings where the law requires them', async () => {
    const ads = new FakeAds();
    ads.fresh = { canRequestAds: true, privacyOptionsRequired: true };
    ads.afterPrivacyOptions = { canRequestAds: false, privacyOptionsRequired: true };
    await openApp(ads);
    await openTab(/Settings/);
    await fireEvent.press(await screen.findByTestId('privacy-options'));
    await waitFor(() => {
      expect(useAdsStore.getState().canRequestAds).toBe(false);
    });
  });

  it('hides privacy options where they are not required', async () => {
    await openApp(new FakeAds());
    await openTab(/Settings/);
    await screen.findByTestId('settings-screen');
    expect(screen.queryByTestId('privacy-options')).toBeNull();
  });
});

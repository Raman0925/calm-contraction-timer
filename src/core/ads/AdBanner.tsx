// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { Divider, spacing } from '@core/design';
import { appConfig } from '@core/native/appConfig';
import { useAds } from './AdsProvider';

/**
 * One anchored adaptive banner, separated from the content above by a divider
 * and at least 8 dp. It is sized to its container so it never overhangs the
 * screen padding. Renders nothing until consent allows ads, and disappears if
 * no ad loads. No targeting data is sent with the request.
 */
export function AdBanner({ testID }: { testID?: string }) {
  const { canShowAds } = useAds();
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(0);

  if (!canShowAds || failed) {
    return null;
  }
  return (
    <View
      style={styles.root}
      testID={testID}
      onLayout={event => {
        setWidth(Math.floor(event.nativeEvent.layout.width));
      }}
    >
      <Divider />
      {width > 0 ? (
        <BannerAd
          unitId={appConfig.adBannerUnitId()}
          size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
          width={width}
          onAdFailedToLoad={error => {
            console.warn('Banner did not load', error.message);
            setFailed(true);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: spacing.sm, gap: spacing.sm, alignSelf: 'stretch', alignItems: 'center' },
});

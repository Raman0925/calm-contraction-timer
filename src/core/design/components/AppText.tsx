// SPDX-License-Identifier: Apache-2.0
import type { ComponentProps } from 'react';
import { Text } from 'react-native-paper';

/** Props for {@link AppText}; same as Paper's Text with an MD3 typescale `variant`. */
export type AppTextProps = ComponentProps<typeof Text>;

/** Themed text. Always pick a typescale `variant` rather than a raw font size. */
export function AppText(props: AppTextProps) {
  return <Text {...props} />;
}

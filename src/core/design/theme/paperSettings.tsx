// SPDX-License-Identifier: Apache-2.0
import type { ComponentProps } from 'react';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import type { PaperProvider } from 'react-native-paper';

type PaperSettings = NonNullable<ComponentProps<typeof PaperProvider>['settings']>;
type GlyphName = ComponentProps<typeof MaterialDesignIcons>['name'];

/**
 * Renders Paper's built-in icons (radio checks, switches, buttons) with the
 * statically linked Material Design Icons font.
 */
export const paperSettings: PaperSettings = {
  icon: ({ name, color, size, testID }) => (
    <MaterialDesignIcons
      name={name as GlyphName}
      color={color}
      size={size}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  ),
};

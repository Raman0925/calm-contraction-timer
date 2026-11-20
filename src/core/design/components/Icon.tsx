// SPDX-License-Identifier: Apache-2.0
import type { ComponentProps } from 'react';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { useAppTheme } from '../theme/useAppTheme';

/** Any Material Design Icons glyph name. */
export type IconName = ComponentProps<typeof MaterialDesignIcons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  /** Defaults to the theme's `onSurface` colour. */
  color?: string;
}

/** Decorative icon. Hidden from screen readers; put meaning in nearby text or labels. */
export function Icon({ name, size = 24, color }: IconProps) {
  const theme = useAppTheme();
  return (
    <MaterialDesignIcons
      name={name}
      size={size}
      color={color ?? theme.colors.onSurface}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

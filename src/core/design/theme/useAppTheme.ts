// SPDX-License-Identifier: Apache-2.0
import { useTheme } from 'react-native-paper';
import type { AppTheme } from './themes';

/** Returns the active app theme. Use this instead of Paper's `useTheme`. */
export const useAppTheme = (): AppTheme => useTheme<AppTheme>();

// SPDX-License-Identifier: Apache-2.0
import { AppRegistry } from 'react-native';
import { App } from './src/app/App';
import { registerBackgroundNotificationHandler } from './src/features/timer/data/notificationEvents';
import { name as appName } from './app.json';

// Must be registered before the app component so lock-screen Start/Stop works when the app is killed.
registerBackgroundNotificationHandler();

AppRegistry.registerComponent(appName, () => App);

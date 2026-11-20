// SPDX-License-Identifier: Apache-2.0
import { Screen } from '@core/design';
import { AboutSection } from './AboutSection';
import { AppearanceSection } from './AppearanceSection';
import { ContactsSection } from './ContactsSection';
import { DataSection } from './DataSection';
import { PatternSection } from './PatternSection';
import { TimerSection } from './TimerSection';

/** App settings, one section per topic. */
export function SettingsScreen() {
  return (
    <Screen testID="settings-screen">
      <PatternSection />
      <TimerSection />
      <ContactsSection />
      <AppearanceSection />
      <DataSection />
      <AboutSection />
    </Screen>
  );
}

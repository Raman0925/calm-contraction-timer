// SPDX-License-Identifier: Apache-2.0
import { Screen } from '@core/design';
import { BackupSection } from '@features/backup/ui/BackupSection';
import { AboutSection } from './AboutSection';
import { AppearanceSection } from './AppearanceSection';
import { ContactsSection } from './ContactsSection';
import { DataSection } from './DataSection';
import { PatternSection } from './PatternSection';
import { ProSection } from './ProSection';
import { TimerSection } from './TimerSection';

/** App settings, one section per topic. */
export function SettingsScreen() {
  return (
    <Screen testID="settings-screen">
      <PatternSection />
      <TimerSection />
      <ContactsSection />
      <AppearanceSection />
      <ProSection />
      <BackupSection />
      <DataSection />
      <AboutSection />
    </Screen>
  );
}

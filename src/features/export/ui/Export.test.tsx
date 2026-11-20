// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PDFDocument } from 'pdf-lib';
import { App } from '@app/App';
import { MINUTE_MS, SECOND_MS } from '@core/utils/time';
import { createTestServices } from '@features/timer/ui/testing/createTestServices';
import type { FileSharer, SharedFile } from '../data/fileSharer';

const NOW = Date.UTC(2026, 0, 11, 9, 0);

async function openExport(sharer: FileSharer) {
  const setup = await createTestServices(NOW);
  setup.notifier.permitted = true;
  for (const minutesAgo of [20, 15, 10]) {
    const start = NOW - minutesAgo * MINUTE_MS;
    await setup.services.repository.start(start);
    await setup.services.repository.stop(start + 60 * SECOND_MS);
  }
  await setup.services.repository.update(2, { note: 'waters, "broke"' });
  await render(<App services={setup.services} fileSharer={sharer} />);
  await screen.findByTestId('timer-screen');
  await fireEvent.press(screen.getByRole('button', { name: /History/ }));
  await fireEvent.press(await screen.findByRole('button', { name: /3 contractions/ }));
  await fireEvent.press(await screen.findByTestId('export-session'));
  await screen.findByTestId('export-screen');
}

function recordingSharer() {
  const shared: SharedFile[] = [];
  const sharer: FileSharer = {
    share: file => {
      shared.push(file);
      return Promise.resolve();
    },
    clearExports: () => Promise.resolve(),
  };
  return { shared, sharer };
}

describe('Export', () => {
  it('shares the session as CSV', async () => {
    const { shared, sharer } = recordingSharer();
    await openExport(sharer);
    await fireEvent.press(screen.getByTestId('export-csv'));

    await waitFor(() => {
      expect(shared).toHaveLength(1);
    });
    expect(shared[0]).toMatchObject({
      fileName: 'contractions-2026-01-11.csv',
      mimeType: 'text/csv',
      encoding: 'utf8',
    });
    const lines = shared[0]?.contents.slice(1).trim().split('\r\n') ?? [];
    expect(lines).toHaveLength(4);
    expect(lines[2]).toContain('"waters, ""broke"""');
  });

  it('shares a PDF doctor report', async () => {
    const { shared, sharer } = recordingSharer();
    await openExport(sharer);
    await fireEvent.press(screen.getByTestId('export-pdf'));

    await waitFor(() => {
      expect(shared).toHaveLength(1);
    });
    expect(shared[0]).toMatchObject({
      fileName: 'contraction-report-2026-01-11.pdf',
      mimeType: 'application/pdf',
      encoding: 'base64',
    });
    const pdf = await PDFDocument.load(shared[0]?.contents ?? '');
    expect(pdf.getTitle()).toBe('Contraction report');
  });

  it('says so when sharing fails', async () => {
    await openExport({
      share: () => Promise.reject(new Error('disk full')),
      clearExports: () => Promise.resolve(),
    });
    await fireEvent.press(screen.getByTestId('export-csv'));
    expect(
      await screen.findByText('Could not create the file. Please try again.'),
    ).toBeOnTheScreen();
  });
});

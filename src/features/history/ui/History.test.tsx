// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { App } from '@app/App';
import { HOUR_MS, MINUTE_MS, SECOND_MS } from '@core/utils/time';
import { createTestServices } from '@features/timer/ui/testing/createTestServices';

type Setup = Awaited<ReturnType<typeof createTestServices>>;

const NOW = Date.UTC(2026, 0, 11, 9, 0);

/** Records a finished contraction `minutesAgo` before NOW, lasting `seconds`. */
async function record(setup: Setup, minutesAgo: number, seconds: number) {
  const start = NOW - minutesAgo * MINUTE_MS;
  await setup.services.repository.start(start);
  await setup.services.repository.stop(start + seconds * SECOND_MS);
}

async function openHistory(setup: Setup) {
  await render(<App services={setup.services} />);
  await screen.findByTestId('timer-screen');
  await fireEvent.press(screen.getByRole('button', { name: /History/ }));
  await screen.findByTestId('history-screen');
}

async function openOnlySession(setup: Setup) {
  await openHistory(setup);
  await fireEvent.press(await screen.findByRole('button', { name: /3 contractions/ }));
  await screen.findByTestId('contraction-list');
}

describe('History', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await createTestServices(NOW);
    setup.notifier.permitted = true;
  });

  it('shows an empty state before any contractions', async () => {
    await openHistory(setup);
    expect(screen.getByText('No sessions yet')).toBeOnTheScreen();
  });

  it('lists sessions newest first with their summary', async () => {
    await record(setup, 30 * 60, 50);
    for (const minutesAgo of [20, 15, 10]) {
      await record(setup, minutesAgo, 60);
    }
    await openHistory(setup);

    const cards = await screen.findAllByRole('button', { name: /contraction/ });
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAccessibleName(/3 contractions.*Average length 01:00 · every 5\.0 min/);
    expect(cards[1]).toHaveAccessibleName(/1 contraction · Average length 00:50$/);
  });

  it('shows a session with charts and every contraction', async () => {
    for (const minutesAgo of [20, 15, 10]) {
      await record(setup, minutesAgo, 60);
    }
    await openOnlySession(setup);
    expect(screen.getByTestId('duration-chart')).toHaveAccessibleName(
      /Longest 01:00, shortest 01:00/,
    );
    expect(screen.getByTestId('interval-chart')).toBeOnTheScreen();
    expect(within(screen.getByTestId('contraction-list')).getAllByRole('button')).toHaveLength(3);
  });

  it('edits intensity and note, and undoes the edit', async () => {
    for (const minutesAgo of [20, 15, 10]) {
      await record(setup, minutesAgo, 60);
    }
    await openOnlySession(setup);
    await fireEvent.press(screen.getByTestId('contraction-3'));
    await fireEvent.press(await screen.findByRole('radio', { name: '2 · Moderate' }));
    await fireEvent.changeText(screen.getByTestId('editor-note'), 'Waters broke');
    await fireEvent.press(screen.getByTestId('editor-save'));

    expect(await screen.findByText(/Intensity 2 of 3 · Waters broke/)).toBeOnTheScreen();
    await fireEvent.press(await screen.findByText('Undo'));
    await waitFor(() => {
      expect(screen.queryByText(/Waters broke/)).toBeNull();
    });
    expect(
      within(screen.getByTestId('contraction-3')).getByText(
        'Lasted 01:00 · 5.0 min after the previous one · Rest 04:00',
      ),
    ).toBeOnTheScreen();
  });

  it('moves the start time with the stepper', async () => {
    for (const minutesAgo of [20, 15, 10]) {
      await record(setup, minutesAgo, 60);
    }
    await openOnlySession(setup);
    await fireEvent.press(screen.getByTestId('contraction-3'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Earlier by 1 minute' }));
    await fireEvent.press(screen.getByTestId('editor-save'));
    expect(await screen.findByText(/4\.0 min after the previous one/)).toBeOnTheScreen();
  });

  it('refuses an edit that would put a contraction after the running one', async () => {
    await record(setup, 20, 60);
    await setup.services.repository.start(NOW - 5 * MINUTE_MS);
    await openHistory(setup);
    await fireEvent.press(await screen.findByRole('button', { name: /2 contractions/ }));
    await fireEvent.press(await screen.findByTestId('contraction-1'));
    const later = await screen.findByRole('button', { name: 'Later by 1 minute' });
    for (let i = 0; i < 20; i += 1) {
      await fireEvent.press(later);
    }
    await fireEvent.press(screen.getByTestId('editor-save'));
    expect(await screen.findByText(/clash with the contraction that is running/)).toBeOnTheScreen();
  });

  it('deletes a contraction and brings it back with Undo, even the first one', async () => {
    for (const minutesAgo of [20, 15, 10]) {
      await record(setup, minutesAgo, 60);
    }
    await openOnlySession(setup);
    await fireEvent.press(screen.getByTestId('contraction-1'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Contraction deleted')).toBeOnTheScreen();
    expect(screen.queryByTestId('contraction-1')).toBeNull();
    expect(screen.getByTestId('contraction-2')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Undo'));
    expect(await screen.findByTestId('contraction-1')).toBeOnTheScreen();
  });

  it('shows when a session is gone, and Undo brings it back', async () => {
    await record(setup, 10, 60);
    await openHistory(setup);
    await fireEvent.press(await screen.findByRole('button', { name: /1 contraction ·/ }));
    await fireEvent.press(await screen.findByTestId('contraction-1'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('This session no longer exists.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Undo'));
    expect(await screen.findByTestId('contraction-1')).toBeOnTheScreen();
  });

  it('edits the running contraction without stopping it', async () => {
    await record(setup, 10, 60);
    await setup.services.repository.start(NOW - 2 * MINUTE_MS);
    await openHistory(setup);
    await fireEvent.press(await screen.findByRole('button', { name: /2 contractions/ }));
    await fireEvent.press(await screen.findByTestId('contraction-2'));
    expect(screen.getByRole('button', { name: 'Longer by 1 minute' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('radio', { name: '3 · Strong' }));
    await fireEvent.press(screen.getByTestId('editor-save'));

    expect(await screen.findByText(/Still running · .*Intensity 3 of 3/)).toBeOnTheScreen();
    expect(await setup.services.repository.getActive()).toMatchObject({ id: 2, intensity: 3 });
  });

  it('keeps a long-past session separate from today', async () => {
    await record(setup, (2 * 24 * HOUR_MS) / MINUTE_MS, 60);
    await record(setup, 5, 60);
    await openHistory(setup);
    expect(await screen.findAllByRole('button', { name: /1 contraction ·/ })).toHaveLength(2);
  });
});

/**
 * @jest-environment node
 */
// SPDX-License-Identifier: Apache-2.0
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { computeStats } from '@features/timer/domain/computeStats';
import { series } from '@features/timer/domain/testing/builders';
import { DEFAULT_THRESHOLDS } from '@features/timer/domain/thresholds';
import { buildPdfReport, type ReportText } from './pdfReport';
import { canDrawAll, drawable, fitWidth, wrap } from './pdfText';

const BASE = Date.UTC(2026, 0, 10, 8, 0);

function reportFor(
  count: number,
  note = 'ok',
): { text: ReportText; items: ReturnType<typeof computeStats>['items'] } {
  const items = computeStats(series(BASE, count, 5, 60), DEFAULT_THRESHOLDS, BASE).items;
  return {
    items,
    text: {
      title: 'Contraction report',
      details: ['Sat 10 Jan, 08:00 – 09:00'],
      summary: ['12 contractions', 'Pattern matches your 5-1-1 setting for 62 min'],
      chartTitle: 'Length of each contraction (seconds)',
      columns: ['Start', 'Length', 'Every', 'Rest', 'Intensity', 'Note'],
      rows: items.map(() => ['08:00', '01:00', '5.0 min', '04:00', '2', note]),
      disclaimer: 'For information only. This is not medical advice.',
      undrawableNotice: 'Some characters could not be shown.',
      pageLabel: (page, pages) => `Page ${page} of ${pages}`,
    },
  };
}

describe('buildPdfReport', () => {
  it('produces a valid one-page PDF for a short session', async () => {
    const { text, items } = reportFor(12);
    const pdf = await PDFDocument.load(await buildPdfReport(text, items));
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getTitle()).toBe('Contraction report');
  });

  it('flows a long table onto more pages', async () => {
    const { text, items } = reportFor(120);
    const pdf = await PDFDocument.load(await buildPdfReport(text, items));
    expect(pdf.getPageCount()).toBeGreaterThan(2);
  });

  it('leaves out the chart while the only contraction is still running', async () => {
    const items = computeStats(
      [{ id: 1, startedAt: BASE, endedAt: null, intensity: null, note: null }],
      DEFAULT_THRESHOLDS,
      BASE,
    ).items;
    const { text } = reportFor(1);
    const pdf = await PDFDocument.load(await buildPdfReport({ ...text, rows: [['08:00']] }, items));
    expect(pdf.getPageCount()).toBe(1);
  });

  it('moves the chart to a new page when it does not fit', async () => {
    const { text, items } = reportFor(4);
    const longSummary = Array.from({ length: 48 }, (_, i) => `Summary line ${i}`);
    const pdf = await PDFDocument.load(
      await buildPdfReport({ ...text, summary: longSummary }, items),
    );
    expect(pdf.getPageCount()).toBe(2);
  });

  it('wraps long notes into taller rows instead of dropping them', async () => {
    const longNote = 'Back pain spreading to the front, easing with movement. '.repeat(9);
    const short = await PDFDocument.load(
      await buildPdfReport(reportFor(40).text, reportFor(40).items),
    );
    const { text, items } = reportFor(40, longNote);
    const long = await PDFDocument.load(await buildPdfReport(text, items));
    expect(long.getPageCount()).toBeGreaterThan(short.getPageCount());
  });

  it('notes when characters could not be shown', async () => {
    const { font, items, text } = await (async () => {
      const r = reportFor(2, 'दर्द');
      const doc = await PDFDocument.create();
      return { ...r, font: await doc.embedFont(StandardFonts.Helvetica) };
    })();
    expect(canDrawAll(font, 'दर्द')).toBe(false);
    expect(canDrawAll(font, 'café')).toBe(true);
    await expect(buildPdfReport(text, items)).resolves.toEqual(expect.any(String));
  });

  it('survives notes the font cannot draw', async () => {
    const { text, items } = reportFor(3, 'दर्द 😣 back');
    await expect(buildPdfReport(text, items)).resolves.toEqual(expect.any(String));
  });
});

describe('pdf text helpers', () => {
  let font: Awaited<ReturnType<PDFDocument['embedFont']>>;

  beforeAll(async () => {
    font = await (await PDFDocument.create()).embedFont(StandardFonts.Helvetica);
  });

  it('replaces characters the font cannot encode and flattens line breaks', () => {
    expect(drawable(font, 'café – ok\nnext 😣')).toBe('café – ok next ?');
  });

  it('truncates to a width with an ellipsis', () => {
    const short = fitWidth(font, 'a very long note that will not fit', 9, 60);
    expect(short.endsWith('...')).toBe(true);
    expect(font.widthOfTextAtSize(short, 9)).toBeLessThanOrEqual(60);
  });

  it('wraps text into lines within a width', () => {
    const lines = wrap(font, 'one two three four five six seven eight', 10, 60);
    expect(lines.length).toBeGreaterThan(1);
    lines.forEach(line => {
      expect(font.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(60);
    });
  });
});

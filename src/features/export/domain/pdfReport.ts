// SPDX-License-Identifier: Apache-2.0
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { ContractionStat } from '@features/timer/domain/computeStats';
import { canDrawAll, fitWidth, wrap } from './pdfText';

/** All text in the report, already translated and formatted by the caller. */
export interface ReportText {
  title: string;
  /** Lines under the title: period, generated time, thresholds. */
  details: string[];
  /** Summary lines, e.g. count, averages and the neutral pattern statement. */
  summary: string[];
  chartTitle: string;
  columns: [string, string, string, string, string, string];
  /** One row per contraction, matching `columns`, in the same order as `items`. */
  rows: string[][];
  disclaimer: string;
  /** Shown under the table when some text used characters the PDF font cannot draw. */
  undrawableNotice: string;
  /** Page footer, e.g. "Page {page} of {pages}". */
  pageLabel: (page: number, pages: number) => string;
}

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const CONTENT_WIDTH = PAGE.width - 2 * MARGIN;
const FOOTER_TOP = 72;
const ROW_HEIGHT = 15;
const COLUMN_WIDTHS = [62, 58, 70, 58, 58, CONTENT_WIDTH - 306];
const INK = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.4, 0.4, 0.4);
const BAR = rgb(0.18, 0.44, 0.45);
const RULE = rgb(0.8, 0.8, 0.8);

interface Writer {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
}

function newPage(w: Writer): void {
  w.page = w.doc.addPage([PAGE.width, PAGE.height]);
  w.y = PAGE.height - MARGIN;
}

function text(w: Writer, value: string, size: number, font = w.regular, colour = INK): void {
  for (const line of wrap(font, value, size, CONTENT_WIDTH)) {
    if (w.y - size < FOOTER_TOP) {
      newPage(w);
    }
    w.page.drawText(line, { x: MARGIN, y: w.y - size, size, font, color: colour });
    w.y -= size * 1.4;
  }
}

/** Bars of each contraction's length in seconds on one baseline, scaled to the longest. */
function chart(w: Writer, title: string, items: ContractionStat[]): void {
  const durations = items.flatMap(item => (item.durationMs === null ? [] : [item.durationMs]));
  if (durations.length === 0) {
    return;
  }
  const height = 110;
  if (w.y - height - 40 < FOOTER_TOP) {
    newPage(w);
  }
  text(w, title, 11, w.bold);
  const max = Math.max(...durations, 1);
  const baseline = w.y - height;
  const slot = CONTENT_WIDTH / durations.length;
  durations.forEach((ms, index) => {
    const barHeight = (ms / max) * (height - 12);
    w.page.drawRectangle({
      x: MARGIN + index * slot + slot * 0.15,
      y: baseline,
      width: Math.max(1, slot * 0.7),
      height: barHeight,
      color: BAR,
    });
  });
  w.page.drawLine({
    start: { x: MARGIN, y: baseline },
    end: { x: MARGIN + CONTENT_WIDTH, y: baseline },
    thickness: 0.5,
    color: MUTED,
  });
  w.page.drawText(`${Math.round(max / 1000)} s`, {
    x: MARGIN,
    y: baseline + height - 8,
    size: 8,
    font: w.regular,
    color: MUTED,
  });
  w.y = baseline - 20;
}

const LINE_HEIGHT = 11;
const MAX_NOTE_LINES = 6;

/**
 * One table row. The last column (the note) wraps onto up to six lines so
 * what the user wrote reaches the doctor; other cells are shortened to fit.
 */
function row(w: Writer, cells: string[], font: PDFFont): void {
  const lastIndex = cells.length - 1;
  const lines = cells.map((cell, index) => {
    const width = (COLUMN_WIDTHS[index] ?? 0) - 6;
    if (index !== lastIndex) {
      return [fitWidth(font, cell, 9, width)];
    }
    const wrapped = wrap(font, cell, 9, width);
    return wrapped.length > MAX_NOTE_LINES
      ? [
          ...wrapped.slice(0, MAX_NOTE_LINES - 1),
          fitWidth(font, wrapped.slice(MAX_NOTE_LINES - 1).join(' '), 9, width),
        ]
      : wrapped;
  });
  const height = Math.max(ROW_HEIGHT, Math.max(...lines.map(l => l.length)) * LINE_HEIGHT + 4);
  if (w.y - height < FOOTER_TOP) {
    newPage(w);
  }
  let x = MARGIN;
  lines.forEach((cellLines, index) => {
    cellLines.forEach((line, lineIndex) => {
      w.page.drawText(line, {
        x,
        y: w.y - 11 - lineIndex * LINE_HEIGHT,
        size: 9,
        font,
        color: INK,
      });
    });
    x += COLUMN_WIDTHS[index] ?? 0;
  });
  w.page.drawLine({
    start: { x: MARGIN, y: w.y - height + 1 },
    end: { x: MARGIN + CONTENT_WIDTH, y: w.y - height + 1 },
    thickness: 0.3,
    color: RULE,
  });
  w.y -= height;
}

function footers(w: Writer, report: ReportText): void {
  const pages = w.doc.getPages();
  pages.forEach((page, index) => {
    let y = FOOTER_TOP - 14;
    for (const line of wrap(w.regular, report.disclaimer, 7.5, CONTENT_WIDTH)) {
      page.drawText(line, { x: MARGIN, y, size: 7.5, font: w.regular, color: MUTED });
      y -= 10;
    }
    page.drawText(report.pageLabel(index + 1, pages.length), {
      x: MARGIN,
      y: 24,
      size: 8,
      font: w.regular,
      color: MUTED,
    });
  });
}

/**
 * Builds the doctor report: title, details, summary, a duration chart, the
 * full contraction table and a disclaimer footer on every page.
 * Returns the PDF as base64.
 */
export async function buildPdfReport(
  report: ReportText,
  items: ContractionStat[],
): Promise<string> {
  const doc = await PDFDocument.create();
  doc.setTitle(report.title);
  doc.setProducer('Calm Contraction Timer');
  const w: Writer = {
    doc,
    page: doc.addPage([PAGE.width, PAGE.height]),
    y: PAGE.height - MARGIN,
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  text(w, report.title, 18, w.bold);
  report.details.forEach(line => {
    text(w, line, 10, w.regular, MUTED);
  });
  w.y -= 8;
  report.summary.forEach(line => {
    text(w, line, 11);
  });
  w.y -= 12;
  chart(w, report.chartTitle, items);
  row(w, report.columns, w.bold);
  report.rows.forEach(cells => {
    row(w, cells, w.regular);
  });
  if (report.rows.some(cells => cells.some(cell => !canDrawAll(w.regular, cell)))) {
    w.y -= 8;
    text(w, report.undrawableNotice, 9, w.regular, MUTED);
  }
  footers(w, report);
  return doc.saveAsBase64();
}

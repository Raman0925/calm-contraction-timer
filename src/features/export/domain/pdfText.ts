// SPDX-License-Identifier: Apache-2.0
import type { PDFFont } from 'pdf-lib';

const REPLACEMENT = '?';
const supportCache = new WeakMap<PDFFont, Map<string, boolean>>();

function canDraw(font: PDFFont, char: string): boolean {
  let cache = supportCache.get(font);
  if (!cache) {
    cache = new Map();
    supportCache.set(font, cache);
  }
  let supported = cache.get(char);
  if (supported === undefined) {
    try {
      font.encodeText(char);
      supported = true;
    } catch {
      supported = false;
    }
    cache.set(char, supported);
  }
  return supported;
}

/** True when every character of `text` can be drawn with `font`. */
export function canDrawAll(font: PDFFont, text: string): boolean {
  return Array.from(text.replace(/\s+/g, ' ')).every(char => canDraw(font, char));
}

/**
 * Makes text drawable with a standard PDF font: line breaks become spaces and
 * characters the font cannot encode (e.g. emoji, non-Latin scripts) become `?`.
 */
export function drawable(font: PDFFont, text: string): string {
  return Array.from(text.replace(/\s+/g, ' '))
    .map(char => (canDraw(font, char) ? char : REPLACEMENT))
    .join('');
}

/** Shortens text with an ellipsis so it fits `maxWidth`. */
export function fitWidth(font: PDFFont, text: string, size: number, maxWidth: number): string {
  const safe = drawable(font, text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) {
    return safe;
  }
  let end = safe.length;
  while (end > 0 && font.widthOfTextAtSize(`${safe.slice(0, end)}...`, size) > maxWidth) {
    end -= 1;
  }
  return `${safe.slice(0, end)}...`;
}

/** Breaks text into lines no wider than `maxWidth`. */
export function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of drawable(font, text).split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  return line ? [...lines, line] : lines;
}

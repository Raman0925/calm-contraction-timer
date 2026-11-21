// SPDX-License-Identifier: Apache-2.0
/**
 * Renders brand PNGs from the SVG sources in assets/brand:
 * - Google Play icon (512x512) and feature graphic (1024x500)
 * - legacy launcher icons for Android 7 (adaptive icons cover Android 8+)
 * Run after changing the artwork: npm run brand:render
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const ICON = readFileSync('assets/brand/icon.svg', 'utf8');
const FEATURE = readFileSync('assets/brand/feature-graphic.svg', 'utf8');
const RES = 'android/app/src/main/res';
const DENSITIES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

function render(svg, width, out) {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: true },
  })
    .render()
    .asPng();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  console.log(`${out} (${width}px wide)`);
}

/** The icon clipped to a shape, as launchers before Android 8 show it. */
const clipped = shape =>
  ICON.replace(
    '<rect id="background"',
    `<defs><clipPath id="c">${shape}</clipPath></defs><g clip-path="url(#c)"><rect id="background"`,
  ).replace('</svg>', '</g></svg>');

const square = clipped('<rect width="108" height="108" rx="20"/>');
const round = clipped('<circle cx="54" cy="54" r="54"/>');

render(ICON, 512, 'assets/brand/play/icon-512.png');
render(FEATURE, 1024, 'assets/brand/play/feature-graphic-1024x500.png');
for (const [density, size] of Object.entries(DENSITIES)) {
  render(square, size, `${RES}/mipmap-${density}/ic_launcher.png`);
  render(round, size, `${RES}/mipmap-${density}/ic_launcher_round.png`);
}

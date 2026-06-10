// Captura de pantalla con Playwright para depurar el diseño responsive.
//
// Uso:
//   node scripts/screenshot.mjs [url] [width] [output] [--full] [--scroll=N]
//
// Ejemplos:
//   node scripts/screenshot.mjs                         -> mobile 390px, above-the-fold
//   node scripts/screenshot.mjs http://localhost:4321 390 mobile.png
//   node scripts/screenshot.mjs http://localhost:4321 1280 desktop.png --full
//   node scripts/screenshot.mjs http://localhost:4321 1280 s.png --scroll=0.5
//
// --full        captura la página completa (scroll incluido).
// --scroll=N    desplaza el scroll antes de capturar. N puede ser:
//                 - una fracción 0..1 del total scrolleable (ej. 0.5 = mitad)
//                 - un número de px > 1 (ej. 1200)
// Las capturas se guardan en .screenshots/ (ignorada por git).

import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const OUT_DIR = ".screenshots";
mkdirSync(OUT_DIR, { recursive: true });

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const positional = args.filter((a) => !a.startsWith("--"));

const url = positional[0] ?? "http://localhost:4321";
const width = Number(positional[1] ?? 390);
const output = `${OUT_DIR}/${positional[2] ?? `screenshot-${width}.png`}`;
const fullPage = flags.includes("--full");
const scrollFlag = flags.find((f) => f.startsWith("--scroll="));
const scroll = scrollFlag ? Number(scrollFlag.split("=")[1]) : null;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width, height: width < 768 ? Math.round(width * 1.9) : 800 },
  deviceScaleFactor: 2,
  isMobile: width < 768,
});

await page.goto(url, { waitUntil: "networkidle" });

if (scroll !== null) {
  await page.evaluate((s) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, s <= 1 ? Math.round(max * s) : s);
  }, scroll);
  await page.waitForTimeout(250);
}

await page.screenshot({ path: output, fullPage });

await browser.close();
console.log(
  `Captura guardada en ${output} (viewport ${width}px${fullPage ? ", full page" : ""}${scroll !== null ? `, scroll ${scroll}` : ""})`,
);

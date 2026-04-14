import { chromium } from 'playwright';
import { localizeTrackingData } from '../utils/tracking-translations.js';

const TRACKING_URL =
  process.env.TRACKING_URL || 'http://193.112.141.69:8082/en/trackIndex.htm';
const TRACKING_TIMEOUT_MS = Number(process.env.TRACKING_TIMEOUT_MS || 30000);
const HEADLESS =
  String(process.env.HEADLESS || 'true').toLowerCase() !== 'false';

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/转运中/g, '')
    .trim();
}

function normalizeHeader(value) {
  return normalizeText(value).toLowerCase();
}

function isDateLike(value) {
  const text = normalizeText(value);
  return /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(text);
}

function mapTrackingData(rawTables, requestedTrackingCode) {
  let summary = {
    referenceNo: '',
    trackingNumber: requestedTrackingCode,
    country: '',
    date: '',
    lastRecord: '',
    consigneeName: ''
  };

  let events = [];

  for (const rows of rawTables) {
    if (!rows || !rows.length) {
      continue;
    }

    const firstRow = rows[0] || [];
    const headers = firstRow.map(normalizeHeader);

    const isSummaryTable =
      headers.includes('reference no.') ||
      headers.includes('referce no.') ||
      (headers.includes('trackingnumber') &&
        headers.includes('country') &&
        headers.includes('consigneename'));

    if (isSummaryTable && rows.length > 1) {
      const values = rows[1] || [];
      summary = {
        referenceNo: normalizeText(values[0]),
        trackingNumber: normalizeText(values[1]) || requestedTrackingCode,
        country: normalizeText(values[2]),
        date: normalizeText(values[3]),
        lastRecord: normalizeText(values[4]),
        consigneeName: normalizeText(values[5])
      };
      continue;
    }

    const isDetailsTableWithHeader =
      headers.includes('date') &&
      headers.includes('location') &&
      (headers.includes('trace record') || headers.includes('record'));

    if (isDetailsTableWithHeader) {
      const mappedEvents = rows
        .slice(1)
        .map((row) => ({
          date: normalizeText(row[0]),
          location: normalizeText(row[1]),
          record: normalizeText(row[2])
        }))
        .filter((event) => event.date || event.location || event.record);

      if (mappedEvents.length > 0) {
        events = mappedEvents;
        continue;
      }
    }

    const isDetailsTableWithoutHeader =
      rows.length > 0 &&
      rows.every(
        (row) => Array.isArray(row) && row.length >= 3 && isDateLike(row[0])
      );

    if (isDetailsTableWithoutHeader) {
      const mappedEvents = rows
        .map((row) => ({
          date: normalizeText(row[0]),
          location: normalizeText(row[1]),
          record: normalizeText(row[2])
        }))
        .filter((event) => event.date || event.location || event.record);

      if (mappedEvents.length > 0) {
        events = mappedEvents;
      }
    }
  }

  const baseData = {
    requestedTrackingCode,
    trackingNumber: summary.trackingNumber || requestedTrackingCode,
    referenceNo: summary.referenceNo,
    country: summary.country,
    consigneeName: summary.consigneeName,
    date: summary.date || events[0]?.date || '',
    currentStatus: summary.lastRecord || events[0]?.record || '',
    events
  };

  return localizeTrackingData(baseData);
}

export async function trackShipment(trackingCode) {
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });

  try {
    const page = await context.newPage();
    page.setDefaultTimeout(TRACKING_TIMEOUT_MS);

    await page.goto(TRACKING_URL, {
      waitUntil: 'domcontentloaded',
      timeout: TRACKING_TIMEOUT_MS
    });

    const input = page.locator('textarea').first();
    await input.waitFor({ state: 'visible' });
    await input.fill(trackingCode);

    const possibleButtons = [
      page.getByRole('button', { name: /search/i }),
      page.locator('input[type="button"][value*="search" i]'),
      page.locator('input[type="submit"][value*="search" i]'),
      page.locator('button:has-text("search")'),
      page.locator('a:has-text("search")')
    ];

    let clicked = false;
    for (const candidate of possibleButtons) {
      if ((await candidate.count()) > 0) {
        await candidate.first().click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      throw new Error('Pulsante di ricerca non trovato nella pagina del provider.');
    }

    await page.waitForTimeout(2500);

    const rawTables = await page.evaluate(() => {
      const normalize = (value) =>
        String(value || '')
          .replace(/\s+/g, ' ')
          .trim();

      return Array.from(document.querySelectorAll('table')).map((table) =>
        Array.from(table.querySelectorAll('tr')).map((tr) =>
          Array.from(tr.querySelectorAll('th, td')).map((cell) =>
            normalize(cell.textContent)
          )
        )
      );
    });

    const parsed = mapTrackingData(rawTables, trackingCode);

    if (!parsed.events.length) {
      throw new Error('Parsing completato ma nessun evento di tracking trovato.');
    }

    return parsed;
  } finally {
    await context.close();
    await browser.close();
  }
}

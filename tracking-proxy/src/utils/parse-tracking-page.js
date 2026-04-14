import * as cheerio from 'cheerio';

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/转运中/g, '')
    .trim();
}

function tableToRows($, tableElement) {
  const rows = [];

  $(tableElement)
    .find('tr')
    .each((_, tr) => {
      const cells = [];

      $(tr)
        .find('th,td')
        .each((__, cell) => {
          cells.push(normalizeText($(cell).text()));
        });

      if (cells.some(Boolean)) {
        rows.push(cells);
      }
    });

  return rows;
}

export function parseTrackingPage(html, requestedTrackingCode) {
  const $ = cheerio.load(html);
  const allTables = $('table')
    .toArray()
    .map((el) => tableToRows($, el));

  let summary = {
    referenceNo: '',
    trackingNumber: requestedTrackingCode,
    country: '',
    date: '',
    lastRecord: '',
    consigneeName: ''
  };

  for (const rows of allTables) {
    if (rows.length < 2) {
      continue;
    }

    const headers = rows[0].map((cell) => cell.toLowerCase());
    const hasSummaryHeaders =
      headers.includes('referce no.') ||
      headers.includes('reference no.') ||
      (headers.includes('trackingnumber') && headers.includes('country') && headers.includes('consigneename'));

    if (!hasSummaryHeaders) {
      continue;
    }

    const values = rows[1] || [];
    summary = {
      referenceNo: values[0] || '',
      trackingNumber: values[1] || requestedTrackingCode,
      country: values[2] || '',
      date: values[3] || '',
      lastRecord: values[4] || '',
      consigneeName: values[5] || ''
    };
    break;
  }

  let events = [];

  for (const rows of allTables) {
    if (rows.length < 2) {
      continue;
    }

    const headers = rows[0].map((cell) => cell.toLowerCase());
    const isDetailsTable =
      headers.includes('date') &&
      headers.includes('location') &&
      (headers.includes('trace record') || headers.includes('record'));

    if (!isDetailsTable) {
      continue;
    }

    events = rows.slice(1).map((row) => ({
      date: row[0] || '',
      location: row[1] || '',
      record: row[2] || ''
    }));
    break;
  }

  return {
    requestedTrackingCode,
    trackingNumber: summary.trackingNumber,
    referenceNo: summary.referenceNo,
    country: summary.country,
    consigneeName: summary.consigneeName,
    date: summary.date,
    currentStatus: summary.lastRecord || events[0]?.record || '',
    events
  };
}

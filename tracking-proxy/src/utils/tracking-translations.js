const STATUS_TRANSLATIONS = {
  'Customs clearance completed': 'Sdoganamento completato',
  'Arrived at customs clearance warehouse': 'Arrivato al centro di sdoganamento',
  'Arrived at Destinated Airport': 'Arrivato all\'aeroporto di destinazione',
  'The flight has taken off': 'Il volo è decollato',
  'Estimated arrival date is April 7th': 'Data di arrivo stimata: 7 aprile',
  'Estimated departure is April 6th': 'Partenza stimata: 6 aprile',
  'Cargo handed over to the airline': 'Merce affidata alla compagnia aerea',
  'Domestic customs clearance completed': 'Sdoganamento interno completato',
  'Package has been packed and delivered to airport': 'Pacco preparato e inviato in aeroporto',
  'The goods leave the operation center': 'La merce ha lasciato il centro operativo',
  'Arrived at the operating center': 'Arrivato al centro operativo',
  '货物电子信息已经收到': 'Informazioni elettroniche della spedizione ricevute',
  "Order information received. We're expecting your parcel to arrive with us.":
    'Informazioni ordine ricevute. Siamo in attesa del pacco.',
  'Shipment information received': 'Informazioni spedizione ricevute',
  'Delivered': 'Consegnato',
  'In transit': 'In transito',
  'Customs clearance in progress': 'Sdoganamento in corso',
  'Departed from airport': 'Partito dall\'aeroporto',
  'Arrived at airport': 'Arrivato in aeroporto'
};

const LOCATION_TRANSLATIONS = {
  CN: 'Cina',
  AMS: 'Amsterdam'
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function translateStatus(text) {
  const cleanText = normalizeText(text);
  return STATUS_TRANSLATIONS[cleanText] || cleanText;
}

export function translateLocation(location) {
  const cleanLocation = normalizeText(location);
  if (!cleanLocation) {
    return '';
  }
  return LOCATION_TRANSLATIONS[cleanLocation] || cleanLocation;
}

export function localizeTrackingData(data) {
  const localizedEvents = (data.events || []).map((event) => ({
    ...event,
    location: translateLocation(event.location),
    record: translateStatus(event.record)
  }));

  return {
    ...data,
    currentStatus: translateStatus(data.currentStatus),
    country: translateLocation(data.country),
    events: localizedEvents
  };
}

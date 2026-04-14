# Tracking Proxy - MaglieCalcioTop

Proxy di tracking con frontend brandizzato MaglieCalcioTop.

## Funzioni principali

- ricerca tracking tramite codice spedizione
- interrogazione del provider esterno tramite Playwright
- traduzione automatica in italiano degli stati più comuni
- frontend personalizzato con logo MaglieCalcioTop
- pronto per deploy Docker / Render

## Avvio locale

```bash
npm install
npx playwright install chromium
cp .env.example .env
npm run dev
```

Apri:

```bash
http://localhost:3000
```

## Variabili ambiente

`.env` esempio:

```env
PORT=3000
TRACKING_URL=http://193.112.141.69:8082/en/trackIndex.htm
TRACKING_TIMEOUT_MS=30000
HEADLESS=true
```

## Deploy con Docker

Build:

```bash
docker build -t tracking-magliecalciotop .
```

Run:

```bash
docker run -p 3000:3000 --env-file .env tracking-magliecalciotop
```

## Deploy su Render

1. carica il progetto su GitHub
2. collega il repository a Render
3. Render leggerà `render.yaml`
4. imposta eventuali variabili ambiente se vuoi personalizzare timeout o URL

## Note

- il servizio dipende dal tracking provider esterno
- se il provider cambia HTML o blocca il server remoto, il parser potrebbe richiedere aggiornamenti
- puoi ampliare facilmente il file `src/utils/tracking-translations.js` con nuove traduzioni

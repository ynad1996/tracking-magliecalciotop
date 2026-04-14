import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { trackShipment } from './services/tracking-service.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const host = '0.0.0.0';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'tracking-proxy' });
});

app.post('/api/tracking', async (req, res) => {
  const trackingCode = String(req.body?.trackingCode || '').trim().toUpperCase();

  if (!trackingCode) {
    return res.status(400).json({
      ok: false,
      message: 'trackingCode obbligatorio.'
    });
  }

  try {
    const result = await trackShipment(trackingCode);
    return res.json({ ok: true, data: result });
  } catch (error) {
    console.error('[TRACKING_ERROR]', error);

    return res.status(502).json({
      ok: false,
      message:
        'Impossibile recuperare il tracking dal provider esterno in questo momento.',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, host, () => {
  console.log(`Tracking proxy avviato su http://${host}:${port}`);
});

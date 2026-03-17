import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import communesRouter from './routes/communes.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

app.use('/api/communes', communesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`✓ Serveur démarré sur http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Erreur au démarrage:', err);
  process.exit(1);
});

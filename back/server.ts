import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import communeRoutes, { uploadRouter } from './routes/communeRoutes.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/communes', communeRoutes);
app.use('/api', uploadRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  await sequelize.authenticate();
  console.log('DB connectee');

  await sequelize.sync();
  console.log('Tables synchronisees');

  app.listen(PORT, () => {
    console.log(`Serveur demarre sur http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Erreur au demarrage:', err);
  process.exit(1);
});

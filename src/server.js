import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '50kb', verify: (req, _res, buf) => { req.rawBody = buf; } })); // rawBody is needed to verify Paystack webhooks
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: true, legacyHeaders: false }));
app.use('/api', routes);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ error: err.statusCode === 503 ? 'Accounts are temporarily unavailable. Please try again.' : 'Server error. Please try again.' });
});
app.listen(process.env.PORT || 5000, () => console.log(`Ranktel API on :${process.env.PORT || 5000}`));

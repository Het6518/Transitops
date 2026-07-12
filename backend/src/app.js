const express = require('express');
const cors = require('cors');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Placeholder route imports (filled in per phase) ─────────────────────────
// app.use('/auth',        require('./routes/auth.routes'));
// app.use('/vehicles',    require('./routes/vehicle.routes'));
// app.use('/drivers',     require('./routes/driver.routes'));
// app.use('/trips',       require('./routes/trip.routes'));
// app.use('/maintenance', require('./routes/maintenance.routes'));
// app.use('/dashboard',   require('./routes/dashboard.routes'));
// app.use('/reports',     require('./routes/report.routes'));

// ─── Centralized Error Handler ────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const code   = err.code   || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  console.error(`[ERROR] ${status} ${code}: ${message}`);

  res.status(status).json({
    error: { code, message },
  });
});

module.exports = app;

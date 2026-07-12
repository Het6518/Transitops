require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { loadPermissionCache } = require('./utils/permissionCache');
const { authenticate }        = require('./middleware/authenticate');
const { requirePermission }   = require('./middleware/requirePermission');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Auth Routes (public) ─────────────────────────────────────────────────────
app.use('/auth', require('./routes/auth.routes'));

// ─── Admin — manual permission cache refresh ──────────────────────────────────
// In production this should also be protected; for the hackathon it's open.
app.post('/admin/refresh-permissions', async (req, res, next) => {
  try {
    await loadPermissionCache();
    res.json({ message: 'Permission cache refreshed successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── Protected Routes (Phase 3–8, uncomment as each phase is built) ──────────
// All routes below require: authenticate first, then requirePermission per-route.

// app.use('/vehicles',    require('./routes/vehicle.routes'));
// app.use('/drivers',     require('./routes/driver.routes'));
// app.use('/trips',       require('./routes/trip.routes'));
// app.use('/maintenance', require('./routes/maintenance.routes'));
// app.use('/dashboard',   require('./routes/dashboard.routes'));
// app.use('/reports',     require('./routes/report.routes'));

// ─── Centralized Error Handler ────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status  = err.status  || 500;
  const code    = err.code    || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  console.error(`[ERROR] ${status} ${code}: ${message}`);

  res.status(status).json({ error: { code, message } });
});

// ─── Boot: load permission cache ──────────────────────────────────────────────
loadPermissionCache().catch((err) => {
  console.error('[BOOT] Failed to load permission cache:', err);
  process.exit(1);
});

module.exports = app;
// Export middleware for use in route files
module.exports.authenticate      = authenticate;
module.exports.requirePermission = requirePermission;

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

// ─── Public Routes ────────────────────────────────────────────────────────────
app.use('/auth', require('./routes/auth.routes'));

// ─── Admin — manual permission cache refresh ──────────────────────────────────
app.post('/admin/refresh-permissions', async (req, res, next) => {
  try {
    await loadPermissionCache();
    res.json({ message: 'Permission cache refreshed successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── Protected Resource Routes ────────────────────────────────────────────────
app.use('/vehicles',    require('./routes/vehicle.routes'));
// app.use('/drivers',     require('./routes/driver.routes'));     // Phase 4
// app.use('/trips',       require('./routes/trip.routes'));       // Phase 5
// app.use('/maintenance', require('./routes/maintenance.routes')); // Phase 6
// app.use('/dashboard',   require('./routes/dashboard.routes'));  // Phase 8
// app.use('/reports',     require('./routes/report.routes'));     // Phase 8

// ─── Centralized Error Handler ────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // AppError subclasses carry .status and .code
  const status  = err.status  || 500;
  const code    = err.code    || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  if (status === 500) {
    console.error(`[ERROR] ${status} ${code}: ${message}`, err.stack);
  } else {
    console.warn(`[WARN]  ${status} ${code}: ${message}`);
  }

  // Handle Prisma FK constraint violations (delete with references)
  if (err.code === 'P2003' || err.meta?.cause?.includes('foreign key')) {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'Cannot delete — resource is referenced by other records' },
    });
  }

  res.status(status).json({ error: { code, message } });
});

// ─── Boot: load permission cache ──────────────────────────────────────────────
loadPermissionCache().catch((err) => {
  console.error('[BOOT] Failed to load permission cache:', err);
  process.exit(1);
});

module.exports = app;
module.exports.authenticate      = authenticate;
module.exports.requirePermission = requirePermission;

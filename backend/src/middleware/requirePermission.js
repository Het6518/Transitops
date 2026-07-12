const { hasPermission, isCacheReady } = require('../utils/permissionCache');

/**
 * requirePermission(resource, action)
 * ------------------------------------
 * Returns an Express middleware that checks the in-memory permission cache.
 * NEVER queries the DB — all checks are resolved from the cache loaded at boot.
 *
 * Usage:
 *   router.post('/vehicles', authenticate, requirePermission('vehicle', 'create'), controller)
 *
 * @param {string} resource - e.g. 'vehicle', 'driver', 'trip'
 * @param {string} action   - e.g. 'create', 'read', 'dispatch'
 */
function requirePermission(resource, action) {
  return (req, res, next) => {
    // Cache safety guard (should always be ready after boot)
    if (!isCacheReady()) {
      return res.status(503).json({
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Permission cache not ready yet' },
      });
    }

    // req.user is set by the authenticate middleware
    if (!req.user || !req.user.roleId) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (!hasPermission(req.user.roleId, resource, action)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Your role does not have permission to ${action} on ${resource}`,
        },
      });
    }

    next();
  };
}

module.exports = { requirePermission };

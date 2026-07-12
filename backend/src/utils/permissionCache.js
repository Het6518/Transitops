/**
 * RBAC Permission Cache
 * ---------------------
 * Loads the full Role → Permission mapping from the DB on boot
 * and stores it in memory. All permission checks read from this
 * cache — zero DB round-trips per request.
 *
 * Cache shape:
 *   Map<roleId, Set<"resource:action">>
 *
 * Refresh via:  POST /admin/refresh-permissions
 */

const prisma = require('../prisma/client');

/** @type {Map<string, Set<string>>} */
let permissionCache = new Map();
let cacheReady = false;

/**
 * (Re)loads all role → permission mappings from the DB.
 * Called once on server boot and again on demand.
 */
async function loadPermissionCache() {
  const rolePermissions = await prisma.rolePermission.findMany({
    include: { permission: true },
  });

  const newCache = new Map();

  for (const rp of rolePermissions) {
    const key = `${rp.permission.resource}:${rp.permission.action}`;
    if (!newCache.has(rp.roleId)) {
      newCache.set(rp.roleId, new Set());
    }
    newCache.get(rp.roleId).add(key);
  }

  permissionCache = newCache;
  cacheReady = true;
  console.log(
    `[RBAC] Permission cache loaded — ${rolePermissions.length} grants across ${newCache.size} roles`
  );
}

/**
 * Checks whether a roleId has the given permission IN THE CACHE.
 * @param {string} roleId
 * @param {string} resource
 * @param {string} action
 * @returns {boolean}
 */
function hasPermission(roleId, resource, action) {
  const perms = permissionCache.get(roleId);
  if (!perms) return false;
  return perms.has(`${resource}:${action}`);
}

function isCacheReady() {
  return cacheReady;
}

module.exports = { loadPermissionCache, hasPermission, isCacheReady };

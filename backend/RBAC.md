# TransitOps — RBAC System Guide

## Overview

All authorization is resolved **from the database at runtime**, not from hardcoded role checks.  
The permission set is loaded into an **in-memory cache on server boot** so every request check is O(1) with zero DB round-trips.

---

## How It Works

```
User ──has──► Role ──has many──► RolePermission ──references──► Permission
                                                                  (resource, action)
```

1. On signup/login the JWT payload contains `{ userId, roleId, email }`.
2. On server boot `loadPermissionCache()` fetches all `RolePermission` rows and builds:
   ```
   Map<roleId, Set<"resource:action">>
   ```
3. Every protected route uses two middlewares:
   ```js
   router.post('/vehicles',
     authenticate,                          // verify JWT → req.user
     requirePermission('vehicle', 'create'), // cache lookup → 403 or next()
     vehicleController.create
   )
   ```

---

## Permission Matrix

| Resource    | Action   | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|-------------|----------|:---:|:---:|:---:|:---:|
| vehicle     | create   | ✅ | ❌ | ❌ | ❌ |
| vehicle     | read     | ✅ | ✅ | ✅ | ✅ |
| vehicle     | update   | ✅ | ❌ | ❌ | ❌ |
| vehicle     | delete   | ✅ | ❌ | ❌ | ❌ |
| driver      | create   | ✅ | ❌ | ✅ | ❌ |
| driver      | read     | ✅ | ✅ | ✅ | ✅ |
| driver      | update   | ✅ | ❌ | ✅ | ❌ |
| driver      | delete   | ✅ | ❌ | ✅ | ❌ |
| trip        | create   | ❌ | ✅ | ❌ | ❌ |
| trip        | read     | ✅ | ✅ | ✅ | ✅ |
| trip        | dispatch | ❌ | ✅ | ❌ | ❌ |
| trip        | complete | ❌ | ✅ | ❌ | ❌ |
| trip        | cancel   | ❌ | ✅ | ❌ | ❌ |
| maintenance | create   | ✅ | ❌ | ❌ | ❌ |
| maintenance | read     | ✅ | ❌ | ✅ | ✅ |
| fuelLog     | create   | ✅ | ✅ | ❌ | ❌ |
| fuelLog     | read     | ✅ | ✅ | ❌ | ✅ |
| expense     | create   | ✅ | ✅ | ❌ | ❌ |
| expense     | read     | ✅ | ✅ | ❌ | ✅ |
| dashboard   | read     | ✅ | ❌ | ✅ | ✅ |
| report      | read     | ✅ | ❌ | ✅ | ✅ |
| report      | create   | ✅ | ❌ | ❌ | ✅ |

---

## Adding a New Role (no code changes required)

```sql
-- 1. Insert the role
INSERT INTO "Role" (id, name) VALUES (gen_random_uuid(), 'DISPATCHER');

-- 2. Grant permissions
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r.id, p.id
FROM "Role" r, "Permission" p
WHERE r.name = 'DISPATCHER'
  AND (p.resource, p.action) IN (
    ('trip', 'read'),
    ('trip', 'dispatch'),
    ('vehicle', 'read'),
    ('driver', 'read')
  );
```

Then call `POST /admin/refresh-permissions` to reload the cache — **no server restart needed**.

---

## Adding a New Permission (no code changes required)

```sql
-- 1. Add the permission row
INSERT INTO "Permission" (id, resource, action)
VALUES (gen_random_uuid(), 'report', 'export');

-- 2. Grant it to relevant roles
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r.id, p.id
FROM "Role" r, "Permission" p
WHERE r.name = 'FINANCIAL_ANALYST'
  AND p.resource = 'report' AND p.action = 'export';
```

Then call `POST /admin/refresh-permissions` to reload the cache.

---

## Protecting a New Route

```js
const { authenticate }        = require('../app');
const { requirePermission }   = require('../middleware/requirePermission');

// Read-only access — multiple roles allowed by adding two middlewares
router.get('/new-resource',
  authenticate,
  requirePermission('newResource', 'read'),
  controller.list
);

// Write access
router.post('/new-resource',
  authenticate,
  requirePermission('newResource', 'create'),
  controller.create
);
```

> **Rule:** Never write `if (req.user.role === 'FLEET_MANAGER')` anywhere.  
> Always use `requirePermission(resource, action)` — the DB drives all decisions.

---

## Cache Refresh

```http
POST /admin/refresh-permissions
```

Reloads the full permission set from DB into memory.  
Call this after any direct DB change to roles or permissions.

---

## Error Responses

| Scenario | Status | Code |
|---|---|---|
| Missing / invalid JWT | 401 | `TOKEN_INVALID` |
| Valid JWT, no permission | 403 | `FORBIDDEN` |
| Cache not ready (boot) | 503 | `SERVICE_UNAVAILABLE` |

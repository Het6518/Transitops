/**
 * prisma/seed.js
 * --------------
 * Populates Roles, Permissions, and RolePermissions in the DB.
 * Safe to re-run (uses upsert throughout).
 *
 * Run with:  npm run seed
 *
 * PERMISSION MATRIX
 * ─────────────────────────────────────────────────────────────────────────────
 * Resource     │ Action   │ FLEET_MGR │ DRIVER │ SAFETY_OFF │ FIN_ANALYST
 * ─────────────┼──────────┼───────────┼────────┼────────────┼────────────
 * vehicle      │ create   │ ✅        │ ❌     │ ❌         │ ❌
 * vehicle      │ read     │ ✅        │ ❌     │ ✅         │ ✅
 * vehicle      │ update   │ ✅        │ ❌     │ ❌         │ ❌
 * vehicle      │ delete   │ ✅        │ ❌     │ ❌         │ ❌
 * ─────────────┼──────────┼───────────┼────────┼────────────┼────────────
 * driver       │ create   │ ✅        │ ❌     │ ✅         │ ❌
 * driver       │ read     │ ✅        │ ❌     │ ✅         │ ✅
 * driver       │ update   │ ✅        │ ❌     │ ✅         │ ❌
 * driver       │ delete   │ ✅        │ ❌     │ ✅         │ ❌
 * ─────────────┼──────────┼───────────┼────────┼────────────┼────────────
 * trip         │ create   │ ❌        │ ✅     │ ❌         │ ❌
 * trip         │ read     │ ✅        │ ✅     │ ✅         │ ✅
 * trip         │ update   │ ❌        │ ✅     │ ❌         │ ❌
 * trip         │ delete   │ ❌        │ ✅     │ ❌         │ ❌
 * trip         │ dispatch │ ❌        │ ✅     │ ❌         │ ❌
 * trip         │ complete │ ❌        │ ✅     │ ❌         │ ❌
 * trip         │ cancel   │ ❌        │ ✅     │ ❌         │ ❌
 * ─────────────┼──────────┼───────────┼────────┼────────────┼────────────
 * maintenance  │ create   │ ✅        │ ❌     │ ❌         │ ❌
 * maintenance  │ read     │ ✅        │ ❌     │ ✅         │ ✅
 * maintenance  │ update   │ ✅        │ ❌     │ ❌         │ ❌
 * maintenance  │ delete   │ ✅        │ ❌     │ ❌         │ ❌
 * ─────────────┼──────────┼───────────┼────────┼────────────┼────────────
 * fuelLog      │ create   │ ✅        │ ✅     │ ❌         │ ❌
 * fuelLog      │ read     │ ✅        │ ✅     │ ❌         │ ✅
 * fuelLog      │ update   │ ✅        │ ✅     │ ❌         │ ❌
 * fuelLog      │ delete   │ ✅        │ ✅     │ ❌         │ ❌
 * ─────────────┼──────────┼───────────┼────────┼────────────┼────────────
 * expense      │ create   │ ✅        │ ✅     │ ❌         │ ❌
 * expense      │ read     │ ✅        │ ✅     │ ❌         │ ✅
 * expense      │ update   │ ✅        │ ✅     │ ❌         │ ❌
 * expense      │ delete   │ ✅        │ ✅     │ ❌         │ ❌
 * ─────────────┼──────────┼───────────┼────────┼────────────┼────────────
 * dashboard    │ read     │ ✅        │ ❌     │ ✅         │ ✅
 * ─────────────┼──────────┼───────────┼────────┼────────────┼────────────
 * report       │ read     │ ✅        │ ❌     │ ✅         │ ✅
 * report       │ create   │ ✅        │ ❌     │ ❌         │ ✅  (CSV export)
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg }     = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

// ─── 1. Role definitions ──────────────────────────────────────────────────────

const ROLES = ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'];

// ─── 2. All (resource, action) pairs ─────────────────────────────────────────

const ALL_PERMISSIONS = [
  // vehicle
  { resource: 'vehicle',     action: 'create'   },
  { resource: 'vehicle',     action: 'read'     },
  { resource: 'vehicle',     action: 'update'   },
  { resource: 'vehicle',     action: 'delete'   },
  // driver
  { resource: 'driver',      action: 'create'   },
  { resource: 'driver',      action: 'read'     },
  { resource: 'driver',      action: 'update'   },
  { resource: 'driver',      action: 'delete'   },
  // trip
  { resource: 'trip',        action: 'create'   },
  { resource: 'trip',        action: 'read'     },
  { resource: 'trip',        action: 'update'   },
  { resource: 'trip',        action: 'delete'   },
  { resource: 'trip',        action: 'dispatch' },
  { resource: 'trip',        action: 'complete' },
  { resource: 'trip',        action: 'cancel'   },
  // maintenance
  { resource: 'maintenance', action: 'create'   },
  { resource: 'maintenance', action: 'read'     },
  { resource: 'maintenance', action: 'update'   },
  { resource: 'maintenance', action: 'delete'   },
  // fuelLog
  { resource: 'fuelLog',     action: 'create'   },
  { resource: 'fuelLog',     action: 'read'     },
  { resource: 'fuelLog',     action: 'update'   },
  { resource: 'fuelLog',     action: 'delete'   },
  // expense
  { resource: 'expense',     action: 'create'   },
  { resource: 'expense',     action: 'read'     },
  { resource: 'expense',     action: 'update'   },
  { resource: 'expense',     action: 'delete'   },
  // dashboard
  { resource: 'dashboard',   action: 'read'     },
  // report
  { resource: 'report',      action: 'read'     },
  { resource: 'report',      action: 'create'   }, // CSV export
];

// ─── 3. Role → granted permissions ───────────────────────────────────────────

const ROLE_PERMISSIONS = {
  FLEET_MANAGER: [
    'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
    'driver:create',  'driver:read',  'driver:update',  'driver:delete',
    'trip:read',
    'maintenance:create', 'maintenance:read', 'maintenance:update', 'maintenance:delete',
    'fuelLog:create', 'fuelLog:read', 'fuelLog:update', 'fuelLog:delete',
    'expense:create', 'expense:read', 'expense:update', 'expense:delete',
    'dashboard:read',
    'report:read', 'report:create',
  ],
  DRIVER: [
    'trip:create', 'trip:read', 'trip:update', 'trip:delete',
    'trip:dispatch', 'trip:complete', 'trip:cancel',
    'fuelLog:create', 'fuelLog:read', 'fuelLog:update', 'fuelLog:delete',
    'expense:create', 'expense:read', 'expense:update', 'expense:delete',
  ],
  SAFETY_OFFICER: [
    'vehicle:read',
    'driver:create', 'driver:read', 'driver:update', 'driver:delete',
    'trip:read',
    'maintenance:read',
    'dashboard:read',
    'report:read',
  ],
  FINANCIAL_ANALYST: [
    'vehicle:read',
    'driver:read',
    'trip:read',
    'maintenance:read',
    'fuelLog:read',
    'expense:read',
    'dashboard:read',
    'report:read', 'report:create',
  ],
};

// ─── Main seed function ───────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Upsert Roles
  const roleMap = {}; // name -> id
  for (const name of ROLES) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    roleMap[name] = role.id;
    console.log(`  Role: ${name} → ${role.id}`);
  }

  // 2. Upsert Permissions
  const permMap = {}; // "resource:action" -> id
  for (const { resource, action } of ALL_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action },
    });
    permMap[`${resource}:${action}`] = perm.id;
  }
  console.log(`  Permissions upserted: ${Object.keys(permMap).length}`);

  // 3. Upsert RolePermissions
  let grantCount = 0;
  for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    for (const key of keys) {
      const permissionId = permMap[key];
      if (!permissionId) {
        console.warn(`  ⚠️  Unknown permission key: ${key}`);
        continue;
      }
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
      grantCount++;
    }
  }
  console.log(`  RolePermissions upserted: ${grantCount}`);
  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

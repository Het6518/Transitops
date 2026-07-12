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
    'vehicle:read',                                               // needed to list available vehicles for trip creation
    'driver:read',                                                // needed to list available drivers for trip creation
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

  // ─── 4. Seed Users ──────────────────────────────────────────────────────────
  console.log('👤 Seeding Users...');
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash('password123', 10);
  const usersToSeed = [
    { email: 'manager@test.com', roleName: 'FLEET_MANAGER' },
    { email: 'driver@test.com', roleName: 'DRIVER' },
    { email: 'safety@test.com', roleName: 'SAFETY_OFFICER' },
    { email: 'finance@test.com', roleName: 'FINANCIAL_ANALYST' }
  ];
  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        roleId: roleMap[u.roleName]
      }
    });
  }

  // ─── 5. Seed Vehicles ───────────────────────────────────────────────────────
  console.log('🚗 Seeding Vehicles...');
  const vehicles = [
    { regNo: 'MH12AB1001', name: 'Fleet Truck 1', type: 'truck', maxLoadKg: 10000, odometer: 15000, acquisitionCost: 120000, status: 'AVAILABLE' },
    { regNo: 'MH12AB1002', name: 'Fleet Van 2', type: 'van', maxLoadKg: 2000, odometer: 8000, acquisitionCost: 45000, status: 'AVAILABLE' },
    { regNo: 'MH12AB1003', name: 'Fleet Truck 3 (Active)', type: 'truck', maxLoadKg: 12000, odometer: 25000, acquisitionCost: 140000, status: 'ON_TRIP' },
    { regNo: 'MH12AB1004', name: 'Fleet Van 4 (Shop)', type: 'van', maxLoadKg: 2500, odometer: 12000, acquisitionCost: 50000, status: 'IN_SHOP' },
    { regNo: 'MH12AB1005', name: 'Decommissioned Truck 5', type: 'truck', maxLoadKg: 8000, odometer: 350000, acquisitionCost: 95000, status: 'RETIRED' }
  ];
  const vehicleMap = {};
  for (const v of vehicles) {
    const veh = await prisma.vehicle.upsert({
      where: { regNo: v.regNo },
      update: { status: v.status },
      create: v
    });
    vehicleMap[v.regNo] = veh.id;
  }

  // ─── 6. Seed Drivers ────────────────────────────────────────────────────────
  console.log('👨 Seeding Drivers...');
  const drivers = [
    { name: 'John Driver', licenseNo: 'LIC-000001', licenseCategory: 'HMV', licenseExpiry: new Date('2028-12-31T00:00:00Z'), contact: '+919876543210', safetyScore: 95, status: 'AVAILABLE' },
    { name: 'David Active', licenseNo: 'LIC-000002', licenseCategory: 'HMV', licenseExpiry: new Date('2029-06-15T00:00:00Z'), contact: '+919876543211', safetyScore: 88, status: 'ON_TRIP' },
    { name: 'Sarah Break', licenseNo: 'LIC-000003', licenseCategory: 'LMV', licenseExpiry: new Date('2027-04-20T00:00:00Z'), contact: '+919876543212', safetyScore: 92, status: 'OFF_DUTY' },
    { name: 'Mike Suspended', licenseNo: 'LIC-000004', licenseCategory: 'HMV', licenseExpiry: new Date('2028-01-01T00:00:00Z'), contact: '+919876543213', safetyScore: 45, status: 'SUSPENDED' },
    { name: 'Robert Expired', licenseNo: 'LIC-000005', licenseCategory: 'LMV', licenseExpiry: new Date('2025-01-01T00:00:00Z'), contact: '+919876543214', safetyScore: 75, status: 'AVAILABLE' }
  ];
  const driverMap = {};
  for (const d of drivers) {
    const drv = await prisma.driver.upsert({
      where: { licenseNo: d.licenseNo },
      update: { status: d.status, licenseExpiry: d.licenseExpiry },
      create: d
    });
    driverMap[d.licenseNo] = drv.id;
  }

  // ─── 7. Seed Trips ──────────────────────────────────────────────────────────
  console.log('📦 Seeding Trips...');
  const tripCount = await prisma.trip.count();
  if (tripCount === 0) {
    await prisma.trip.createMany({
      data: [
        {
          source: 'Warehouse North',
          destination: 'Outlet East',
          vehicleId: vehicleMap['MH12AB1001'],
          driverId: driverMap['LIC-000001'],
          cargoWeightKg: 5000,
          plannedDistance: 120,
          actualOdometer: 15120,
          fuelConsumed: 22,
          status: 'COMPLETED',
          createdAt: new Date('2026-07-01T08:00:00Z'),
          dispatchedAt: new Date('2026-07-01T09:00:00Z'),
          completedAt: new Date('2026-07-01T12:00:00Z')
        },
        {
          source: 'Warehouse South',
          destination: 'Outlet West',
          vehicleId: vehicleMap['MH12AB1002'],
          driverId: driverMap['LIC-000003'],
          cargoWeightKg: 1500,
          plannedDistance: 80,
          actualOdometer: 8080,
          fuelConsumed: 12,
          status: 'COMPLETED',
          createdAt: new Date('2026-07-02T10:00:00Z'),
          dispatchedAt: new Date('2026-07-02T10:30:00Z'),
          completedAt: new Date('2026-07-02T12:30:00Z')
        },
        {
          source: 'Warehouse East',
          destination: 'Outlet Central',
          vehicleId: vehicleMap['MH12AB1001'],
          driverId: driverMap['LIC-000001'],
          cargoWeightKg: 4000,
          plannedDistance: 90,
          actualOdometer: 15210,
          fuelConsumed: 18,
          status: 'COMPLETED',
          createdAt: new Date('2026-07-03T14:00:00Z'),
          dispatchedAt: new Date('2026-07-03T14:30:00Z'),
          completedAt: new Date('2026-07-03T16:30:00Z')
        },
        {
          source: 'Warehouse Central',
          destination: 'Outlet North',
          vehicleId: vehicleMap['MH12AB1003'],
          driverId: driverMap['LIC-000002'],
          cargoWeightKg: 8000,
          plannedDistance: 200,
          status: 'DISPATCHED',
          createdAt: new Date('2026-07-12T08:00:00Z'),
          dispatchedAt: new Date('2026-07-12T08:30:00Z')
        }
      ]
    });
  }

  // ─── 8. Seed Maintenance Logs ───────────────────────────────────────────────
  console.log('🔧 Seeding Maintenance...');
  const activeLog = await prisma.maintenanceLog.findFirst({
    where: { vehicleId: vehicleMap['MH12AB1004'], isActive: true }
  });
  if (!activeLog) {
    await prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicleMap['MH12AB1004'],
        description: 'Engine transmission check and gear tuning',
        cost: 450.00,
        startDate: new Date('2026-07-11T09:00:00Z'),
        isActive: true
      }
    });
  }

  // ─── 9. Seed Fuel & Expenses ────────────────────────────────────────────────
  console.log('⛽ Seeding Fuel Logs & Expenses...');
  const fuelCount = await prisma.fuelLog.count();
  if (fuelCount === 0) {
    await prisma.fuelLog.createMany({
      data: [
        { vehicleId: vehicleMap['MH12AB1001'], liters: 45, cost: 90, date: new Date('2026-07-01T08:30:00Z') },
        { vehicleId: vehicleMap['MH12AB1002'], liters: 15, cost: 32, date: new Date('2026-07-02T10:15:00Z') }
      ]
    });
  }

  const expenseCount = await prisma.expense.count();
  if (expenseCount === 0) {
    await prisma.expense.createMany({
      data: [
        { vehicleId: vehicleMap['MH12AB1001'], type: 'toll', amount: 20, date: new Date('2026-07-01T10:00:00Z') },
        { vehicleId: vehicleMap['MH12AB1002'], type: 'misc', amount: 15, date: new Date('2026-07-02T11:00:00Z') }
      ]
    });
  }

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

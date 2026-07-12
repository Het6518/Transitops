import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create permissions
  const modules = ['fleet', 'routes', 'drivers', 'trips', 'maintenance', 'fuel', 'finance', 'reports', 'users', 'settings'];
  const actions: Array<'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT' | 'APPROVE' | 'REJECT'> = [
    'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT'
  ];

  const permissions: Array<{ name: string; displayName: string; description: string; module: string; action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT' | 'APPROVE' | 'REJECT' }> = [];

  for (const module of modules) {
    for (const action of actions) {
      permissions.push({
        name: `${module}:${action.toLowerCase()}`,
        displayName: `${action} ${module.charAt(0).toUpperCase() + module.slice(1)}`,
        description: `Can ${action.toLowerCase()} ${module} records`,
        module,
        action,
      });
    }
  }

  // Create permissions in DB
  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });

  console.log(`✅ Seeded permissions`);

  // Fetch all created permissions from DB to link them
  const dbPermissions = await prisma.permission.findMany();

  // Helper to map permissions to a role name
  const mapPermissionsToRole = async (roleName: string, description: string, filterFn: (pName: string) => boolean) => {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description },
      create: { name: roleName, description },
    });

    const targetPermissions = dbPermissions.filter(p => filterFn(p.name));
    
    // bulk create rolePermissions mapping
    const mappings = targetPermissions.map(perm => ({
      roleId: role.id,
      permissionId: perm.id
    }));

    await prisma.rolePermission.createMany({
      data: mappings,
      skipDuplicates: true,
    });

    console.log(`✅ Configured role: ${roleName} with ${targetPermissions.length} permissions`);
    return role;
  };

  // 2. Define specific roles and map their permissions
  // FLEET_MANAGER: Create, Read, Update, Delete, Export for fleet, maintenance, fuel, routes
  const fleetManagerRole = await mapPermissionsToRole(
    'FLEET_MANAGER',
    'Manages vehicles, routes, maintenance and fuel logs',
    (name) => {
      const module = name.split(':')[0];
      return ['fleet', 'maintenance', 'fuel', 'routes'].includes(module);
    }
  );

  // DRIVER: Read for fleet, routes, trips. Update / self-report for trips
  const driverRole = await mapPermissionsToRole(
    'DRIVER',
    'Vehicle driver with access to assign trips and schedules',
    (name) => {
      const [module, action] = name.split(':');
      if (module === 'trips' && ['read', 'update'].includes(action)) return true;
      if (['fleet', 'routes'].includes(module) && action === 'read') return true;
      return false;
    }
  );

  // SAFETY_OFFICER: Read and Approve for maintenance, drivers, and reports
  const safetyOfficerRole = await mapPermissionsToRole(
    'SAFETY_OFFICER',
    'Safety supervisor auditing driver statuses and maintenance checks',
    (name) => {
      const [module, action] = name.split(':');
      if (['maintenance', 'drivers', 'reports'].includes(module)) {
        return ['read', 'approve', 'reject'].includes(action);
      }
      return false;
    }
  );

  // FINANCIAL_ANALYST: Read and Export for finance, reports, and fuel
  const financialAnalystRole = await mapPermissionsToRole(
    'FINANCIAL_ANALYST',
    'Financial analyst overseeing costs, billing, and fuel transactions',
    (name) => {
      const [module, action] = name.split(':');
      if (['finance', 'fuel', 'reports'].includes(module)) {
        return ['read', 'export'].includes(action);
      }
      return false;
    }
  );

  // Seed standard platform roles for backward compatibility / fallback
  const superAdminRole = await mapPermissionsToRole(
    'SUPER_ADMIN',
    'Super Administrator with root access',
    () => true
  );

  const managerRole = await mapPermissionsToRole(
    'MANAGER',
    'General Operations Manager',
    (name) => !name.startsWith('settings:') && !name.startsWith('users:')
  );

  // 3. Seed users and assign dynamic roleRelation
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const generalPassword = await bcrypt.hash('Transit@123', 12);

  // Super Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@transitops.com' },
    update: { roleId: superAdminRole.id },
    create: {
      email: 'admin@transitops.com',
      password: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      roleId: superAdminRole.id
    },
  });

  // Fleet Manager
  await prisma.user.upsert({
    where: { email: 'fleet.manager@transitops.com' },
    update: { roleId: fleetManagerRole.id },
    create: {
      email: 'fleet.manager@transitops.com',
      password: generalPassword,
      firstName: 'Frank',
      lastName: 'Fleet',
      role: 'MANAGER',
      status: 'ACTIVE',
      roleId: fleetManagerRole.id
    },
  });

  // Driver User
  await prisma.user.upsert({
    where: { email: 'driver@transitops.com' },
    update: { roleId: driverRole.id },
    create: {
      email: 'driver@transitops.com',
      password: generalPassword,
      firstName: 'Dan',
      lastName: 'Driver',
      role: 'DRIVER',
      status: 'ACTIVE',
      roleId: driverRole.id
    },
  });

  // Safety Officer
  await prisma.user.upsert({
    where: { email: 'safety@transitops.com' },
    update: { roleId: safetyOfficerRole.id },
    create: {
      email: 'safety@transitops.com',
      password: generalPassword,
      firstName: 'Sam',
      lastName: 'Safety',
      role: 'OPERATOR',
      status: 'ACTIVE',
      roleId: safetyOfficerRole.id
    },
  });

  // Financial Analyst
  await prisma.user.upsert({
    where: { email: 'finance@transitops.com' },
    update: { roleId: financialAnalystRole.id },
    create: {
      email: 'finance@transitops.com',
      password: generalPassword,
      firstName: 'Fiona',
      lastName: 'Finance',
      role: 'VIEWER',
      status: 'ACTIVE',
      roleId: financialAnalystRole.id
    },
  });

  // System config
  await prisma.systemConfig.createMany({
    data: [
      { key: 'app.name', value: 'TransitOps', description: 'Application name', isPublic: true },
      { key: 'app.version', value: '1.0.0', description: 'Application version', isPublic: true },
      { key: 'auth.max_sessions', value: '5', description: 'Max concurrent sessions per user' },
      { key: 'auth.password_min_length', value: '8', description: 'Minimum password length' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create permissions
  const modules = ['fleet', 'routes', 'drivers', 'trips', 'maintenance', 'fuel', 'finance', 'reports', 'users', 'settings'];
  const actions: Array<'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT' | 'APPROVE' | 'REJECT'> = [
    'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT',
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

  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${permissions.length} permissions`);

  // Create super admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@transitops.com' },
    update: {},
    create: {
      email: 'admin@transitops.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Created super admin: ${superAdmin.email}`);

  // Create demo manager
  const managerPassword = await bcrypt.hash('Manager@123', 12);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@transitops.com' },
    update: {},
    create: {
      email: 'manager@transitops.com',
      password: managerPassword,
      firstName: 'John',
      lastName: 'Manager',
      role: 'MANAGER',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Created manager: ${manager.email}`);

  // Create system config
  await prisma.systemConfig.createMany({
    data: [
      { key: 'app.name', value: 'TransitOps', description: 'Application name', isPublic: true },
      { key: 'app.version', value: '1.0.0', description: 'Application version', isPublic: true },
      { key: 'auth.max_sessions', value: '5', description: 'Max concurrent sessions per user' },
      { key: 'auth.password_min_length', value: '8', description: 'Minimum password length' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created system config');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Super Admin: admin@transitops.com / Admin@123');
  console.log('  Manager:     manager@transitops.com / Manager@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

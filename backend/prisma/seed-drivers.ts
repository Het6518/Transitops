import { PrismaClient, DriverStatus } from '@prisma/client';

const prisma = new PrismaClient();

const firstNames = [
  'James', 'Michael', 'Robert', 'William', 'David', 'Richard', 'Joseph', 'Thomas',
  'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Mark',
  'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Nancy', 'Lisa', 'Betty', 'Dorothy', 'Sandra', 'Ashley', 'Kimberly',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
];

const categories = ['B', 'C', 'D', 'B+E', 'C+E', 'D+E'];
const statuses: DriverStatus[] = [
  DriverStatus.AVAILABLE,
  DriverStatus.AVAILABLE,
  DriverStatus.AVAILABLE,
  DriverStatus.ON_TRIP,
  DriverStatus.ON_TRIP,
  DriverStatus.OFF_DUTY,
  DriverStatus.OFF_DUTY,
  DriverStatus.SUSPENDED,
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomDate(startYears: number, endYears: number): Date {
  const now = new Date();
  const start = new Date(now.getFullYear() + startYears, now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear() + endYears, now.getMonth(), now.getDate());
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Seeding 30 realistic drivers...');

  for (let i = 0; i < 30; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const licenseCategory = categories[Math.floor(Math.random() * categories.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const safetyScore = Math.round(randomBetween(60, 100) * 10) / 10;

    // Some drivers have expired licenses (for testing expiry badge)
    const hasExpiredLicense = i >= 27; // last 3 have expired licenses
    const licenseExpiry = hasExpiredLicense
      ? randomDate(-1, 0)
      : randomDate(0.1, 4);

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@transitops.com`;
    const contactNumber = `+1 ${Math.floor(randomBetween(200, 999))}-${Math.floor(randomBetween(100, 999))}-${Math.floor(randomBetween(1000, 9999))}`;
    const licenseNumber = `DL-${String(i + 1).padStart(5, '0')}-${licenseCategory.replace('+', '')}`;
    
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio'];
    const address = `${Math.floor(randomBetween(100, 9999))} ${['Oak', 'Pine', 'Maple', 'Cedar', 'Elm'][i % 5]} Street, ${cities[i % cities.length]}`;

    await prisma.driver.upsert({
      where: { licenseNumber },
      update: {
        firstName,
        lastName,
        email,
        contactNumber,
        licenseCategory,
        licenseExpiry,
        status,
        safetyScore,
        address,
      },
      create: {
        firstName,
        lastName,
        email,
        contactNumber,
        licenseNumber,
        licenseCategory,
        licenseExpiry,
        status,
        safetyScore,
        address,
        notes: i % 5 === 0 ? 'Experienced long-haul driver with excellent safety record.' : undefined,
      },
    });
  }

  console.log('🎉 30 realistic drivers seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Driver seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, VehicleStatus, TripStatus, MaintenanceStatus, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding dashboard operational data...');

  // Fetch some seeded users (drivers)
  const driverUser = await prisma.user.findFirst({
    where: { role: 'DRIVER' },
  });

  const fleetManagerUser = await prisma.user.findFirst({
    where: { role: 'MANAGER' },
  });

  const driverId = driverUser?.id || 'default-driver-id';
  const managerId = fleetManagerUser?.id || 'default-manager-id';

  // 1. Create Vehicles
  const vehiclesData = [
    { plateNumber: 'TX-1029', model: 'Volvo 7900 Electric', type: 'Bus', status: VehicleStatus.ACTIVE, fuelType: 'Electric', fuelCapacity: 350, mileage: 12500.5 },
    { plateNumber: 'TX-4482', model: 'Mercedes-Benz Citaro', type: 'Bus', status: VehicleStatus.AVAILABLE, fuelType: 'Diesel', fuelCapacity: 280, mileage: 45000.2 },
    { plateNumber: 'TX-9921', model: 'Toyota HiAce', type: 'Van', status: VehicleStatus.ACTIVE, fuelType: 'Petrol', fuelCapacity: 70, mileage: 82000.1 },
    { plateNumber: 'TX-3021', model: 'Ford Transit', type: 'Van', status: VehicleStatus.MAINTENANCE, fuelType: 'Diesel', fuelCapacity: 80, mileage: 98000.4 },
    { plateNumber: 'TX-5049', model: 'Scania Citywide', type: 'Bus', status: VehicleStatus.AVAILABLE, fuelType: 'Diesel', fuelCapacity: 300, mileage: 154000.8 },
    { plateNumber: 'TX-8820', model: 'BYD K9 Electric', type: 'Bus', status: VehicleStatus.ACTIVE, fuelType: 'Electric', fuelCapacity: 324, mileage: 22000.0 },
    { plateNumber: 'TX-7731', model: 'Mercedes-Benz Sprinter', type: 'Van', status: VehicleStatus.AVAILABLE, fuelType: 'Diesel', fuelCapacity: 75, mileage: 62450.3 },
    { plateNumber: 'TX-1209', model: 'Volvo FH16', type: 'Truck', status: VehicleStatus.MAINTENANCE, fuelType: 'Diesel', fuelCapacity: 450, mileage: 189000.9 },
    { plateNumber: 'TX-6048', model: 'Hyundai County', type: 'Bus', status: VehicleStatus.OUT_OF_SERVICE, fuelType: 'Diesel', fuelCapacity: 95, mileage: 210000.5 },
    { plateNumber: 'TX-4389', model: 'Isuzu Elf', type: 'Truck', status: VehicleStatus.AVAILABLE, fuelType: 'Diesel', fuelCapacity: 100, mileage: 112000.7 },
  ];

  const vehicles = [];
  for (const v of vehiclesData) {
    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: v,
      create: v,
    });
    vehicles.push(vehicle);
  }
  console.log(`✅ Seeded ${vehicles.length} vehicles.`);

  // 2. Create Routes
  const routesData = [
    { name: 'East-West Express (R-101)', startLocation: 'Terminal A (Downtown)', endLocation: 'Terminal B (Airport)', distance: 24.5, duration: 45 },
    { name: 'North Circular (R-202)', startLocation: 'North Plaza', endLocation: 'Industrial Park', distance: 18.2, duration: 35 },
    { name: 'South Shuttle (R-303)', startLocation: 'South Metro Station', endLocation: 'University Campus', distance: 8.5, duration: 15 },
    { name: 'Intercity Route (R-404)', startLocation: 'Central Hub', endLocation: 'Metro City East', distance: 120.0, duration: 120 },
    { name: 'Coastal Line (R-505)', startLocation: 'West Coast Marina', endLocation: 'Harbor Gate', distance: 35.8, duration: 60 },
  ];

  const routes = [];
  for (const r of routesData) {
    const route = await prisma.route.create({ data: r });
    routes.push(route);
  }
  console.log(`✅ Seeded ${routes.length} routes.`);

  // Ensure we have users with DRIVER role to distribute trips
  const drivers = await prisma.user.findMany({
    where: { role: 'DRIVER' },
  });
  const driverIds = drivers.map(d => d.id);
  if (driverIds.length === 0) driverIds.push(driverId);

  // 3. Create Trips
  const tripsData = [
    { vehicleId: vehicles[0].id, driverId: driverIds[0], routeId: routes[0].id, status: TripStatus.ACTIVE, startTime: new Date(Date.now() - 30 * 60 * 1000) },
    { vehicleId: vehicles[2].id, driverId: driverIds[0], routeId: routes[2].id, status: TripStatus.ACTIVE, startTime: new Date(Date.now() - 10 * 60 * 1000) },
    { vehicleId: vehicles[1].id, driverId: driverIds[0], routeId: routes[1].id, status: TripStatus.PENDING },
    { vehicleId: vehicles[4].id, driverId: driverIds[0], routeId: routes[3].id, status: TripStatus.PENDING },
    
    // Completed Trips in the last few days
    { vehicleId: vehicles[0].id, driverId: driverIds[0], routeId: routes[0].id, status: TripStatus.COMPLETED, startTime: new Date(Date.now() - 24 * 3600 * 1000), endTime: new Date(Date.now() - 23 * 3600 * 1000), actualDistance: 24.5 },
    { vehicleId: vehicles[1].id, driverId: driverIds[0], routeId: routes[1].id, status: TripStatus.COMPLETED, startTime: new Date(Date.now() - 22 * 3600 * 1000), endTime: new Date(Date.now() - 21.2 * 3600 * 1000), actualDistance: 18.2 },
    { vehicleId: vehicles[2].id, driverId: driverIds[0], routeId: routes[2].id, status: TripStatus.COMPLETED, startTime: new Date(Date.now() - 48 * 3600 * 1000), endTime: new Date(Date.now() - 47.7 * 3600 * 1000), actualDistance: 8.5 },
    { vehicleId: vehicles[5].id, driverId: driverIds[0], routeId: routes[4].id, status: TripStatus.COMPLETED, startTime: new Date(Date.now() - 12 * 3600 * 1000), endTime: new Date(Date.now() - 11 * 3600 * 1000), actualDistance: 36.0 },
    { vehicleId: vehicles[6].id, driverId: driverIds[0], routeId: routes[0].id, status: TripStatus.COMPLETED, startTime: new Date(Date.now() - 72 * 3600 * 1000), endTime: new Date(Date.now() - 71 * 3600 * 1000), actualDistance: 25.0 },
  ];

  for (const t of tripsData) {
    await prisma.trip.create({ data: t });
  }
  console.log(`✅ Seeded trips.`);

  // 4. Create Maintenance Records
  const maintenanceData = [
    { vehicleId: vehicles[3].id, description: 'Engine oil replacement and filter checks', cost: 250.0, status: MaintenanceStatus.IN_PROGRESS, startDate: new Date(Date.now() - 24 * 3600 * 1000) },
    { vehicleId: vehicles[7].id, description: 'Brake pad and disk rotor replacements', cost: 890.0, status: MaintenanceStatus.IN_PROGRESS, startDate: new Date(Date.now() - 48 * 3600 * 1000) },
    { vehicleId: vehicles[0].id, description: 'AC unit diagnostics and coolant refill', cost: 180.0, status: MaintenanceStatus.COMPLETED, startDate: new Date(Date.now() - 5 * 24 * 3600 * 1000), endDate: new Date(Date.now() - 4 * 24 * 3600 * 1000) },
    { vehicleId: vehicles[1].id, description: 'Scheduled major 50,000km service check', cost: 1200.0, status: MaintenanceStatus.COMPLETED, startDate: new Date(Date.now() - 10 * 24 * 3600 * 1000), endDate: new Date(Date.now() - 9 * 24 * 3600 * 1000) },
  ];

  for (const m of maintenanceData) {
    await prisma.maintenance.create({ data: m });
  }
  console.log(`✅ Seeded maintenance records.`);

  // 5. Create Fuel Logs
  const fuelLogsData = [
    { vehicleId: vehicles[1].id, driverId: driverIds[0], liters: 120, cost: 216.0, odometer: 45120.0, loggedAt: new Date(Date.now() - 12 * 3600 * 1000) },
    { vehicleId: vehicles[4].id, driverId: driverIds[0], liters: 240, cost: 432.0, odometer: 154240.0, loggedAt: new Date(Date.now() - 36 * 3600 * 1000) },
    { vehicleId: vehicles[2].id, driverId: driverIds[0], liters: 45, cost: 90.0, odometer: 82045.0, loggedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000) },
    { vehicleId: vehicles[6].id, driverId: driverIds[0], liters: 50, cost: 100.0, odometer: 62500.0, loggedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
  ];

  for (const f of fuelLogsData) {
    await prisma.fuelLog.create({ data: f });
  }
  console.log(`✅ Seeded fuel logs.`);

  // 6. Create Transactions (Finance)
  const transactionsData = [
    // Revenue
    { type: TransactionType.REVENUE, amount: 4500.00, category: 'TRIP_PAYMENT', description: 'Enterprise shuttle service - Weekly contract payout', date: new Date(Date.now() - 1 * 24 * 3600 * 1000) },
    { type: TransactionType.REVENUE, amount: 3200.00, category: 'TRIP_PAYMENT', description: 'Airport transfer route R-101 contract payout', date: new Date(Date.now() - 2 * 24 * 3600 * 1000) },
    { type: TransactionType.REVENUE, amount: 6200.00, category: 'TRIP_PAYMENT', description: 'Intercity transit service revenue - June', date: new Date(Date.now() - 15 * 24 * 3600 * 1000) },
    { type: TransactionType.REVENUE, amount: 3800.00, category: 'TRIP_PAYMENT', description: 'Corporate logistics dispatch revenue', date: new Date(Date.now() - 5 * 24 * 3600 * 1000) },

    // Expenses
    { type: TransactionType.EXPENSE, amount: 216.00, category: 'FUEL', description: 'Fuel purchase - Mercedes Citaro TX-4482', date: new Date(Date.now() - 12 * 3600 * 1000) },
    { type: TransactionType.EXPENSE, amount: 432.00, category: 'FUEL', description: 'Fuel purchase - Scania Citywide TX-5049', date: new Date(Date.now() - 36 * 3600 * 1000) },
    { type: TransactionType.EXPENSE, amount: 250.00, category: 'MAINTENANCE', description: 'Oil Replacement - Ford Transit TX-3021', date: new Date(Date.now() - 24 * 3600 * 1000) },
    { type: TransactionType.EXPENSE, amount: 890.00, category: 'MAINTENANCE', description: 'Brake Pads - Volvo FH16 TX-1209', date: new Date(Date.now() - 48 * 3600 * 1000) },
    { type: TransactionType.EXPENSE, amount: 1500.00, category: 'SALARY', description: 'Driver salaries disbursement - Week 27', date: new Date(Date.now() - 4 * 24 * 3600 * 1000) },
  ];

  for (const tx of transactionsData) {
    await prisma.transaction.create({ data: tx });
  }
  console.log(`✅ Seeded financial transactions.`);

  // 7. Seed Audit Logs for Activity Dashboard
  const auditLogsData = [
    { userId: managerId, action: 'CREATE' as any, module: 'fleet', entityId: vehicles[0].id, entityType: 'Vehicle', description: 'Added new Electric Bus to fleet' },
    { userId: managerId, action: 'UPDATE' as any, module: 'maintenance', entityId: vehicles[3].id, entityType: 'Maintenance', description: 'Sent vehicle TX-3021 for oil replacement service' },
    { userId: driverId, action: 'LOGIN' as any, module: 'auth', description: 'Driver logged in to mobile portal' },
    { userId: managerId, action: 'CREATE' as any, module: 'trips', description: 'Dispatched intercity route trip for BYD Electric Bus' },
  ];

  for (const log of auditLogsData) {
    await prisma.auditLog.create({
      data: {
        userId: log.userId,
        action: log.action,
        module: log.module,
        entityId: log.entityId,
        entityType: log.entityType,
        metadata: log.description ? { message: log.description } : undefined,
      }
    });
  }
  console.log(`✅ Seeded activity logs.`);

  console.log('🎉 Dashboard data seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, TripStatus, VehicleStatus, DriverStatus } from '@prisma/client';

const prisma = new PrismaClient();

const cargos = [
  { desc: 'Electronics and smart accessories', weight: 450.5 },
  { desc: 'Medical supplies and pharmaceuticals', weight: 220.0 },
  { desc: 'Automotive replacement parts', weight: 890.0 },
  { desc: 'Fresh organic produce and dairy', weight: 1200.5 },
  { desc: 'E-commerce retail packages', weight: 650.0 },
  { desc: 'Office furniture and stationary', weight: 1400.0 },
  { desc: 'Apparel and textile rolls', weight: 750.0 },
  { desc: 'Industrial tools and hardware', weight: 1800.0 },
  { desc: 'HVAC parts and equipment', weight: 1100.0 },
  { desc: 'Dry food items and beverage crates', weight: 1650.5 }
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

async function main() {
  console.log('🌱 Seeding 50 realistic trips...');

  // 1. Fetch available routes, vehicles, and drivers
  const routes = await prisma.route.findMany();
  if (routes.length === 0) {
    console.log('⚠️ No routes found! Creating basic routes first...');
    const routesData = [
      { name: 'East-West Express (R-101)', startLocation: 'Terminal A (Downtown)', endLocation: 'Terminal B (Airport)', distance: 24.5, duration: 45 },
      { name: 'North Circular (R-202)', startLocation: 'North Plaza', endLocation: 'Industrial Park', distance: 18.2, duration: 35 },
      { name: 'South Shuttle (R-303)', startLocation: 'South Metro Station', endLocation: 'University Campus', distance: 8.5, duration: 15 },
      { name: 'Intercity Route (R-404)', startLocation: 'Central Hub', endLocation: 'Metro City East', distance: 120.0, duration: 120 },
      { name: 'Coastal Line (R-505)', startLocation: 'West Coast Marina', endLocation: 'Harbor Gate', distance: 35.8, duration: 60 },
    ];
    for (const r of routesData) {
      routes.push(await prisma.route.create({ data: r }));
    }
  }

  const vehicles = await prisma.vehicle.findMany();
  const drivers = await prisma.driver.findMany();

  if (vehicles.length === 0 || drivers.length === 0) {
    throw new Error('❌ Please ensure vehicles and drivers are seeded first.');
  }

  // Clear existing trips
  await prisma.trip.deleteMany({});

  const statuses = [
    TripStatus.COMPLETED,
    TripStatus.COMPLETED,
    TripStatus.COMPLETED,
    TripStatus.DISPATCHED,
    TripStatus.DRAFT,
    TripStatus.CANCELLED
  ];

  for (let i = 0; i < 50; i++) {
    const route = routes[i % routes.length];
    const vehicle = vehicles[i % vehicles.length];
    const driver = drivers[i % drivers.length];
    const cargo = cargos[i % cargos.length];

    const status = statuses[i % statuses.length];
    const estimatedCost = Math.round((route.distance * 1.5 + randomBetween(20, 50)) * 100) / 100;
    const estimatedFuel = Math.round((route.distance * 0.15 + randomBetween(2, 5)) * 10) / 10;

    let startTime: Date | null = null;
    let endTime: Date | null = null;
    let actualDistance: number | null = null;

    if (status === TripStatus.COMPLETED) {
      startTime = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000); // Past days
      endTime = new Date(startTime.getTime() + route.duration * 60 * 1000);
      actualDistance = Math.round((route.distance + randomBetween(-1, 3)) * 10) / 10;
    } else if (status === TripStatus.DISPATCHED) {
      startTime = new Date(Date.now() - randomBetween(10, 120) * 60 * 1000); // Started recently
    }

    await prisma.trip.create({
      data: {
        vehicleId: vehicle.id,
        driverId: driver.id,
        routeId: route.id,
        status,
        cargoWeight: cargo.weight,
        cargoDescription: cargo.desc,
        estimatedCost,
        estimatedFuel,
        startTime,
        endTime,
        actualDistance,
      }
    });
  }

  // Assign one vehicle/driver to ON_TRIP for active testing consistency
  const dispatchedTrip = await prisma.trip.findFirst({
    where: { status: TripStatus.DISPATCHED }
  });
  if (dispatchedTrip) {
    await prisma.vehicle.update({
      where: { id: dispatchedTrip.vehicleId },
      data: { status: VehicleStatus.ON_TRIP }
    });
    await prisma.driver.update({
      where: { id: dispatchedTrip.driverId },
      data: { status: DriverStatus.ON_TRIP }
    });
  }

  console.log('🎉 50 realistic trips seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

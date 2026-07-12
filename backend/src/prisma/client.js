/**
 * Prisma v7 requires the DB connection URL to be passed via a driver adapter,
 * not via the schema datasource block.
 *
 * This singleton creates one PrismaClient instance for the whole app.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg }     = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma  = new PrismaClient({ adapter });

module.exports = prisma;

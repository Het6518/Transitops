# TransitOps — Backend Execution Plan
**Stack:** Node.js + Express + PostgreSQL + Prisma ORM
**Purpose of this file:** This is a phase-wise execution spec for an 8-hour hackathon backend build. It is meant to be fed to an LLM coding agent (e.g. Claude Code) ONE PHASE AT A TIME.

## How to use this file (instructions for the executing LLM)

1. Execute **only the phase explicitly requested** — never jump ahead, even if later phases look trivial.
2. Before writing code for a phase, restate the phase's acceptance criteria back to the user.
3. After finishing a phase, run the "Definition of Done" checklist for that phase and report pass/fail per item. Do not silently mark a phase complete.
4. If a business rule is ambiguous or a prerequisite from an earlier phase is missing, STOP and ask — do not assume.
5. Every state-changing operation (dispatch, complete, cancel, maintenance open/close) MUST be wrapped in a single DB transaction. This is a hard constraint, not a suggestion — partial updates are the most common bug in this domain.
6. Do not build frontend code as part of this plan — this file is backend-only.

---

## Phase 0 — Project Setup
**Goal:** Runnable Express server with DB connectivity, nothing else.

**Tasks:**
- `npm init`, install `express`, `prisma`, `@prisma/client`, `bcrypt`, `jsonwebtoken`, `dotenv`, `zod` (request validation), `cors`
- `.env` with `DATABASE_URL`, `JWT_SECRET`
- `prisma init` → connect to Postgres
- Express skeleton: `app.js`, centralized error-handling middleware, `/health` route
- Folder structure:
```
src/
  routes/
  controllers/
  services/
  middleware/
  prisma/schema.prisma
```

**Definition of Done:**
- [ ] `GET /health` returns 200
- [ ] Prisma connects to DB without error

---

## Phase 1 — Schema & Migrations
**Goal:** Full DB schema in one migration. No app logic yet.

**Prisma schema (entities from spec section 6):**

```prisma
enum RoleName {
  FLEET_MANAGER
  DRIVER
  SAFETY_OFFICER
  FINANCIAL_ANALYST
}

enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  IN_SHOP
  RETIRED
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  OFF_DUTY
  SUSPENDED
}

enum TripStatus {
  DRAFT
  DISPATCHED
  COMPLETED
  CANCELLED
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         RoleName
  createdAt    DateTime @default(now())
}

model Vehicle {
  id              String        @id @default(uuid())
  regNo           String        @unique
  name            String
  type            String
  maxLoadKg       Float
  odometer        Float         @default(0)
  acquisitionCost Float
  status          VehicleStatus @default(AVAILABLE)
  trips           Trip[]
  maintenanceLogs MaintenanceLog[]
  fuelLogs        FuelLog[]
  expenses        Expense[]
}

model Driver {
  id              String       @id @default(uuid())
  name            String
  licenseNo       String       @unique
  licenseCategory String
  licenseExpiry   DateTime
  contact         String
  safetyScore     Float        @default(100)
  status          DriverStatus @default(AVAILABLE)
  trips           Trip[]
}

model Trip {
  id              String     @id @default(uuid())
  source          String
  destination     String
  vehicleId       String
  driverId        String
  vehicle         Vehicle    @relation(fields: [vehicleId], references: [id])
  driver          Driver     @relation(fields: [driverId], references: [id])
  cargoWeightKg   Float
  plannedDistance Float
  actualOdometer  Float?
  fuelConsumed    Float?
  status          TripStatus @default(DRAFT)
  createdAt       DateTime   @default(now())
  dispatchedAt    DateTime?
  completedAt     DateTime?
}

model MaintenanceLog {
  id          String    @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle   @relation(fields: [vehicleId], references: [id])
  description String
  cost        Float     @default(0)
  startDate   DateTime  @default(now())
  endDate     DateTime?
  isActive    Boolean   @default(true)
}

model FuelLog {
  id        String   @id @default(uuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  liters    Float
  cost      Float
  date      DateTime @default(now())
}

model Expense {
  id        String   @id @default(uuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  type      String   // toll, misc, etc. (maintenance/fuel tracked separately)
  amount    Float
  date      DateTime @default(now())
}
```

**Definition of Done:**
- [ ] `prisma migrate dev` runs clean
- [ ] All 7 entities from spec section 6 present
- [ ] Unique constraints on `Vehicle.regNo` and `Driver.licenseNo`

---

## Phase 2 — Auth + RBAC
**Goal:** All routes below this point are protected and role-aware.

**Business logic:**
- Signup: hash password with bcrypt (cost 10), store role
- Login: verify password, issue JWT `{ userId, role }`, expiry 8h
- Middleware `authenticate`: verify JWT, attach `req.user`
- Middleware `authorize(...roles)`: reject 403 if `req.user.role` not in list

**Role → permission mapping (derive from spec section 2):**
| Action | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|---|---|---|---|---|
| Vehicle CRUD | ✅ | ❌ | 👁 read | 👁 read |
| Driver CRUD | ✅ | ❌ | ✅ | 👁 read |
| Create/dispatch trip | 👁 | ✅ | 👁 | 👁 |
| Maintenance | ✅ | ❌ | 👁 | 👁 |
| Fuel/Expense logging | ✅ | ✅ | ❌ | 👁 |
| Reports/Dashboard | ✅ | ❌ | ✅ (safety-related) | ✅ |

(✅ = full access, 👁 = read-only, ❌ = no access — flag to user if this table needs adjusting per their exact mockup)

**Endpoints:**
- `POST /auth/signup`
- `POST /auth/login`

**Definition of Done:**
- [ ] Cannot hit any Phase 3+ route without valid JWT
- [ ] Wrong-role request returns 403, not 401
- [ ] Passwords never returned in any response payload

---

## Phase 3 — Vehicle CRUD
**Endpoints:** `POST/GET/PATCH/DELETE /vehicles`, `GET /vehicles/:id`

**Business rules:**
- `regNo` uniqueness enforced at DB + friendly 409 error at API level
- Default status on creation = `AVAILABLE`
- Manual status edit via PATCH allowed only for Fleet Manager (e.g. marking `RETIRED`)
- `GET /vehicles?status=AVAILABLE&type=truck` — fil터support for Dashboard (Phase 8 reuses this)

**Definition of Done:**
- [ ] Duplicate regNo → 409 with clear message
- [ ] Filters work via query params

---

## Phase 4 — Driver CRUD
**Endpoints:** `POST/GET/PATCH/DELETE /drivers`, `GET /drivers/:id`

**Business rules:**
- `licenseNo` unique
- Default status = `AVAILABLE`
- Store `licenseExpiry` as DateTime; expose a computed field `isLicenseValid` (server-side, `licenseExpiry > now()`) on every GET — Phase 5 depends on this check

**Definition of Done:**
- [ ] Expired-license driver still visible in list but flagged `isLicenseValid: false`

---

## Phase 5 — Trip Management (core logic — budget the most time here)

**State machine:**
```
DRAFT --dispatch()--> DISPATCHED --complete()--> COMPLETED
    \-- cancel() [only from DRAFT] --> CANCELLED
              DISPATCHED -- cancel() --> CANCELLED
```

### 5a. `POST /trips` (create, status=DRAFT)
No side effects on Vehicle/Driver yet. Just validation:
- `cargoWeightKg <= vehicle.maxLoadKg` → else 400
- vehicle and driver must exist → else 404

### 5b. `POST /trips/:id/dispatch`
**Run checks in this exact order (fail fast, return first failure):**
1. Trip.status === DRAFT (else 409 "trip not in draft state")
2. Vehicle.status === AVAILABLE (else 409 — covers Retired/InShop/OnTrip)
3. Driver.status === AVAILABLE (else 409)
4. Driver.licenseExpiry > now() (else 403 "license expired")
5. Driver.status !== SUSPENDED (redundant with #3 but check explicitly — safety-critical)
6. cargoWeightKg <= vehicle.maxLoadKg (re-validate — vehicle/cargo may have changed since draft)

**If all pass, single Prisma `$transaction`:**
```js
await prisma.$transaction([
  prisma.trip.update({ where: {id}, data: { status: 'DISPATCHED', dispatchedAt: new Date() }}),
  prisma.vehicle.update({ where: {id: vehicleId}, data: { status: 'ON_TRIP' }}),
  prisma.driver.update({ where: {id: driverId}, data: { status: 'ON_TRIP' }}),
]);
```

### 5c. `POST /trips/:id/complete`
Body: `{ actualOdometer, fuelConsumed }`
- Trip.status must be DISPATCHED (else 409)
- Transaction:
  - Trip.status = COMPLETED, completedAt = now, store actualOdometer + fuelConsumed
  - Vehicle.status = AVAILABLE, Vehicle.odometer = actualOdometer
  - Driver.status = AVAILABLE
- Optionally auto-create a FuelLog entry from `fuelConsumed` if a cost-per-liter is provided (flag to user — spec doesn't specify cost input here, may need a separate fuel log call)

### 5d. `POST /trips/:id/cancel`
- Allowed from DRAFT or DISPATCHED only
- If DRAFT → just set CANCELLED, no entity side effects (nothing was reserved)
- If DISPATCHED → transaction: Trip.status=CANCELLED, Vehicle.status=AVAILABLE, Driver.status=AVAILABLE

**Definition of Done:**
- [ ] Every transition covered by the example workflow (spec section 5) passes end-to-end
- [ ] Attempting to dispatch an already-OnTrip vehicle fails with 409
- [ ] Attempting cargo > maxLoad fails with 400 at both draft and dispatch time
- [ ] No orphaned states possible (kill the server mid-request in testing — DB should never show Vehicle=OnTrip with no active Trip)

---

## Phase 6 — Maintenance Workflow
**Endpoints:** `POST /maintenance`, `PATCH /maintenance/:id/close`, `GET /maintenance?vehicleId=`

**Business rules:**
- `POST /maintenance` (create active log):
  - Reject if Vehicle.status === ON_TRIP (can't service a vehicle mid-trip)
  - Transaction: create MaintenanceLog(isActive=true), Vehicle.status = IN_SHOP
- `PATCH /maintenance/:id/close`:
  - Transaction: MaintenanceLog.isActive=false, endDate=now, Vehicle.status = AVAILABLE **unless** Vehicle.status was manually set to RETIRED (check before reverting — don't un-retire a vehicle)
- A vehicle in `IN_SHOP` must be excluded from `GET /vehicles?status=AVAILABLE` used by Trip dispatch dropdown (already covered by Phase 3 filter — verify here)

**Definition of Done:**
- [ ] Creating maintenance on an On-Trip vehicle is rejected
- [ ] Closing maintenance on a Retired vehicle keeps it Retired, not Available

---

## Phase 7 — Fuel & Expense Management
**Endpoints:** `POST /vehicles/:id/fuel-logs`, `POST /vehicles/:id/expenses`, `GET /vehicles/:id/cost-summary`

**Business logic:**
- FuelLog and Expense are simple append-only records tied to a vehicle
- `GET /vehicles/:id/cost-summary` computes:
  ```
  totalFuelCost = SUM(FuelLog.cost WHERE vehicleId)
  totalMaintenanceCost = SUM(MaintenanceLog.cost WHERE vehicleId)
  totalExpenses = SUM(Expense.amount WHERE vehicleId)
  totalOperationalCost = totalFuelCost + totalMaintenanceCost
  ```
  (Spec 3.7 defines operational cost as Fuel + Maintenance only — Expense/tolls tracked separately unless user confirms otherwise)

**Definition of Done:**
- [ ] Cost summary math verified against a manually-computed example

---

## Phase 8 — Dashboard KPIs & Reports (build last — aggregates everything)

**`GET /dashboard`** — supports `?vehicleType=&status=&region=` filters
```
activeVehicles      = COUNT(Vehicle WHERE status != RETIRED)
availableVehicles   = COUNT(Vehicle WHERE status == AVAILABLE)
inMaintenance       = COUNT(Vehicle WHERE status == IN_SHOP)
activeTrips         = COUNT(Trip WHERE status == DISPATCHED)
pendingTrips        = COUNT(Trip WHERE status == DRAFT)
driversOnDuty       = COUNT(Driver WHERE status == ON_TRIP)
fleetUtilization%   = (Vehicle WHERE status == ON_TRIP) / (total non-retired vehicles) * 100
```

**`GET /reports`** — per-vehicle:
```
fuelEfficiency = totalDistanceDriven / totalFuelConsumed   (from completed trips + fuel logs)
operationalCost = totalFuelCost + totalMaintenanceCost      (from Phase 7)
vehicleROI = (Revenue - (Maintenance + Fuel)) / AcquisitionCost
```
> ⚠️ Gap to flag: spec doesn't define where "Revenue" comes from — no revenue/billing entity exists in section 6. Confirm with user whether trips carry a revenue/fare field, or whether ROI is out of scope for the 8hr build.

**`GET /reports/export.csv`** — stream computed report rows as CSV (use `json2csv` or manual stringify, no need for a heavy lib)

**Definition of Done:**
- [ ] Dashboard numbers match manual DB query on seeded data
- [ ] CSV downloads and opens correctly in Excel/Sheets

---

## Phase 9 — Seed Data + API Collection
- Seed script: 5 vehicles (mixed statuses), 5 drivers (one with expired license, one suspended), 3 completed trips, 1 active maintenance log, fuel logs
- Export a Postman/Insomnia collection or `requests.http` file covering every endpoint above, so frontend can integrate without reading backend code

**Definition of Done:**
- [ ] `npm run seed` populates a clean DB reproducibly
- [ ] Collection covers all endpoints in Phases 2–8

---

## Cross-cutting rules (apply in every phase)
- All state-changing multi-entity operations → single Prisma `$transaction`
- All input validated with `zod` at the route boundary before hitting service logic
- Consistent error shape: `{ error: { code, message } }`
- Never expose `passwordHash` in any response

## Open questions to resolve with the user before/during Phase 8
1. Where does trip "Revenue" for ROI come from — is there a fare field to add to Trip?
2. Does `region` (used in Dashboard filter) exist anywhere in the current schema — needs adding to Vehicle if required.

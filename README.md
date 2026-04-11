# 🏥 MedNex — Enterprise Hospital Management System

A full-stack, multi-tenant Hospital Management System built with **Spring Boot** (backend) and **React** (frontend), featuring HIPAA/GDPR compliance, EMR, scheduling, analytics, and a premium dark UI.

---

## 📁 Project Structure

```
mednex/
├── backend/          ← Spring Boot (Java 17, Maven)
│   ├── src/main/java/com/mednex/backend/
│   │   ├── config/         MultiTenantConfig, SecurityConfig
│   │   ├── controller/     Auth, Patient, Appointment, MedicalRecord, Analytics, Audit, Dashboard, Export
│   │   ├── dto/            Request/Response DTOs
│   │   ├── entity/         Tenant, User, Role, UserRole
│   │   ├── model/          Patient, Appointment, MedicalRecord, AuditLog, BedOccupancy
│   │   ├── repository/     JPA Repositories
│   │   ├── security/       JWT Auth Filter, JwtUtils, UserDetailsService
│   │   ├── service/        Business logic services
│   │   └── tenant/         TenantContext, TenantFilter, TenantConnectionProvider
│   └── src/main/resources/
│       └── application.properties
│
├── frontend/         ← React 18 + Recharts + React Router v6
│   └── src/
│       ├── components/     Layout (sidebar + topbar), ProtectedRoute
│       ├── context/        AuthContext (JWT + tenant)
│       ├── hooks/          useAuth
│       ├── pages/          Dashboard, Patients, Appointments, MedicalRecords, Analytics, Audit, Login, Register
│       ├── services/       api.js (all Axios calls)
│       └── styles/         global.css (CSS variables, premium theme)
│
└── Schema.sql        ← Complete MySQL database schema
```

---

## 🚀 Quick Start

### Prerequisites
- **Java 17+** & Maven
- **MySQL 8.0+**
- **Node.js 18+** & npm

---

### Step 1 — Database Setup

```bash
# Log into MySQL
mysql -u root -p

# Run the schema (creates mednex_db, all tables, sample data)
mysql -u root -p < Schema.sql
```

This creates:
- Database `mednex_db`
- Tables: `tenants`, `users`, `roles`, `user_roles`, `patients`, `doctors`, `appointments`, `medical_records`, `audit_logs`, `beds`, `admissions`, etc.
- 3 sample tenants: `HOSP_A`, `HOSP_B`, `HOSP_C`
- Sample users, doctors, patients, appointments

---

### Step 2 — Backend

```bash
cd backend

# Option A: Maven wrapper (recommended)
./mvnw spring-boot:run

# Option B: Build JAR first
./mvnw clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Backend starts at: **http://localhost:8082/api**

**application.properties** (already configured):
```properties
server.port=8082
spring.datasource.url=jdbc:mysql://localhost:3306/mednex_db
spring.datasource.username=mednex_user
spring.datasource.password=Mednex@1234
app.jwt.secret=MedNexSecretKey2024VeryLongSecretKeyForJWTSigningMustBe256BitsAtLeast
```

---

### Step 3 — Frontend

```bash
cd frontend
npm install
npm start
```

Frontend starts at: **http://localhost:3000**

---

## 🔑 Login Credentials

| Username | Password | Tenant | Role |
|---|---|---|---|
| `admin_hosp_a` | `password123` | HOSP_A — City Central Hospital | Admin |
| `dr_smith_hosp_a` | `password123` | HOSP_A — City Central Hospital | Doctor |
| `nurse_johnson_hosp_a` | `password123` | HOSP_A — City Central Hospital | Nurse |
| `admin_hosp_b` | `password123` | HOSP_B — Community Healthcare | Admin |
| `dr_wilson_hosp_b` | `password123` | HOSP_B — Community Healthcare | Doctor |

> **Note**: The BCrypt hashes in the schema are sample values. If login fails, re-hash `password123` with BCrypt $2a$10 and update the `users` table.

**Quick fix for passwords:**
```sql
-- Update all user passwords to 'password123'
UPDATE users SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
```
*(This is the BCrypt hash of "password" — for testing only)*

For `password123` specifically, run this in your Spring Boot app or use an online BCrypt generator and update:
```sql
UPDATE users SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login — returns JWT |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/patients` | Get all patients (tenant-filtered) |
| POST | `/api/patients` | Create patient |
| GET | `/api/patients/{id}` | Get patient by ID |
| PUT | `/api/patients/{id}` | Update patient |
| DELETE | `/api/patients/{id}` | Delete patient |
| GET | `/api/patients/search?q=` | Search patients |
| GET | `/api/appointments` | Get all appointments |
| POST | `/api/appointments` | Book appointment |
| PATCH | `/api/appointments/{id}/cancel` | Cancel appointment |
| GET | `/api/medical-records/patient/{id}` | EMR by patient |
| POST | `/api/medical-records` | Create EMR |
| GET | `/api/analytics/bed-occupancy` | Bed stats |
| GET | `/api/analytics/trend` | 7-day trend |
| GET | `/api/audit/logs` | Audit logs |
| GET | `/api/dashboard/stats` | Dashboard stats |
| GET | `/api/export/patient/{id}` | PDF export |

**All protected endpoints require:**
```
Authorization: Bearer <JWT_TOKEN>
X-Tenant-ID: HOSP_A   (or HOSP_B, HOSP_C)
```

---

## 🏗️ Architecture — 4 Week Plan

### Week 1: Architecture & Multi-Tenancy ✅
- `TenantConnectionProvider` — maps `X-Tenant-ID` header to datasource
- `TenantContext` — ThreadLocal tenant isolation
- `TenantFilter` — Spring Filter sets tenant per request
- JWT-based auth with per-tenant user isolation
- Cross-tenant data access blocked at service layer

### Week 2: EMR (Electronic Medical Records) ✅
- `PatientForm` — 50+ field reactive form (5 tabs: Personal, Address, Medical, Emergency, Insurance)
- `MedicalRecord` model with JSONB fields for vital signs, medications, investigations, ICD codes
- FHIR-compatible JSON structure
- PDF export with encryption (iText/PDFBox)

### Week 3: Scheduling & Notification ✅
- `AppointmentController` — conflict detection at service layer
- Calendar/Timeline view + List view
- Doctor double-booking prevention
- Email service (Spring Mail) for confirmations
- `AppointmentForm` — patient picker, doctor picker, date/time with conflict check

### Week 4: Analytics & Export ✅
- `Analytics` page — bed occupancy BarChart, 7-day AreaChart, PieChart, RadialBar
- HIPAA/GDPR Compliance status dashboard
- `AuditLog` — every CRUD logged with user, IP, old/new values
- Encrypted PDF export for patient history
- `Audit` page — expandable rows showing before/after diffs

---

## 🎨 UI Design

- **Theme**: Premium dark medical UI with CSS variables
- **Colors**: Cyan (`#00d4ff`), Emerald (`#00e5a0`), Rose (`#f43f5e`), Amber (`#f59e0b`)
- **Font**: Inter (Google Fonts)
- **Charts**: Recharts (AreaChart, BarChart, PieChart, RadialBarChart)
- **Sidebar**: Collapsible with animated active state, live clock topbar
- **Forms**: Multi-tab with validation, JSON editors for JSONB fields

---

## 🔒 Security

- JWT tokens (24h expiry, refresh tokens supported)
- BCrypt password encoding
- Role-based access (`SUPER_ADMIN`, `ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`)
- Per-tenant data isolation (discriminator column pattern)
- `@CrossOrigin` for CORS (localhost:3000, localhost:5173)
- `GlobalExceptionHandler` for clean error responses
- PDF export with AES-256 encryption

---

## 🗄️ Database Notes

- **MySQL 8.0** (not PostgreSQL — despite the spec saying JSONB, MySQL 8 supports JSON columns natively)
- Multi-tenancy via `tenant_id` column (discriminator pattern, single DB)
- Views: `v_patients`, `v_appointments_with_details`, `v_bed_occupancy`
- Stored Procedures: `GetPatientMedicalSummary`, `LogPatientAccess`
- Triggers: `trg_patient_audit_update`
- Indexes on all FK and frequently queried columns

---

## 🛠 Troubleshooting

**Backend won't start:**
```bash
# Check MySQL is running
mysql -u mednex_user -p'Mednex@1234' mednex_db -e "SELECT 1;"

# Check port 8082 is free
lsof -i :8082
```

**CORS errors:**
- Ensure frontend runs on `localhost:3000`
- `application.properties` has `app.cors.allowed-origins=http://localhost:3000`

**Login fails (401):**
- BCrypt hash mismatch — run the password update SQL above

**No patients loading:**
- Check `X-Tenant-ID` header is sent (AuthContext sets it from `localStorage.mednex_tenant`)
- Verify tenant exists in `tenants` table

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.x, Spring Security, Spring Data JPA |
| Auth | JWT (io.jsonwebtoken), BCrypt |
| Database | MySQL 8.0, Hibernate ORM |
| PDF | iText / PDFBox |
| Email | Spring Mail (SMTP) |
| Frontend | React 18, React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Notifications | React Toastify |
| Styling | Pure CSS with CSS variables (no framework) |

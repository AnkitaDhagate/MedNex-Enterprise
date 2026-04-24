0-- ============================================================
-- MedNex Hospital Management System — CORRECTED Schema
-- MySQL 8.0+
-- ============================================================
CREATE DATABASE IF NOT EXISTS mednex_db;
USE mednex_db;

SET time_zone = '+00:00';

-- ============================================================
-- Table: tenants
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
    id                BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id         VARCHAR(50)  UNIQUE NOT NULL COMMENT 'Unique tenant identifier e.g. HOSP_A',
    tenant_name       VARCHAR(100) NOT NULL,
    schema_name       VARCHAR(50)  NOT NULL,
    db_host           VARCHAR(100) DEFAULT 'localhost',
    db_port           INT          DEFAULT 3306,
    db_name           VARCHAR(100) NOT NULL,
    db_username       VARCHAR(50),
    db_password       VARCHAR(255),
    status            ENUM('ACTIVE','INACTIVE','SUSPENDED') DEFAULT 'ACTIVE',
    subscription_plan ENUM('BASIC','PREMIUM','ENTERPRISE')  DEFAULT 'BASIC',
    max_users         INT          DEFAULT 100,
    max_patients      INT          DEFAULT 10000,
    features          JSON,
    contact_email     VARCHAR(100),
    contact_phone     VARCHAR(20),
    address           TEXT,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO tenants (tenant_id, tenant_name, schema_name, db_name, status, subscription_plan, contact_email) VALUES
('HOSP_A', 'City Central Hospital',   'tenant_hospital_a', 'mednex_db', 'ACTIVE', 'ENTERPRISE', 'admin@cityhospital.com'),
('HOSP_B', 'Community Healthcare',    'tenant_hospital_b', 'mednex_db', 'ACTIVE', 'PREMIUM',    'admin@communityhealth.com'),
('HOSP_C', 'Memorial Medical Center', 'tenant_hospital_c', 'mednex_db', 'ACTIVE', 'BASIC',      'admin@memorial.com');

-- ============================================================
-- Table: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id               BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_name        VARCHAR(50) UNIQUE NOT NULL,
    role_description TEXT,
    role_level       INT          DEFAULT 0,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO roles (role_name, role_description, role_level) VALUES
('SUPER_ADMIN',  'System Administrator with full access', 0),
('ADMIN',        'Hospital Administrator',                10),
('DOCTOR',       'Medical Doctor',                        20),
('NURSE',        'Registered Nurse',                      30),
('RECEPTIONIST', 'Front Desk Receptionist',               40),
('PHARMACIST',   'Pharmacy Staff',                        35),
('LAB_TECH',     'Laboratory Technician',                 35),
('ACCOUNTANT',   'Finance Department',                    40),
('PATIENT',      'Patient User',                          100);

-- ============================================================
-- Table: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id                     BIGINT PRIMARY KEY AUTO_INCREMENT,
    username               VARCHAR(50)  NOT NULL,
    password               VARCHAR(255) NOT NULL,
    email                  VARCHAR(100) NOT NULL,
    first_name             VARCHAR(50),
    last_name              VARCHAR(50),
    tenant_id              VARCHAR(50)  NOT NULL,
    employee_id            VARCHAR(50),
    department             VARCHAR(100),
    designation            VARCHAR(100),
    phone                  VARCHAR(20),
    mobile                 VARCHAR(20),
    profile_pic_url        VARCHAR(255),
    is_active              BOOLEAN      DEFAULT TRUE,
    last_login             TIMESTAMP    NULL,
    failed_login_attempts  INT          DEFAULT 0,
    account_locked         BOOLEAN      DEFAULT FALSE,
    password_changed_at    TIMESTAMP    NULL,
    created_at             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_username_tenant (username, tenant_id),
    UNIQUE KEY unique_email_tenant    (email, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_username  (username),
    INDEX idx_email     (email),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: user_roles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    role_id     BIGINT      NOT NULL,
    tenant_id   VARCHAR(50) NOT NULL,
    assigned_by BIGINT,
    assigned_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_role_tenant (user_id, role_id, tenant_id),
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (role_id)   REFERENCES roles(id)   ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: permissions
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    permission_key  VARCHAR(100) UNIQUE NOT NULL,
    module          VARCHAR(50),
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions (permission_name, permission_key, module) VALUES
('View Patients',         'PATIENT_VIEW',        'PATIENT'),
('Create Patients',       'PATIENT_CREATE',       'PATIENT'),
('Edit Patients',         'PATIENT_EDIT',         'PATIENT'),
('Delete Patients',       'PATIENT_DELETE',       'PATIENT'),
('View Medical Records',  'MEDICAL_RECORD_VIEW',  'MEDICAL'),
('Create Medical Records','MEDICAL_RECORD_CREATE','MEDICAL'),
('Edit Medical Records',  'MEDICAL_RECORD_EDIT',  'MEDICAL'),
('View Appointments',     'APPOINTMENT_VIEW',     'APPOINTMENT'),
('Create Appointments',   'APPOINTMENT_CREATE',   'APPOINTMENT'),
('Manage Schedules',      'SCHEDULE_MANAGE',      'SCHEDULE'),
('View Reports',          'REPORT_VIEW',          'REPORT'),
('Export Data',           'DATA_EXPORT',          'ADMIN'),
('Manage Users',          'USER_MANAGE',          'ADMIN'),
('System Settings',       'SYSTEM_SETTINGS',      'ADMIN');

-- ============================================================
-- Table: role_permissions
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id       BIGINT    NOT NULL,
    permission_id BIGINT    NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: patients
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id    VARCHAR(50)  NOT NULL,
    tenant_id     VARCHAR(50)  NOT NULL,

    -- Personal
    first_name    VARCHAR(50)  NOT NULL,
    last_name     VARCHAR(50)  NOT NULL,
    middle_name   VARCHAR(50),
    date_of_birth DATE         NOT NULL,
    gender        ENUM('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY') NOT NULL,
    blood_group   ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),

    -- Contact
    email         VARCHAR(100),          -- nullable; blank→NULL in app to avoid unique clash
    phone         VARCHAR(20),
    mobile        VARCHAR(20)  NOT NULL,
    alternate_phone VARCHAR(20),
    address_line1 TEXT,
    address_line2 TEXT,
    city          VARCHAR(50),
    state         VARCHAR(50),
    postal_code   VARCHAR(20),
    country       VARCHAR(50)  DEFAULT 'India',

    -- Demographic
    nationality   VARCHAR(50),
    occupation    VARCHAR(100),
    marital_status ENUM('SINGLE','MARRIED','DIVORCED','WIDOWED'),
    religion      VARCHAR(50),

    -- Medical (JSON)
    medical_history     JSON,
    current_medications JSON,
    allergies           JSON,
    chronic_conditions  JSON,
    immunizations       JSON,
    family_history      JSON,
    lifestyle_factors   JSON,

    -- Emergency Contact
    emergency_contact_name         VARCHAR(100),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone        VARCHAR(20),
    emergency_contact_alternate    VARCHAR(20),

    -- Insurance
    insurance_provider      VARCHAR(100),
    insurance_policy_number VARCHAR(50),
    insurance_group_number  VARCHAR(50),
    insurance_valid_from    DATE,
    insurance_valid_to      DATE,
    insurance_details       JSON,

    -- Primary Doctor
    primary_doctor_id   BIGINT,
    primary_doctor_name VARCHAR(100),

    -- Status
    patient_status     ENUM('ACTIVE','INACTIVE','DECEASED','TRANSFERRED') DEFAULT 'ACTIVE',
    registration_date  DATE NOT NULL,
    registration_type  ENUM('EMERGENCY','OPD','IPD','REFERRAL','Online') DEFAULT 'OPD',

    -- Additional
    notes            TEXT,
    profile_photo_url VARCHAR(255),

    -- Audit
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    UNIQUE KEY unique_patient_id_tenant (patient_id, tenant_id),
    -- FIX: Email unique per tenant; NULL values are allowed (MySQL NULLs are distinct)
    UNIQUE KEY unique_email_tenant      (email, tenant_id),
    INDEX idx_tenant_id    (tenant_id),
    INDEX idx_patient_id   (patient_id),
    INDEX idx_name         (first_name, last_name),
    INDEX idx_phone        (phone),
    INDEX idx_email        (email),
    INDEX idx_status       (patient_status),
    INDEX idx_reg_date     (registration_date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: doctors
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
    id                    BIGINT PRIMARY KEY AUTO_INCREMENT,
    doctor_id             VARCHAR(50) NOT NULL,
    tenant_id             VARCHAR(50) NOT NULL,
    user_id               BIGINT,

    specialization        VARCHAR(100) NOT NULL,
    sub_specialization    VARCHAR(100),
    qualifications        JSON,
    license_number        VARCHAR(50) UNIQUE,
    registration_number   VARCHAR(50),
    registration_council  VARCHAR(100),
    registration_year     INT,
    experience_years      INT,

    consultation_fee      DECIMAL(10,2),
    follow_up_fee         DECIMAL(10,2),
    is_available          BOOLEAN DEFAULT TRUE,
    available_days        JSON,

    department_id         BIGINT,
    department_name       VARCHAR(100),
    designation           VARCHAR(100),

    doctor_status ENUM('ACTIVE','INACTIVE','ON_LEAVE','RESIGNED') DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_doctor_id_tenant (doctor_id, tenant_id),
    INDEX idx_tenant_id      (tenant_id),
    INDEX idx_specialization (specialization),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: appointments  (FIXED — added missing columns)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    appointment_id  VARCHAR(50)  NOT NULL,
    tenant_id       VARCHAR(50)  NOT NULL,

    -- References
    patient_id      BIGINT       NOT NULL,
    doctor_id       BIGINT       NOT NULL,
    referred_by     BIGINT,                       -- FIXED: was missing

    -- Scheduling
    appointment_date DATE        NOT NULL,
    appointment_time TIME        NOT NULL,
    duration_minutes INT         DEFAULT 30,

    -- Type & Status
    appointment_type VARCHAR(50),                  -- IN_PERSON / TELECONSULT / etc.
    status           VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',

    -- Patient snapshot (denormalised for fast reads)
    patient_name    VARCHAR(100),
    patient_phone   VARCHAR(20),                   -- FIXED: was missing
    patient_email   VARCHAR(100),

    -- Doctor snapshot
    doctor_name     VARCHAR(100),                  -- FIXED: was missing

    -- Medical details
    reason_for_visit TEXT,
    symptoms         JSON,
    urgency_level    VARCHAR(20) DEFAULT 'MEDIUM', -- FIXED: was missing

    -- Location
    department      VARCHAR(100),
    room_number     VARCHAR(20),                   -- FIXED: was missing
    floor           INT,                           -- FIXED: was missing

    -- Billing                                     -- FIXED: all were missing
    consultation_fee DECIMAL(10,2),
    discount_amount  DECIMAL(10,2) DEFAULT 0,
    total_amount     DECIMAL(10,2),
    payment_status   VARCHAR(20)  DEFAULT 'PENDING',

    -- Reminders
    reminder_sent      BOOLEAN DEFAULT FALSE,
    confirmation_sent  BOOLEAN DEFAULT FALSE,      -- FIXED: was missing

    -- Cancellation
    cancelled_by         BIGINT,
    cancellation_reason  TEXT,                     -- FIXED: was missing
    cancelled_at         TIMESTAMP NULL,           -- FIXED: was missing

    -- Audit
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_appointment_id_tenant   (appointment_id, tenant_id),
    UNIQUE KEY uk_doctor_date_time_tenant     (doctor_id, appointment_date, appointment_time, tenant_id),
    INDEX idx_tenant_id      (tenant_id),
    INDEX idx_patient_id     (patient_id),
    INDEX idx_doctor_id      (doctor_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status         (status),
    INDEX idx_doctor_date    (doctor_id, appointment_date),
    INDEX idx_date_time      (appointment_date, appointment_time),
    INDEX idx_doctor_status  (doctor_id, status),
    INDEX idx_patient_status (patient_id, status),
    FOREIGN KEY (tenant_id)  REFERENCES tenants(tenant_id)  ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id)        ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: medical_records
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_records (
    id             BIGINT PRIMARY KEY AUTO_INCREMENT,
    record_id      VARCHAR(50) NOT NULL,
    tenant_id      VARCHAR(50) NOT NULL,
    patient_id     BIGINT      NOT NULL,
    doctor_id      BIGINT      NOT NULL,
    appointment_id BIGINT,

    encounter_date DATETIME    NOT NULL,
    encounter_type ENUM('OPD','IPD','EMERGENCY','TELEMEDICINE') NOT NULL,
    department     VARCHAR(100),

    chief_complaint              TEXT,
    history_of_present_illness   TEXT,
    past_medical_history         JSON,
    family_history               JSON,
    social_history               JSON,

    vital_signs          JSON,
    physical_examination TEXT,
    systemic_examination JSON,

    investigations   JSON,
    radiology_reports JSON,
    other_diagnostics JSON,

    primary_diagnosis   TEXT,
    secondary_diagnosis JSON,
    icd_codes           JSON,

    treatment_plan        TEXT,
    medications_prescribed JSON,
    procedures            JSON,

    follow_up_required    BOOLEAN DEFAULT FALSE,
    follow_up_date        DATE,
    follow_up_instructions TEXT,

    disposition   ENUM('DISCHARGED','ADMITTED','REFERRED','FOLLOW_UP') DEFAULT 'FOLLOW_UP',
    referral_notes TEXT,

    fhir_resource JSON,

    is_confidential BOOLEAN DEFAULT FALSE,
    access_count    INT     DEFAULT 0,
    created_by      BIGINT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by      BIGINT,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_record_id_tenant (record_id, tenant_id),
    INDEX idx_tenant_id     (tenant_id),
    INDEX idx_patient_id    (patient_id),
    INDEX idx_doctor_id     (doctor_id),
    INDEX idx_encounter_date (encounter_date),
    INDEX idx_patient_date  (patient_id, encounter_date),
    INDEX idx_doctor_date   (doctor_id, encounter_date),
    FOREIGN KEY (tenant_id)  REFERENCES tenants(tenant_id)  ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id)        ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: audit_logs  (FIXED — column renames + nullable user_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id   VARCHAR(50)  NOT NULL,

    -- FIXED: user_id is now nullable; audit entries from async/system have no userId
    user_id     BIGINT,
    username    VARCHAR(50),

    action      VARCHAR(100) NOT NULL,

    -- FIXED: renamed from resource_type / resource_id to match AuditLog.java @Column
    entity_type VARCHAR(50),
    entity_id   VARCHAR(50),

    old_value   JSON,
    new_value   JSON,

    -- description field for AuditService.log() calls
    description TEXT,

    ip_address  VARCHAR(45),
    user_agent  TEXT,
    request_url VARCHAR(255),
    http_method VARCHAR(10),
    status_code INT,
    duration_ms INT,
    reason      TEXT,

    success     BOOLEAN DEFAULT TRUE,

    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant_id   (tenant_id),
    INDEX idx_user_id     (user_id),
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id   (entity_id),
    INDEX idx_created_at  (created_at),
    INDEX idx_composite   (tenant_id, entity_type, created_at),
    INDEX idx_user        (user_id, created_at),

    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    -- FIXED: ON DELETE SET NULL instead of CASCADE — audit logs must survive user deletion
    FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: departments
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id               BIGINT PRIMARY KEY AUTO_INCREMENT,
    department_code  VARCHAR(20)  NOT NULL,
    tenant_id        VARCHAR(50)  NOT NULL,
    department_name  VARCHAR(100) NOT NULL,
    head_of_department BIGINT,
    description      TEXT,
    location         VARCHAR(100),
    phone            VARCHAR(20),
    email            VARCHAR(100),
    is_active        BOOLEAN      DEFAULT TRUE,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dept_code_tenant (department_code, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: beds
-- ============================================================
CREATE TABLE IF NOT EXISTS beds (
    id                    BIGINT PRIMARY KEY AUTO_INCREMENT,
    bed_number            VARCHAR(20) NOT NULL,
    tenant_id             VARCHAR(50) NOT NULL,
    ward_id               BIGINT,
    ward_name             VARCHAR(100),
    department_id         BIGINT,
    bed_type              ENUM('GENERAL','SEMI_PRIVATE','PRIVATE','ICU','CCU','EMERGENCY') NOT NULL,
    floor                 INT,
    room_number           VARCHAR(20),
    is_occupied           BOOLEAN DEFAULT FALSE,
    current_patient_id    BIGINT,
    current_admission_id  BIGINT,
    status                ENUM('AVAILABLE','OCCUPIED','MAINTENANCE','RESERVED') DEFAULT 'AVAILABLE',
    daily_rate            DECIMAL(10,2),
    amenities             JSON,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_bed_number_tenant (bed_number, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status    (status),
    INDEX idx_ward      (ward_id),
    INDEX idx_status_type (status, bed_type),
    FOREIGN KEY (tenant_id)          REFERENCES tenants(tenant_id)  ON DELETE CASCADE,
    FOREIGN KEY (current_patient_id) REFERENCES patients(id)        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: admissions
-- ============================================================
CREATE TABLE IF NOT EXISTS admissions (
    id                     BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id           VARCHAR(50) NOT NULL,
    tenant_id              VARCHAR(50) NOT NULL,
    patient_id             BIGINT      NOT NULL,
    bed_id                 BIGINT,
    admitting_doctor_id    BIGINT,
    admission_date         DATETIME    NOT NULL,
    admission_type         ENUM('EMERGENCY','PLANNED','TRANSFER') NOT NULL,
    discharge_date         DATETIME,
    discharge_type         ENUM('DISCHARGED','TRANSFERRED','EXPIRED','LAMA') NULL,
    diagnosis_at_admission TEXT,
    discharge_summary      TEXT,
    status                 ENUM('ACTIVE','DISCHARGED','TRANSFERRED') DEFAULT 'ACTIVE',
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_admission_id_tenant (admission_id, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_status     (status),
    FOREIGN KEY (tenant_id)  REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id)       ON DELETE CASCADE,
    FOREIGN KEY (bed_id)     REFERENCES beds(id)           ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: prescriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id                    BIGINT PRIMARY KEY AUTO_INCREMENT,
    prescription_id       VARCHAR(50) NOT NULL,
    tenant_id             VARCHAR(50) NOT NULL,
    patient_id            BIGINT      NOT NULL,
    doctor_id             BIGINT      NOT NULL,
    medical_record_id     BIGINT,
    prescription_date     DATETIME    NOT NULL,
    medications           JSON        NOT NULL,
    instructions          TEXT,
    refills               INT         DEFAULT 0,
    is_controlled_substance BOOLEAN   DEFAULT FALSE,
    status                ENUM('ACTIVE','COMPLETED','EXPIRED','CANCELLED') DEFAULT 'ACTIVE',
    created_at            TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_prescription_id_tenant (prescription_id, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id  (doctor_id),
    FOREIGN KEY (tenant_id)  REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id)       ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Sample Data
-- ============================================================

-- Users (password = 'password123' BCrypt encoded)
INSERT IGNORE INTO users (username, password, email, first_name, last_name, tenant_id, employee_id, department, designation, is_active) VALUES
('admin_hosp_a',         'password123', 'admin@cityhospital.com',      'John',   'Admin',   'HOSP_A', 'EMP001', 'Administration', 'Hospital Administrator', TRUE),
('dr_smith_hosp_a',      'password123', 'dr.smith@cityhospital.com',   'John',   'Smith',   'HOSP_A', 'DOC001', 'Cardiology',     'Senior Cardiologist',    TRUE),
('nurse_johnson_hosp_a', 'password123', 'nurse.johnson@cityhospital.com', 'Emily', 'Johnson', 'HOSP_A', 'NUR001', 'Cardiology',  'Staff Nurse',            TRUE),
('admin_hosp_b',         'password123', 'admin@communityhealth.com',   'Sarah',  'Admin',   'HOSP_B', 'EMP001', 'Administration', 'Hospital Administrator', TRUE),
('dr_wilson_hosp_b',     'password123', 'dr.wilson@communityhealth.com','Robert','Wilson',  'HOSP_B', 'DOC001', 'Pediatrics',    'Pediatrician',           TRUE);

-- Assign roles
INSERT IGNORE INTO user_roles (user_id, role_id, tenant_id) VALUES
(1, (SELECT id FROM roles WHERE role_name = 'ADMIN'),  'HOSP_A'),
(2, (SELECT id FROM roles WHERE role_name = 'DOCTOR'), 'HOSP_A'),
(3, (SELECT id FROM roles WHERE role_name = 'NURSE'),  'HOSP_A'),
(4, (SELECT id FROM roles WHERE role_name = 'ADMIN'),  'HOSP_B'),
(5, (SELECT id FROM roles WHERE role_name = 'DOCTOR'), 'HOSP_B');

-- Doctors
INSERT IGNORE INTO doctors (doctor_id, tenant_id, user_id, specialization, qualifications, license_number, experience_years, consultation_fee, is_available) VALUES
('DOC001', 'HOSP_A', 2, 'Cardiology',  '["MD","DM Cardiology"]', 'LIC123456', 15, 500.00, TRUE),
('DOC002', 'HOSP_B', 5, 'Pediatrics',  '["MD Pediatrics"]',      'LIC234567', 10, 400.00, TRUE);

-- Departments
INSERT IGNORE INTO departments (department_code, tenant_id, department_name, description, location, is_active) VALUES
('CARDIO', 'HOSP_A', 'Cardiology', 'Heart Care Department',  '3rd Floor, East Wing', TRUE),
('PEDIA',  'HOSP_B', 'Pediatrics', 'Child Care Department',  '2nd Floor, West Wing', TRUE);

-- Sample patients (email is NULL not '' to avoid unique key issues)
INSERT IGNORE INTO patients (patient_id, tenant_id, first_name, last_name, date_of_birth, gender, blood_group, mobile, email, address_line1, city, state, postal_code, patient_status, registration_date) VALUES
('PAT001', 'HOSP_A', 'Michael',  'Brown',   '1985-05-15', 'MALE',   'O+', '9876543210', 'michael.brown@email.com',  '123 Main Street', 'Mumbai',    'Maharashtra', '400001', 'ACTIVE', CURDATE()),
('PAT002', 'HOSP_A', 'Jennifer', 'Davis',   '1990-08-22', 'FEMALE', 'A+', '9876543211', 'jennifer.davis@email.com', '456 Oak Avenue',  'Pune',      'Maharashtra', '411001', 'ACTIVE', CURDATE()),
('PAT003', 'HOSP_B', 'William',  'Johnson', '1978-03-10', 'MALE',   'B+', '9876543212', 'william.johnson@email.com','789 Pine Street', 'Bangalore', 'Karnataka',   '560001', 'ACTIVE', CURDATE());

-- Sample appointments
INSERT IGNORE INTO appointments (appointment_id, tenant_id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, status, reason_for_visit, urgency_level, patient_name, doctor_name) VALUES
('APT001', 'HOSP_A', 1, 1, CURDATE(), '10:00:00', 'CONSULTATION', 'SCHEDULED', 'Chest pain and shortness of breath', 'HIGH',   'Michael Brown',  'Dr. John Smith'),
('APT002', 'HOSP_A', 2, 1, CURDATE(), '11:30:00', 'FOLLOW_UP',    'CONFIRMED', 'Follow-up on asthma treatment',      'MEDIUM', 'Jennifer Davis', 'Dr. John Smith'),
('APT003', 'HOSP_B', 3, 2, CURDATE(), '14:00:00', 'CONSULTATION', 'SCHEDULED', 'Fever and cough for 3 days',         'MEDIUM', 'William Johnson','Dr. Robert Wilson');

-- Beds
INSERT IGNORE INTO beds (bed_number, tenant_id, ward_name, bed_type, floor, room_number, is_occupied, status, daily_rate) VALUES
('BED101', 'HOSP_A', 'Cardiology Ward', 'PRIVATE',      3, '301', FALSE, 'AVAILABLE', 5000.00),
('BED102', 'HOSP_A', 'Cardiology Ward', 'SEMI_PRIVATE', 3, '302', TRUE,  'OCCUPIED',  3000.00),
('BED201', 'HOSP_B', 'Pediatrics Ward', 'GENERAL',      2, '201', FALSE, 'AVAILABLE', 2000.00);

-- ============================================================
-- Views
-- ============================================================
CREATE OR REPLACE VIEW v_appointments_with_details AS
SELECT
    a.*,
    p.first_name  AS patient_first_name,
    p.last_name   AS patient_last_name,
    p.mobile      AS patient_mobile,
    d.specialization AS doctor_specialization
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors  d ON a.doctor_id  = d.id;

CREATE OR REPLACE VIEW v_bed_occupancy AS
SELECT
    tenant_id,
    bed_type,
    COUNT(*) AS total_beds,
    SUM(CASE WHEN is_occupied THEN 1 ELSE 0 END) AS occupied_beds,
    SUM(CASE WHEN NOT is_occupied AND status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_beds,
    ROUND(SUM(CASE WHEN is_occupied THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS occupancy_rate
FROM beds
GROUP BY tenant_id, bed_type;

-- ============================================================
-- DB User
-- ============================================================
CREATE USER IF NOT EXISTS 'mednex_user'@'localhost' IDENTIFIED BY 'Mednex@1234';
GRANT ALL PRIVILEGES ON mednex_db.* TO 'mednex_user'@'localhost';
FLUSH PRIVILEGES;

SET GLOBAL  time_zone = '+00:00';
SET SESSION time_zone = '+00:00';

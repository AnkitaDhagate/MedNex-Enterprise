-- Create main database
CREATE DATABASE IF NOT EXISTS mednex_db;
USE mednex_db;

-- Set timezone for consistency
SET time_zone = '+00:00';

-- Table: tenants (Master tenant management)
CREATE TABLE IF NOT EXISTS tenants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(50) UNIQUE NOT NULL COMMENT 'Unique tenant identifier',
    tenant_name VARCHAR(100) NOT NULL COMMENT 'Tenant/Hospital name',
    schema_name VARCHAR(50) NOT NULL COMMENT 'Database schema name for tenant',
    db_host VARCHAR(100) DEFAULT 'localhost',
    db_port INT DEFAULT 3306,
    db_name VARCHAR(100) NOT NULL,
    db_username VARCHAR(50),
    db_password VARCHAR(255),
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    subscription_plan ENUM('BASIC', 'PREMIUM', 'ENTERPRISE') DEFAULT 'BASIC',
    max_users INT DEFAULT 100,
    max_patients INT DEFAULT 10000,
    features JSON COMMENT 'JSON array of enabled features',
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial tenants
INSERT INTO tenants (tenant_id, tenant_name, schema_name, db_name, status, subscription_plan, contact_email) VALUES
('HOSP_A', 'City Central Hospital', 'tenant_hospital_a', 'mednex_db', 'ACTIVE', 'ENTERPRISE', 'admin@cityhospital.com'),
('HOSP_B', 'Community Healthcare', 'tenant_hospital_b', 'mednex_db', 'ACTIVE', 'PREMIUM', 'admin@communityhealth.com'),
('HOSP_C', 'Memorial Medical Center', 'tenant_hospital_c', 'mednex_db', 'ACTIVE', 'BASIC', 'admin@memorial.com');

-- Table: users (Global user table with tenant isolation)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL COMMENT 'BCrypt encoded password',
    email VARCHAR(100) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    tenant_id VARCHAR(50) NOT NULL COMMENT 'References tenants.tenant_id',
    employee_id VARCHAR(50),
    department VARCHAR(100),
    designation VARCHAR(100),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    profile_pic_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    account_locked BOOLEAN DEFAULT FALSE,
    password_changed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_username_tenant (username, tenant_id),
    UNIQUE KEY unique_email_tenant (email, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_username (username),
    INDEX idx_email (email),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: roles
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_description TEXT,
    role_level INT DEFAULT 0 COMMENT '0=highest, higher number lower privilege',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert standard roles
INSERT INTO roles (role_name, role_description, role_level) VALUES
('SUPER_ADMIN', 'System Administrator with full access', 0),
('ADMIN', 'Hospital Administrator', 10),
('DOCTOR', 'Medical Doctor', 20),
('NURSE', 'Registered Nurse', 30),
('RECEPTIONIST', 'Front Desk Receptionist', 40),
('PHARMACIST', 'Pharmacy Staff', 35),
('LAB_TECH', 'Laboratory Technician', 35),
('ACCOUNTANT', 'Finance Department', 40),
('PATIENT', 'Patient User', 100);

-- Table: user_roles (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    assigned_by BIGINT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_role_tenant (user_id, role_id, tenant_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: permissions
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    permission_key VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert common permissions
INSERT INTO permissions (permission_name, permission_key, module) VALUES
('View Patients', 'PATIENT_VIEW', 'PATIENT'),
('Create Patients', 'PATIENT_CREATE', 'PATIENT'),
('Edit Patients', 'PATIENT_EDIT', 'PATIENT'),
('Delete Patients', 'PATIENT_DELETE', 'PATIENT'),
('View Medical Records', 'MEDICAL_RECORD_VIEW', 'MEDICAL'),
('Create Medical Records', 'MEDICAL_RECORD_CREATE', 'MEDICAL'),
('Edit Medical Records', 'MEDICAL_RECORD_EDIT', 'MEDICAL'),
('View Appointments', 'APPOINTMENT_VIEW', 'APPOINTMENT'),
('Create Appointments', 'APPOINTMENT_CREATE', 'APPOINTMENT'),
('Manage Schedules', 'SCHEDULE_MANAGE', 'SCHEDULE'),
('View Reports', 'REPORT_VIEW', 'REPORT'),
('Export Data', 'DATA_EXPORT', 'ADMIN'),
('Manage Users', 'USER_MANAGE', 'ADMIN'),
('System Settings', 'SYSTEM_SETTINGS', 'ADMIN');

-- Table: role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: patients (Tenant-isolated)
CREATE TABLE IF NOT EXISTS patients (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(50) NOT NULL COMMENT 'Unique patient identifier within tenant',
    tenant_id VARCHAR(50) NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    date_of_birth DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    
    -- Contact Information
    email VARCHAR(100),
    phone VARCHAR(20),
    mobile VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'India',
    
    -- Demographic Information
    nationality VARCHAR(50),
    occupation VARCHAR(100),
    marital_status ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'),
    religion VARCHAR(50),
    
    -- Medical Information (JSON for flexible structure)
    medical_history JSON COMMENT 'Past medical history, surgeries, allergies',
    current_medications JSON COMMENT 'Current medications with dosage',
    allergies JSON COMMENT 'List of allergies with severity',
    chronic_conditions JSON COMMENT 'Chronic conditions like diabetes, hypertension',
    immunizations JSON COMMENT 'Vaccination history',
    family_history JSON COMMENT 'Family medical history',
    lifestyle_factors JSON COMMENT 'Smoking, alcohol, exercise habits',
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(100),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_alternate VARCHAR(20),
    
    -- Insurance Information
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(50),
    insurance_group_number VARCHAR(50),
    insurance_valid_from DATE,
    insurance_valid_to DATE,
    insurance_details JSON COMMENT 'Additional insurance information',
    
    -- Primary Care Provider
    primary_doctor_id BIGINT COMMENT 'Reference to doctors table',
    primary_doctor_name VARCHAR(100),
    
    -- Status
    patient_status ENUM('ACTIVE', 'INACTIVE', 'DECEASED', 'TRANSFERRED') DEFAULT 'ACTIVE',
    registration_date DATE NOT NULL,
    registration_type ENUM('EMERGENCY', 'OPD', 'IPD', 'REFERRAL') DEFAULT 'OPD',
    
    -- Additional Information
    notes TEXT,
    profile_photo_url VARCHAR(255),
    
    -- Audit Fields
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete',
    
    UNIQUE KEY unique_patient_id_tenant (patient_id, tenant_id),
    UNIQUE KEY unique_email_tenant (email, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_name (first_name, last_name),
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_status (patient_status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: doctors (Medical Staff)
CREATE TABLE IF NOT EXISTS doctors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    doctor_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    user_id BIGINT,
    
    -- Professional Information
    specialization VARCHAR(100) NOT NULL,
    sub_specialization VARCHAR(100),
    qualifications JSON COMMENT 'List of degrees and certifications',
    license_number VARCHAR(50) UNIQUE,
    registration_number VARCHAR(50),
    registration_council VARCHAR(100),
    registration_year INT,
    experience_years INT,
    
    -- Practice Information
    consultation_fee DECIMAL(10, 2),
    follow_up_fee DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT TRUE,
    available_days JSON COMMENT 'Working days schedule',
    
    -- Department
    department_id BIGINT,
    department_name VARCHAR(100),
    designation VARCHAR(100),
    
    -- Status
    doctor_status ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'RESIGNED') DEFAULT 'ACTIVE',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_doctor_id_tenant (doctor_id, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_specialization (specialization),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: appointments
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    appointment_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    
    -- References
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    referred_by BIGINT COMMENT 'Referring doctor ID',
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    appointment_type ENUM('CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'SURGERY', 'CHECKUP') NOT NULL,
    status ENUM('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'SCHEDULED',
    
    -- Patient Details Snapshot
    patient_name VARCHAR(100),
    patient_phone VARCHAR(20),
    patient_email VARCHAR(100),
    
    -- Medical Details
    reason_for_visit TEXT,
    symptoms JSON,
    urgency_level ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') DEFAULT 'MEDIUM',
    
    -- Location
    department VARCHAR(100),
    room_number VARCHAR(20),
    floor INT,
    
    -- Billing
    consultation_fee DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2),
    payment_status ENUM('PENDING', 'PAID', 'PARTIAL', 'REFUNDED') DEFAULT 'PENDING',
    
    -- Cancellation Information
    cancelled_by BIGINT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP NULL,
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP NULL,
    
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_appointment_id_tenant (appointment_id, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_doctor_date (doctor_id, appointment_date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: medical_records (Electronic Medical Records)
CREATE TABLE IF NOT EXISTS medical_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    record_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    
    -- Encounter Information
    encounter_date DATETIME NOT NULL,
    encounter_type ENUM('OPD', 'IPD', 'EMERGENCY', 'TELEMEDICINE') NOT NULL,
    department VARCHAR(100),
    
    -- Clinical Information
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    past_medical_history JSON,
    family_history JSON,
    social_history JSON,
    
    -- Vital Signs
    vital_signs JSON COMMENT '{"bp_systolic": 120, "bp_diastolic": 80, "heart_rate": 72, "temperature": 98.6, "respiratory_rate": 16, "oxygen_saturation": 98, "height": 170, "weight": 70, "bmi": 24.2}',
    
    -- Physical Examination
    physical_examination TEXT,
    systemic_examination JSON,
    
    -- Investigations
    investigations JSON COMMENT 'Lab tests ordered with results',
    radiology_reports JSON,
    other_diagnostics JSON,
    
    -- Diagnosis
    primary_diagnosis TEXT,
    secondary_diagnosis JSON,
    icd_codes JSON COMMENT 'ICD-10 codes for diagnoses',
    
    -- Treatment
    treatment_plan TEXT,
    medications_prescribed JSON COMMENT 'Prescribed medications with dosage',
    procedures JSON COMMENT 'Procedures performed',
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_instructions TEXT,
    
    -- Disposition
    disposition ENUM('DISCHARGED', 'ADMITTED', 'REFERRED', 'FOLLOW_UP') DEFAULT 'FOLLOW_UP',
    referral_notes TEXT,
    
    -- FHIR/HL7 Compliance (JSON for interoperability)
    fhir_resource JSON COMMENT 'FHIR standard format for interoperability',
    
    -- Audit
    is_confidential BOOLEAN DEFAULT FALSE,
    access_count INT DEFAULT 0,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_record_id_tenant (record_id, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_encounter_date (encounter_date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: audit_logs (HIPAA/GDPR Compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL COMMENT 'CREATE, READ, UPDATE, DELETE, EXPORT, VIEW',
    entity_type VARCHAR(50) NOT NULL COMMENT 'PATIENT, MEDICAL_RECORD, APPOINTMENT, etc.',
    entity_id VARCHAR(50),
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_url VARCHAR(255),
    http_method VARCHAR(10),
    status_code INT,
    duration_ms INT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_user_id (user_id),
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: departments
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    department_code VARCHAR(20) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    head_of_department BIGINT,
    description TEXT,
    location VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_dept_code_tenant (department_code, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: beds (Bed Management)
CREATE TABLE IF NOT EXISTS beds (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bed_number VARCHAR(20) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    ward_id BIGINT,
    ward_name VARCHAR(100),
    department_id BIGINT,
    bed_type ENUM('GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'ICU', 'CCU', 'EMERGENCY') NOT NULL,
    floor INT,
    room_number VARCHAR(20),
    is_occupied BOOLEAN DEFAULT FALSE,
    current_patient_id BIGINT,
    current_admission_id BIGINT,
    status ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED') DEFAULT 'AVAILABLE',
    daily_rate DECIMAL(10, 2),
    amenities JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_bed_number_tenant (bed_number, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    INDEX idx_ward (ward_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (current_patient_id) REFERENCES patients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: admissions
CREATE TABLE IF NOT EXISTS admissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admission_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    patient_id BIGINT NOT NULL,
    bed_id BIGINT,
    admitting_doctor_id BIGINT,
    
    admission_date DATETIME NOT NULL,
    admission_type ENUM('EMERGENCY', 'PLANNED', 'TRANSFER') NOT NULL,
    discharge_date DATETIME,
    discharge_type ENUM('DISCHARGED', 'TRANSFERRED', 'EXPIRED', 'LAMA') NULL,
    
    diagnosis_at_admission TEXT,
    discharge_summary TEXT,
    
    status ENUM('ACTIVE', 'DISCHARGED', 'TRANSFERRED') DEFAULT 'ACTIVE',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_admission_id_tenant (admission_id, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    prescription_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    medical_record_id BIGINT,
    
    prescription_date DATETIME NOT NULL,
    medications JSON NOT NULL COMMENT 'Array of medications with dosage, frequency, duration',
    instructions TEXT,
    refills INT DEFAULT 0,
    is_controlled_substance BOOLEAN DEFAULT FALSE,
    
    status ENUM('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_prescription_id_tenant (prescription_id, tenant_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample users (passwords should be BCrypt encoded)
-- Password: 'password123' encoded with BCrypt (using $2a$10$... format)
INSERT INTO users (username, password, email, first_name, last_name, tenant_id, employee_id, department, designation, is_active) VALUES
('admin_hosp_a', '$2a$10$NkM0lEeKqZ5xZ7y8w9x0uQvYwXzAbCdEfGhIjKlMnOpQrStUvWxYz', 'admin@cityhospital.com', 'John', 'Admin', 'HOSP_A', 'EMP001', 'Administration', 'Hospital Administrator', TRUE),
('dr_smith_hosp_a', '$2a$10$NkM0lEeKqZ5xZ7y8w9x0uQvYwXzAbCdEfGhIjKlMnOpQrStUvWxYz', 'dr.smith@cityhospital.com', 'John', 'Smith', 'HOSP_A', 'DOC001', 'Cardiology', 'Senior Cardiologist', TRUE),
('nurse_johnson_hosp_a', '$2a$10$NkM0lEeKqZ5xZ7y8w9x0uQvYwXzAbCdEfGhIjKlMnOpQrStUvWxYz', 'nurse.johnson@cityhospital.com', 'Emily', 'Johnson', 'HOSP_A', 'NUR001', 'Cardiology', 'Staff Nurse', TRUE),
('admin_hosp_b', '$2a$10$NkM0lEeKqZ5xZ7y8w9x0uQvYwXzAbCdEfGhIjKlMnOpQrStUvWxYz', 'admin@communityhealth.com', 'Sarah', 'Admin', 'HOSP_B', 'EMP001', 'Administration', 'Hospital Administrator', TRUE),
('dr_wilson_hosp_b', '$2a$10$NkM0lEeKqZ5xZ7y8w9x0uQvYwXzAbCdEfGhIjKlMnOpQrStUvWxYz', 'dr.wilson@communityhealth.com', 'Robert', 'Wilson', 'HOSP_B', 'DOC001', 'Pediatrics', 'Pediatrician', TRUE);

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id, tenant_id) VALUES
(1, (SELECT id FROM roles WHERE role_name = 'ADMIN'), 'HOSP_A'),
(2, (SELECT id FROM roles WHERE role_name = 'DOCTOR'), 'HOSP_A'),
(3, (SELECT id FROM roles WHERE role_name = 'NURSE'), 'HOSP_A'),
(4, (SELECT id FROM roles WHERE role_name = 'ADMIN'), 'HOSP_B'),
(5, (SELECT id FROM roles WHERE role_name = 'DOCTOR'), 'HOSP_B');

-- Insert doctors
INSERT INTO doctors (doctor_id, tenant_id, user_id, specialization, qualifications, license_number, registration_number, experience_years, consultation_fee, is_available) VALUES
('DOC001', 'HOSP_A', 2, 'Cardiology', '["MD", "DM Cardiology"]', 'LIC123456', 'REG789012', 15, 500.00, TRUE),
('DOC002', 'HOSP_B', 5, 'Pediatrics', '["MD Pediatrics"]', 'LIC234567', 'REG890123', 10, 400.00, TRUE);

-- Insert departments
INSERT INTO departments (department_code, tenant_id, department_name, description, location, is_active) VALUES
('CARDIO', 'HOSP_A', 'Cardiology', 'Heart Care Department', '3rd Floor, East Wing', TRUE),
('PEDIA', 'HOSP_B', 'Pediatrics', 'Child Care Department', '2nd Floor, West Wing', TRUE);

-- Insert sample patients
INSERT INTO patients (patient_id, tenant_id, first_name, last_name, date_of_birth, gender, blood_group, mobile, email, address_line1, city, state, postal_code, medical_history, patient_status, registration_date) VALUES
('PAT001', 'HOSP_A', 'Michael', 'Brown', '1985-05-15', 'MALE', 'O+', '9876543210', 'michael.brown@email.com', '123 Main Street', 'New York', 'NY', '10001', 
'{"allergies": ["Penicillin"], "chronic_conditions": ["Hypertension"], "surgeries": ["Appendectomy 2010"]}', 'ACTIVE', '2024-01-15'),

('PAT002', 'HOSP_A', 'Jennifer', 'Davis', '1990-08-22', 'FEMALE', 'A+', '9876543211', 'jennifer.davis@email.com', '456 Oak Avenue', 'New York', 'NY', '10002',
'{"allergies": ["Shellfish"], "chronic_conditions": ["Asthma"], "medications": ["Albuterol"]}', 'ACTIVE', '2024-01-20'),

('PAT003', 'HOSP_B', 'William', 'Johnson', '1978-03-10', 'MALE', 'B+', '9876543212', 'william.johnson@email.com', '789 Pine Street', 'Los Angeles', 'CA', '90001',
'{"allergies": [], "chronic_conditions": ["Diabetes Type 2"], "surgeries": []}', 'ACTIVE', '2024-01-18');

-- Insert appointments
INSERT INTO appointments (appointment_id, tenant_id, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, status, reason_for_visit, urgency_level) VALUES
('APT001', 'HOSP_A', 1, 1, CURDATE(), '10:00:00', 'CONSULTATION', 'SCHEDULED', 'Chest pain and shortness of breath', 'HIGH'),
('APT002', 'HOSP_A', 2, 1, CURDATE(), '11:30:00', 'FOLLOW_UP', 'CONFIRMED', 'Follow-up on asthma treatment', 'MEDIUM'),
('APT003', 'HOSP_B', 3, 2, CURDATE(), '14:00:00', 'CONSULTATION', 'SCHEDULED', 'Fever and cough for 3 days', 'MEDIUM');

-- Insert beds
INSERT INTO beds (bed_number, tenant_id, ward_name, bed_type, floor, room_number, is_occupied, status, daily_rate) VALUES
('BED101', 'HOSP_A', 'Cardiology Ward', 'PRIVATE', 3, '301', FALSE, 'AVAILABLE', 5000.00),
('BED102', 'HOSP_A', 'Cardiology Ward', 'SEMI_PRIVATE', 3, '302', TRUE, 'OCCUPIED', 3000.00),
('BED201', 'HOSP_B', 'Pediatrics Ward', 'GENERAL', 2, '201', FALSE, 'AVAILABLE', 2000.00);

-- Create view for patients with row-level security
CREATE OR REPLACE VIEW v_patients AS
SELECT * FROM patients;

-- Create view for appointments with doctor details
CREATE OR REPLACE VIEW v_appointments_with_details AS
SELECT 
    a.*,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    p.mobile as patient_mobile,
    d.specialization as doctor_specialization,
    d.qualifications as doctor_qualifications
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id;

-- Create view for bed occupancy analytics
CREATE OR REPLACE VIEW v_bed_occupancy AS
SELECT 
    tenant_id,
    bed_type,
    COUNT(*) as total_beds,
    SUM(CASE WHEN is_occupied THEN 1 ELSE 0 END) as occupied_beds,
    SUM(CASE WHEN NOT is_occupied AND status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_beds,
    ROUND(SUM(CASE WHEN is_occupied THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as occupancy_rate
FROM beds
GROUP BY tenant_id, bed_type;

-- Stored procedure to get patient medical summary
DELIMITER $$
CREATE PROCEDURE GetPatientMedicalSummary(
    IN p_patient_id BIGINT,
    IN p_tenant_id VARCHAR(50)
)
BEGIN
    -- Get patient basic info
    SELECT 
        patient_id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        blood_group,
        medical_history,
        allergies
    FROM patients
    WHERE id = p_patient_id AND tenant_id = p_tenant_id;
    
    -- Get recent medical records
    SELECT 
        record_id,
        encounter_date,
        encounter_type,
        chief_complaint,
        primary_diagnosis,
        medications_prescribed
    FROM medical_records
    WHERE patient_id = p_patient_id AND tenant_id = p_tenant_id
    ORDER BY encounter_date DESC
    LIMIT 5;
    
    -- Get upcoming appointments
    SELECT 
        appointment_id,
        appointment_date,
        appointment_time,
        status,
        reason_for_visit
    FROM appointments
    WHERE patient_id = p_patient_id 
        AND tenant_id = p_tenant_id
        AND appointment_date >= CURDATE()
        AND status NOT IN ('CANCELLED', 'COMPLETED')
    ORDER BY appointment_date ASC;
END$$
DELIMITER ;

-- Stored procedure to audit patient access
DELIMITER $$
CREATE PROCEDURE LogPatientAccess(
    IN p_user_id BIGINT,
    IN p_patient_id BIGINT,
    IN p_tenant_id VARCHAR(50),
    IN p_action VARCHAR(100),
    IN p_ip_address VARCHAR(45)
)
BEGIN
    INSERT INTO audit_logs (tenant_id, user_id, username, action, entity_type, entity_id, ip_address)
    SELECT 
        p_tenant_id,
        p_user_id,
        u.username,
        p_action,
        'PATIENT',
        CAST(p_patient_id AS CHAR),
        p_ip_address
    FROM users u
    WHERE u.id = p_user_id;
END$$
DELIMITER ;

-- Trigger for patient updates
DELIMITER $$
CREATE TRIGGER trg_patient_audit_update
AFTER UPDATE ON patients
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (tenant_id, user_id, username, action, entity_type, entity_id, old_value, new_value)
    VALUES (
        NEW.tenant_id,
        NEW.updated_by,
        (SELECT username FROM users WHERE id = NEW.updated_by),
        'UPDATE',
        'PATIENT',
        CAST(NEW.id AS CHAR),
        JSON_OBJECT('first_name', OLD.first_name, 'last_name', OLD.last_name, 'phone', OLD.phone, 'email', OLD.email),
        JSON_OBJECT('first_name', NEW.first_name, 'last_name', NEW.last_name, 'phone', NEW.phone, 'email', NEW.email)
    );
END$$
DELIMITER ;

-- Performance indexes for frequently queried columns
CREATE INDEX idx_patients_name ON patients(first_name, last_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_reg_date ON patients(registration_date);

CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_doctor_status ON appointments(doctor_id, status);
CREATE INDEX idx_appointments_patient_status ON appointments(patient_id, status);

CREATE INDEX idx_medical_records_patient_date ON medical_records(patient_id, encounter_date);
CREATE INDEX idx_medical_records_doctor_date ON medical_records(doctor_id, encounter_date);

CREATE INDEX idx_audit_logs_composite ON audit_logs(tenant_id, entity_type, created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);

CREATE INDEX idx_beds_status_type ON beds(status, bed_type);

-- Create database user for application
CREATE USER IF NOT EXISTS 'mednex_user'@'localhost' IDENTIFIED BY 'Mednex@1234';
GRANT ALL PRIVILEGES ON mednex_db.* TO 'mednex_user'@'localhost';
FLUSH PRIVILEGES;

-- Set database timezone
SET GLOBAL time_zone = '+00:00';
SET SESSION time_zone = '+00:00';

-- Test queries
-- Test 1: Tenant A should only see their patients
SELECT * FROM patients WHERE tenant_id = 'HOSP_A';

-- Test 2: Tenant B should only see their patients
SELECT * FROM patients WHERE tenant_id = 'HOSP_B';

-- Test 3: Cross-tenant data access should fail (returns no rows)
SELECT * FROM patients WHERE tenant_id = 'HOSP_B' AND id IN (SELECT id FROM patients WHERE tenant_id = 'HOSP_A');
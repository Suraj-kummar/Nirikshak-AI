-- Nirikshak AI — PostgreSQL Schema
-- Privacy-first proctoring system
-- All violation logs are IMMUTABLE once written (no DELETE/UPDATE)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────
-- Table: students
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'STUDENT',
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- Table: exam_sessions
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_sessions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id        UUID         NOT NULL REFERENCES students(id),
    exam_id           VARCHAR(255) NOT NULL,
    start_time        TIMESTAMP    NOT NULL DEFAULT NOW(),
    end_time          TIMESTAMP,
    status            VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | COMPLETED | TERMINATED
    total_violations  INT          NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────────────
-- Table: violations  (IMMUTABLE — no DELETE/UPDATE policies)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS violations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id  UUID         NOT NULL REFERENCES exam_sessions(id),
    alert_type  VARCHAR(50)  NOT NULL,   -- GAZE_AWAY | MULTIPLE_FACES | NO_FACE
    severity    VARCHAR(20)  NOT NULL,   -- LOW | MEDIUM | HIGH
    confidence  FLOAT        NOT NULL DEFAULT 0.0,
    description TEXT,
    timestamp   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_student  ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_violations_session ON violations(session_id);
CREATE INDEX IF NOT EXISTS idx_violations_ts      ON violations(timestamp);

-- ─────────────────────────────────────────────────────────
-- Revoke UPDATE / DELETE on violations to enforce immutability
-- (Run as superuser after initial setup)
-- ─────────────────────────────────────────────────────────
-- REVOKE UPDATE, DELETE ON violations FROM nirikshak;

-- ─────────────────────────────────────────────────────────
-- Seed: demo student (password = "demo1234" bcrypt hash)
-- ─────────────────────────────────────────────────────────
INSERT INTO students (name, email, password_hash, role)
VALUES ('Demo Student', 'demo@nirikshak.ai', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.', 'STUDENT')
ON CONFLICT DO NOTHING;

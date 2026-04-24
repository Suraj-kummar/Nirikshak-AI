-- ══════════════════════════════════════════════════════════════
-- V1__init.sql  — Flyway migration #1: baseline schema
-- Nirikshak AI · PostgreSQL 15
-- ══════════════════════════════════════════════════════════════

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────
-- students
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'STUDENT',
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- exam_sessions
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_sessions (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id       UUID        NOT NULL REFERENCES students(id),
    exam_id          VARCHAR(255) NOT NULL,
    start_time       TIMESTAMP   NOT NULL DEFAULT NOW(),
    end_time         TIMESTAMP,
    status           VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    total_violations INT         NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────────────
-- violations  — IMMUTABLE once written
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS violations (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id  UUID        NOT NULL REFERENCES exam_sessions(id),
    alert_type  VARCHAR(50) NOT NULL,
    severity    VARCHAR(20) NOT NULL,
    confidence  FLOAT       NOT NULL DEFAULT 0.0,
    description TEXT,
    timestamp   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- questions  — used by Question Bank API
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id      VARCHAR(255) NOT NULL,
    content      TEXT        NOT NULL,
    option_a     TEXT        NOT NULL,
    option_b     TEXT        NOT NULL,
    option_c     TEXT        NOT NULL,
    option_d     TEXT        NOT NULL,
    correct_ans  CHAR(1)     NOT NULL,  -- A | B | C | D
    difficulty   VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    marks        INT         NOT NULL DEFAULT 1,
    created_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_student    ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_violations_session  ON violations(session_id);
CREATE INDEX IF NOT EXISTS idx_violations_ts       ON violations(timestamp);
CREATE INDEX IF NOT EXISTS idx_questions_exam      ON questions(exam_id);

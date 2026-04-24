-- ══════════════════════════════════════════════════════════════
-- V2__seed.sql  — Flyway migration #2: seed / demo data
-- ══════════════════════════════════════════════════════════════

-- Demo student  (password = "demo1234", BCrypt hashed)
INSERT INTO students (name, email, password_hash, role)
VALUES (
    'Demo Student',
    'demo@nirikshak.ai',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.',
    'STUDENT'
) ON CONFLICT (email) DO NOTHING;

-- Admin user   (password = "admin2024", BCrypt hashed)
INSERT INTO students (name, email, password_hash, role)
VALUES (
    'Nirikshak Admin',
    'admin@nirikshak.ai',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'ADMIN'
) ON CONFLICT (email) DO NOTHING;

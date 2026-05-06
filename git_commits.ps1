# ══════════════════════════════════════════════════════════════
# Nirikshak AI — 24 Commit Push Script
# ══════════════════════════════════════════════════════════════

git init
git remote remove origin 2>$null
git remote add origin https://github.com/Suraj-kummar/Nirikshak-AI.git
git branch -M main

# ── Commit 1: Root configs & Docker orchestration ─────────────
git add .gitignore Makefile .env.example docker-compose.yml docker-compose.prod.yml nginx-prod.conf
git commit -m "chore: initial project setup and docker orchestration"

# ── Commit 2: Database schema ─────────────────────────────────
git add schema.sql
git commit -m "feat(db): add postgresql schema, indexes and demo seed data"

# ── Commit 3: Backend project config ──────────────────────────
git add backend/pom.xml backend/Dockerfile
git commit -m "chore(backend): spring boot 3.x project setup and maven config"

# ── Commit 4: Backend resources ───────────────────────────────
git add backend/src/main/resources/
git commit -m "chore(backend): add application properties and flyway migrations"

# ── Commit 5: Backend models ──────────────────────────────────
git add backend/src/main/java/com/nirikshak/model/
git commit -m "feat(backend): add jpa entity models (student, session, violation, question)"

# ── Commit 6: Backend DTOs ────────────────────────────────────
git add backend/src/main/java/com/nirikshak/dto/
git commit -m "feat(backend): add data transfer objects and request/response schemas"

# ── Commit 7: Backend repositories ───────────────────────────
git add backend/src/main/java/com/nirikshak/repository/
git commit -m "feat(backend): add spring data jpa repositories"

# ── Commit 8: Backend configs ─────────────────────────────────
git add backend/src/main/java/com/nirikshak/config/
git commit -m "feat(backend): add application config (cors, websocket, rate limit)"

# ── Commit 9: Backend security ────────────────────────────────
git add backend/src/main/java/com/nirikshak/security/
git commit -m "feat(backend): implement stateless jwt authentication and security filters"

# ── Commit 10: Backend services ───────────────────────────────
git add backend/src/main/java/com/nirikshak/service/
git commit -m "feat(backend): implement core business logic and ai vision integration"

# ── Commit 11: Backend controllers ────────────────────────────
git add backend/src/main/java/com/nirikshak/controller/
git commit -m "feat(backend): add rest api controllers (auth, exam, violations)"

# ── Commit 12: Backend websocket ──────────────────────────────
git add backend/src/main/java/com/nirikshak/NirikshakApplication.java
git commit -m "feat(backend): add main application entry point and websocket handler"

# ── Commit 13: Backend tests ──────────────────────────────────
git add backend/src/test/
git commit -m "test(backend): add junit5 unit tests for controllers and services"

# ── Commit 14: Frontend setup ─────────────────────────────────
git add frontend/package.json frontend/package-lock.json frontend/Dockerfile frontend/.eslintrc.json frontend/.vercelignore
git commit -m "chore(frontend): react 18 project setup and vercel deployment config"

# ── Commit 15: Frontend static assets ─────────────────────────
git add frontend/public/ frontend/src/index.js frontend/src/index.css
git commit -m "chore(frontend): add static assets, favicon and global styles"

# ── Commit 16: Frontend theme & API client ────────────────────
git add frontend/src/theme.js frontend/src/api.js
git commit -m "feat(frontend): add material design 3 dark theme and axios api client"

# ── Commit 17: Frontend routing ───────────────────────────────
git add frontend/src/App.jsx
git commit -m "feat(frontend): add react router with protected exam and auth routes"

# ── Commit 18: Frontend utilities ─────────────────────────────
git add frontend/src/utils/
git commit -m "feat(frontend): add proctor engine and computer vision utilities"

# ── Commit 19: Frontend components ────────────────────────────
git add frontend/src/components/
git commit -m "feat(frontend): implement reusable ui components (webcam, alerts, timer)"

# ── Commit 20: Frontend pages ─────────────────────────────────
git add frontend/src/pages/
git commit -m "feat(frontend): implement login, dashboard and exam room pages"

# ── Commit 21: Frontend nginx config ─────────────────────────
git add frontend/nginx.conf frontend/vercel.json
git commit -m "chore(frontend): add nginx reverse proxy and vercel spa routing config"

# ── Commit 22: Python AI service ─────────────────────────────
git add python-ai/
git commit -m "feat(ai): add python fastapi vision service with mediapipe gaze detection"

# ── Commit 23: Deployment configs ────────────────────────────
git add render.yaml DEPLOY.md
git commit -m "chore(deploy): add render blueprint and vercel deployment guide"

# ── Commit 24: Docs and final cleanup ────────────────────────
git add README.md nirikshak-api-collection.postman_collection.json
git add .
git commit -m "docs: update readme with installation guide, api reference and made by surajj"

# ── Push all 24 commits ───────────────────────────────────────
Write-Host ""
Write-Host "Pushing 24 commits to GitHub..." -ForegroundColor Cyan
git push -u origin main --force
Write-Host ""
Write-Host "Done! All 24 commits pushed to https://github.com/Suraj-kummar/Nirikshak-AI" -ForegroundColor Green

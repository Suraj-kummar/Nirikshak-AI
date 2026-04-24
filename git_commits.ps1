git init
git remote add origin https://github.com/Suraj-kummar/Nirikshak-AI.git
git branch -M main

# Part 1: Root configurations
git add .gitignore Makefile .env.example docker-compose.yml docker-compose.prod.yml nginx-prod.conf
git commit -m "chore: initial setup and docker orchestration"

# Part 2: Database schema
git add schema.sql
git commit -m "feat(db): add postgreSQL schema and seed data"

# Part 3: Backend - Project config
git add backend/pom.xml backend/Dockerfile backend/src/main/resources/ backend/.mvn backend/mvnw backend/mvnw.cmd
git commit -m "chore(backend): spring boot project setup and dependencies"

# Part 4: Backend - Models & DTOs
git add backend/src/main/java/com/nirikshak/model/ backend/src/main/java/com/nirikshak/dto/
git commit -m "feat(backend): add jpa models and data transfer objects"

# Part 5: Backend - Repository & Config
git add backend/src/main/java/com/nirikshak/repository/ backend/src/main/java/com/nirikshak/config/
git commit -m "feat(backend): add data access layer and application configs"

# Part 6: Backend - Security
git add backend/src/main/java/com/nirikshak/security/
git commit -m "feat(backend): implement stateless jwt security filters"

# Part 7: Backend - Services
git add backend/src/main/java/com/nirikshak/service/
git commit -m "feat(backend): implement core business logic and services"

# Part 8: Backend - Controllers & Tests
git add backend/src/main/java/com/nirikshak/controller/ backend/src/test/ backend/src/main/java/com/nirikshak/NirikshakApplication.java
git commit -m "feat(backend): add rest api, websocket controllers, and unit tests"

# Part 9: Frontend - Configs & Public
git add frontend/package.json frontend/package-lock.json frontend/Dockerfile frontend/public/ frontend/src/index.js frontend/src/index.css
git commit -m "chore(frontend): react project setup and static assets"

# Part 10: Frontend - Foundation
git add frontend/src/App.jsx frontend/src/theme.js frontend/src/api.js frontend/src/utils/
git commit -m "feat(frontend): add material design 3 theme, routing, and api client"

# Part 11: Frontend - Components & Pages
git add frontend/src/components/ frontend/src/pages/
git commit -m "feat(frontend): implement proctoring ui components and pages"

# Part 12: Python AI Service & Documentation
git add python-ai/ README.md nirikshak-api-collection.postman_collection.json .vscode/
git commit -m "feat(ai): integrate python computer vision service and documentation"

# Final catch-all just in case any files were missed in the exact paths above
git add .
git commit -m "chore: final adjustments and cleanup"

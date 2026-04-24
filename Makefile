# ══════════════════════════════════════════════════════════════
# Nirikshak AI — Makefile
# Convenience commands for development and production
# Usage: make <target>
# ══════════════════════════════════════════════════════════════

.PHONY: help dev prod test test-java test-python clean logs

help:
	@echo ""
	@echo "  Nirikshak AI — Available Commands"
	@echo "  ═══════════════════════════════════"
	@echo "  make dev          Start all services (development)"
	@echo "  make prod         Start all services (production, requires .env)"
	@echo "  make test         Run ALL tests (Java + Python)"
	@echo "  make test-java    Run Spring Boot unit tests"
	@echo "  make test-python  Run Python pytest suite"
	@echo "  make logs         Tail logs from all containers"
	@echo "  make clean        Stop and remove all containers + volumes"
	@echo ""

# ── Development ───────────────────────────────────────────────────────────────
dev:
	docker-compose up --build

dev-detach:
	docker-compose up --build -d

# ── Production ────────────────────────────────────────────────────────────────
prod:
	@test -f .env || (echo "ERROR: .env not found. Copy .env.example to .env and fill in all values." && exit 1)
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# ── Tests ─────────────────────────────────────────────────────────────────────
test: test-java test-python

test-java:
	@echo "Running Spring Boot tests..."
	cd backend && mvn test -B

test-python:
	@echo "Running Python tests..."
	cd python-ai && pip install -r requirements.txt -r requirements-test.txt -q && pytest

# ── Utilities ─────────────────────────────────────────────────────────────────
logs:
	docker-compose logs -f --tail=100

clean:
	docker-compose down -v --remove-orphans
	@echo "All containers and volumes removed."

schema:
	@echo "Applying schema to local PostgreSQL..."
	psql -h localhost -U nirikshak -d nirikshak -f schema.sql

jwt-secret:
	@echo "Generating secure JWT secret (copy to .env):"
	@openssl rand -base64 48

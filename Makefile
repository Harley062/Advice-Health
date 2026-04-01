.PHONY: up down build logs shell-backend shell-db migrate test-backend test-frontend lint install

# ── Docker ────────────────────────────────────────────────────────────────────

up:
	docker-compose up

up-build:
	docker-compose up --build

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f

# ── Shells ────────────────────────────────────────────────────────────────────

shell-backend:
	docker-compose exec backend bash

shell-db:
	docker-compose exec db psql -U postgres todoapp

# ── Django ────────────────────────────────────────────────────────────────────

migrate:
	docker-compose exec backend python manage.py migrate

makemigrations:
	docker-compose exec backend python manage.py makemigrations

createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

# ── Tests ─────────────────────────────────────────────────────────────────────

test-backend:
	cd backend && pytest --tb=short -v

test-backend-cov:
	cd backend && pytest --tb=short -v --cov=apps --cov-report=term-missing

# ── Frontend ──────────────────────────────────────────────────────────────────

install:
	cd frontend && npm ci

lint:
	cd frontend && npm run lint

# ── Help ──────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "Available commands:"
	@echo "  make up               Start all services"
	@echo "  make up-build         Start with rebuild"
	@echo "  make down             Stop all services"
	@echo "  make logs             Follow logs"
	@echo "  make shell-backend    Open shell in backend container"
	@echo "  make shell-db         Open psql in db container"
	@echo "  make migrate          Run Django migrations"
	@echo "  make makemigrations   Create new migrations"
	@echo "  make test-backend     Run pytest"
	@echo "  make test-backend-cov Run pytest with coverage"
	@echo "  make lint             Run ESLint on frontend"
	@echo ""

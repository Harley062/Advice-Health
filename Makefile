.PHONY: up down build logs shell-backend shell-db migrate test-backend test-frontend lint install up-prod down-prod clean help

# ── Docker (dev) ──────────────────────────────────────────────────────────────

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

# ── Docker (prod) ─────────────────────────────────────────────────────────────

up-prod:
	docker-compose -f docker-compose.prod.yml up -d --build

down-prod:
	docker-compose -f docker-compose.prod.yml down

logs-prod:
	docker-compose -f docker-compose.prod.yml logs -f

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
	cd backend && pytest --tb=short -v --cov=apps --cov-report=term-missing --cov-fail-under=70

# ── Frontend ──────────────────────────────────────────────────────────────────

install:
	cd frontend && npm install

lint:
	cd frontend && npm run lint

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

# ── Help ──────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "Available commands:"
	@echo "  make up               Start dev services"
	@echo "  make up-build         Start dev with rebuild"
	@echo "  make down             Stop dev services"
	@echo "  make up-prod          Start production services"
	@echo "  make down-prod        Stop production services"
	@echo "  make logs             Follow dev logs"
	@echo "  make logs-prod        Follow production logs"
	@echo "  make shell-backend    Open shell in backend container"
	@echo "  make shell-db         Open psql in db container"
	@echo "  make migrate          Run Django migrations"
	@echo "  make makemigrations   Create new migrations"
	@echo "  make createsuperuser  Create Django admin superuser"
	@echo "  make test-backend     Run pytest"
	@echo "  make test-backend-cov Run pytest with coverage"
	@echo "  make lint             Run ESLint on frontend"
	@echo "  make clean            Remove __pycache__ and .pyc files"
	@echo ""

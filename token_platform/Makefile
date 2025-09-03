SHELL := /bin/sh
PROJECT := token_platform
COMPOSE := docker compose
COMPOSE_PROD := $(COMPOSE) -f docker-compose.prod.yml

.DEFAULT_GOAL := help

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-24s\033[0m %s\n", $$1, $$2}'

up: ## Start all services in background
	$(COMPOSE) up -d

down: ## Stop and remove containers
	$(COMPOSE) down

build: ## Build images
	$(COMPOSE) build

logs: ## Tail backend logs
	$(COMPOSE) logs -f backend

migrate: ## Run Django migrations
	$(COMPOSE) run --rm backend python manage.py migrate

seed: ## Seed gifts and coin packages
	$(COMPOSE) run --rm backend python manage.py seed_gifts_and_packages

createsuperuser: ## Create Django superuser
	$(COMPOSE) run --rm backend python manage.py createsuperuser

test: ## Run backend tests
	$(COMPOSE) run --rm backend pytest

test-cov: ## Run tests with coverage
	$(COMPOSE) run --rm backend pytest --cov=apps --cov-report=term-missing

sh-backend: ## Open shell in backend container
	$(COMPOSE) exec backend /bin/bash -lc 'bash || sh'

# Linux/macOS backup using redirection
# Windows PowerShell users: see README for the Set-Content alternative.
db-backup: ## Backup Postgres to backups/<timestamp>.sql
	@mkdir -p backups
	@TS=$$(date +%Y%m%d_%H%M%S); \
	$(COMPOSE) exec -T db pg_dump -U $$POSTGRES_USER -d $$POSTGRES_DB > backups/backup_$$TS.sql && echo "Backup saved to backups/backup_$$TS.sql"

# Usage: make db-restore FILE=backups/backup_20250101_120000.sql
db-restore: ## Restore Postgres from backups/<file>.sql
	@test -n "$(FILE)" || (echo "Usage: make db-restore FILE=backups/backup_xxx.sql" && exit 1)
	@type $(FILE) >/dev/null 2>&1 || (echo "File not found: $(FILE)" && exit 1)
	@$(COMPOSE) exec -T db psql -U $$POSTGRES_USER -d $$POSTGRES_DB < $(FILE)

prod-up: ## Start production stack using docker-compose.prod.yml
	$(COMPOSE_PROD) up -d --build

prod-down: ## Stop production stack
	$(COMPOSE_PROD) down

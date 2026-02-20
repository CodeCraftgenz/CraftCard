# ============================================================
# CraftCard - Makefile
# ============================================================

.PHONY: help install dev dev-backend dev-frontend up-db down-db db-migrate db-seed db-studio build test test-backend test-frontend lint format typecheck clean

# Colors
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

help: ## Show available commands
	@echo "$(CYAN)CraftCard - Available Commands$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'

# ============================================================
# Installation
# ============================================================

install: ## Install all dependencies
	@echo "$(CYAN)Installing dependencies...$(RESET)"
	npm install
	cd backend && npm install
	cd frontend && npm install
	@echo "$(GREEN)Done!$(RESET)"

# ============================================================
# Development
# ============================================================

dev: up-db ## Start all services (DB + backend + frontend)
	@echo "$(CYAN)Starting development servers...$(RESET)"
	@npx concurrently -n "api,web" -c "blue,magenta" "cd backend && npm run start:dev" "cd frontend && npm run dev"

dev-backend: up-db ## Start backend only
	@echo "$(CYAN)Starting backend...$(RESET)"
	cd backend && npm run start:dev

dev-frontend: ## Start frontend only
	@echo "$(CYAN)Starting frontend...$(RESET)"
	cd frontend && npm run dev

# ============================================================
# Docker / Database
# ============================================================

up-db: ## Start MySQL container
	@echo "$(CYAN)Starting MySQL...$(RESET)"
	docker compose -f infra/docker-compose.yml up -d db
	@echo "$(GREEN)MySQL is running$(RESET)"

down-db: ## Stop MySQL container
	@echo "$(YELLOW)Stopping MySQL...$(RESET)"
	docker compose -f infra/docker-compose.yml down

db-migrate: ## Run Prisma migrations
	@echo "$(CYAN)Running migrations...$(RESET)"
	cd backend && npx prisma migrate dev

db-migrate-deploy: ## Deploy Prisma migrations (production)
	cd backend && npx prisma migrate deploy

db-seed: ## Seed the database
	@echo "$(CYAN)Seeding database...$(RESET)"
	cd backend && npx prisma db seed

db-studio: ## Open Prisma Studio
	cd backend && npx prisma studio

db-generate: ## Generate Prisma client
	cd backend && npx prisma generate

# ============================================================
# Build & Test
# ============================================================

build: ## Build for production
	@echo "$(CYAN)Building backend...$(RESET)"
	cd backend && npm run build
	@echo "$(CYAN)Building frontend...$(RESET)"
	cd frontend && npm run build
	@echo "$(GREEN)Build complete!$(RESET)"

test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	@echo "$(CYAN)Running backend tests...$(RESET)"
	cd backend && npm run test

test-frontend: ## Run frontend tests
	@echo "$(CYAN)Running frontend tests...$(RESET)"
	cd frontend && npm run test

test-e2e: ## Run E2E tests (Playwright)
	@echo "$(CYAN)Running E2E tests...$(RESET)"
	cd frontend && npx playwright test

test-coverage: ## Run tests with coverage
	cd backend && npm run test:cov
	cd frontend && npm run test -- --coverage

# ============================================================
# Code Quality
# ============================================================

lint: ## Lint all code
	@echo "$(CYAN)Linting...$(RESET)"
	cd backend && npm run lint
	cd frontend && npm run lint

format: ## Format all code
	cd backend && npx prettier --write "src/**/*.ts"
	cd frontend && npx prettier --write "src/**/*.{ts,tsx}"

typecheck: ## TypeScript type checking
	cd backend && npx tsc --noEmit
	cd frontend && npx tsc --noEmit

# ============================================================
# Utilities
# ============================================================

clean: ## Remove build artifacts and node_modules
	@echo "$(YELLOW)Cleaning...$(RESET)"
	rm -rf node_modules backend/node_modules frontend/node_modules
	rm -rf backend/dist frontend/dist
	@echo "$(GREEN)Clean!$(RESET)"

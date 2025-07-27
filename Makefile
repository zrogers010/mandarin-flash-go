.PHONY: help setup dev build test clean docker-build docker-run frontend-install backend-install

# Default target
help:
	@echo "Available commands:"
	@echo "  setup         - Install dependencies and setup environment"
	@echo "  dev           - Start development environment"
	@echo "  build         - Build production artifacts"
	@echo "  test          - Run tests"
	@echo "  clean         - Clean build artifacts"
	@echo "  docker-build  - Build Docker images"
	@echo "  docker-run    - Run with Docker Compose"
	@echo "  frontend-install - Install frontend dependencies"
	@echo "  backend-install  - Install backend dependencies"

# Setup the entire project
setup: frontend-install backend-install
	@echo "✅ Project setup complete!"

# Install frontend dependencies
frontend-install:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Frontend dependencies installed"

# Install backend dependencies
backend-install:
	@echo "📦 Installing backend dependencies..."
	cd backend && go mod download
	@echo "✅ Backend dependencies installed"

# Start development environment
dev:
	@echo "🚀 Starting development environment..."
	docker-compose up -d postgres redis
	@echo "⏳ Waiting for services to be ready..."
	sleep 5
	@echo "🔄 Starting backend..."
	cd backend && air &
	@echo "🔄 Starting frontend..."
	cd frontend && npm run dev &
	@echo "✅ Development environment started!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:8080"

# Build production artifacts
build: frontend-build backend-build
	@echo "✅ Production build complete!"

# Build frontend
frontend-build:
	@echo "🔨 Building frontend..."
	cd frontend && npm run build
	@echo "✅ Frontend built"

# Build backend
backend-build:
	@echo "🔨 Building backend..."
	cd backend && go build -o bin/server cmd/server/main.go
	@echo "✅ Backend built"

# Run tests
test: frontend-test backend-test
	@echo "✅ All tests passed!"

# Test frontend
frontend-test:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm run test

# Test backend
backend-test:
	@echo "🧪 Running backend tests..."
	cd backend && go test ./...

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf backend/bin
	rm -rf node_modules
	@echo "✅ Clean complete"

# Build Docker images
docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build
	@echo "✅ Docker images built"

# Run with Docker Compose
docker-run:
	@echo "🐳 Starting with Docker Compose..."
	docker-compose up -d
	@echo "✅ Application running with Docker!"

# Stop Docker services
docker-stop:
	@echo "🛑 Stopping Docker services..."
	docker-compose down
	@echo "✅ Docker services stopped"

# Database migrations
migrate-up:
	@echo "🗄️ Running database migrations..."
	cd backend && migrate -path db/migrations -database "postgres://postgres:password@localhost:5432/chinese_learning?sslmode=disable" up

migrate-down:
	@echo "🗄️ Rolling back database migrations..."
	cd backend && migrate -path db/migrations -database "postgres://postgres:password@localhost:5432/chinese_learning?sslmode=disable" down

# Seed database with HSK data
seed-db:
	@echo "🌱 Seeding database with HSK vocabulary..."
	cd backend && go run cmd/seed/main.go

# Format code
format:
	@echo "🎨 Formatting code..."
	cd frontend && npm run format
	cd backend && go fmt ./...
	@echo "✅ Code formatted"

# Lint code
lint:
	@echo "🔍 Linting code..."
	cd frontend && npm run lint
	cd backend && golangci-lint run
	@echo "✅ Linting complete" 
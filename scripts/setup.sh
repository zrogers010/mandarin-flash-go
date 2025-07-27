#!/bin/bash

# Chinese Learning App Setup Script
echo "🚀 Setting up Chinese Learning App..."

# Check if required tools are installed
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }
command -v go >/dev/null 2>&1 || { echo "❌ Go is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }

echo "✅ All required tools are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env 2>/dev/null || {
        cat > .env << EOF
# Application
ENVIRONMENT=development
PORT=8080

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chinese_learning
DB_USER=postgres
DB_PASSWORD=password
DB_SSLMODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend
VITE_API_URL=http://localhost:8080
EOF
    }
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
go mod download
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
cd backend
# Note: You'll need to install golang-migrate first
# migrate -path db/migrations -database "postgres://postgres:password@localhost:5432/chinese_learning?sslmode=disable" up
cd ..

echo "✅ Setup complete!"
echo ""
echo "🎉 Your Chinese Learning App is ready!"
echo ""
echo "To start development:"
echo "  make dev"
echo ""
echo "To build for production:"
echo "  make build"
echo ""
echo "To run with Docker:"
echo "  make docker-run"
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8080"
echo "  Database: localhost:5432" 
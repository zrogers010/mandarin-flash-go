# Chinese Learning Web App - Project Overview

## 🎯 Project Summary

A production-grade web application for learning Chinese with comprehensive HSK vocabulary practice, interactive quizzes, dictionary lookup, and AI-powered conversation practice.

## 🏗️ Architecture

### Backend (Go)
- **Framework**: Gin for HTTP routing
- **Database**: PostgreSQL for persistent data
- **Cache**: Redis for session management and caching
- **Structure**: Clean architecture with separate packages for config, database, API, etc.
- **Hot Reload**: Air for development
- **Documentation**: Swagger/OpenAPI

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query for server state
- **Routing**: React Router for client-side navigation
- **Icons**: Lucide React for consistent iconography

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Build Automation**: Make for common tasks
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## 📁 Project Structure

```
mf-go/
├── backend/                    # Go server
│   ├── cmd/                   # Application entry points
│   │   ├── server/           # Main server
│   │   └── seed/             # Database seeding
│   ├── internal/             # Private application code
│   │   ├── api/              # HTTP handlers and routes
│   │   ├── config/           # Configuration management
│   │   ├── database/         # Database connection and utilities
│   │   └── redis/            # Redis connection and utilities
│   ├── db/                   # Database files
│   │   └── migrations/       # SQL migration files
│   ├── Dockerfile            # Backend container
│   └── go.mod                # Go dependencies
├── frontend/                  # React application
│   ├── src/                  # Source code
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── App.tsx           # Main app component
│   │   ├── main.tsx          # Application entry point
│   │   └── index.css         # Global styles
│   ├── Dockerfile            # Frontend container
│   ├── nginx.conf            # Production web server config
│   ├── package.json          # Node.js dependencies
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── tsconfig.json         # TypeScript configuration
│   └── vite.config.ts        # Vite configuration
├── scripts/                   # Build and utility scripts
├── docker-compose.yml         # Development environment
├── Makefile                   # Build automation
├── .gitignore                 # Git ignore rules
└── README.md                  # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Go 1.21+
- Node.js 18+
- Docker & Docker Compose
- Make

### Quick Start
1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd mf-go
   make setup
   ```

2. **Start development**:
   ```bash
   make dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432

## 🎨 Features Overview

### 1. Vocabulary Practice
- **Status**: Framework ready, implementation needed
- **Features**: HSK 2.0 levels 1-5 (~2,500 words; HSK 6 coming soon), definitions, pinyin, tones, example sentences
- **Next Steps**: 
  - Implement vocabulary API endpoints
  - Create vocabulary practice UI components
  - Add audio pronunciation
  - Implement spaced repetition algorithm

### 2. Quiz Section
- **Status**: Framework ready, implementation needed
- **Features**: Multiple choice, matching exercises, scoring
- **Next Steps**:
  - Implement quiz generation logic
  - Create quiz UI components
  - Add progress tracking
  - Implement adaptive difficulty

### 3. Dictionary Lookup
- **Status**: Framework ready, implementation needed
- **Features**: Search functionality, definitions, sample sentences
- **Next Steps**:
  - Implement search API
  - Create dictionary UI
  - Add fuzzy search
  - Integrate with external APIs

### 4. AI Chat Bot
- **Status**: Framework ready, implementation needed
- **Features**: Conversational AI, bilingual support, teaching capabilities
- **Next Steps**:
  - Integrate AI service (OpenAI, Claude, etc.)
  - Implement chat UI
  - Add conversation history
  - Implement teaching prompts

## 🔧 Development Workflow

### Backend Development
- Hot reload with Air
- API documentation with Swagger
- Database migrations with golang-migrate
- Testing with Go's built-in testing

### Frontend Development
- Hot reload with Vite
- TypeScript strict mode
- ESLint and Prettier for code quality
- Component-driven development

### Database Management
- Migrations in `backend/db/migrations/`
- Seed data with `make seed-db`
- PostgreSQL with UUID support

## 🚀 Deployment

### Development
- Docker Compose for local services
- Hot reload for both frontend and backend
- Local database and Redis

### Production
- Multi-stage Docker builds
- Nginx for frontend serving
- Environment-based configuration
- Health checks and monitoring

## 📊 Database Schema

### Core Tables
- `vocabulary`: HSK words with definitions and metadata
- `quiz_results`: User quiz performance tracking
- `chat_messages`: Conversation history
- `users`: User accounts (future authentication)

### Key Features
- UUID primary keys
- JSONB for flexible data storage
- Automatic timestamps
- Proper indexing for performance

## 🎯 Next Steps

### Phase 1: Core Features (Current)
- ✅ Project structure and setup
- ✅ Basic routing and UI framework
- ✅ Database schema and migrations
- 🔄 API endpoint implementation
- 🔄 Frontend component development

### Phase 2: Feature Implementation
- Vocabulary practice with spaced repetition
- Interactive quiz system
- Dictionary search functionality
- Basic AI chat integration

### Phase 3: Enhancement
- User authentication and profiles
- Progress tracking and analytics
- Advanced AI features
- Mobile responsiveness improvements

### Phase 4: Production
- Performance optimization
- Security hardening
- Monitoring and logging
- CI/CD pipeline setup

## 🛠️ Available Commands

```bash
# Development
make setup          # Initial project setup
make dev            # Start development environment
make build          # Build production artifacts
make test           # Run tests
make clean          # Clean build artifacts

# Database
make migrate-up     # Run database migrations
make migrate-down   # Rollback migrations
make seed-db        # Seed database with sample data

# Docker
make docker-build   # Build Docker images
make docker-run     # Run with Docker Compose
make docker-stop    # Stop Docker services

# Code Quality
make format         # Format code
make lint           # Lint code
```

## 🔗 API Endpoints

### Base URL: `http://localhost:8080/api/v1`

- `GET /health` - Health check
- `GET /vocabulary/` - List vocabulary
- `GET /vocabulary/:id` - Get vocabulary item
- `GET /vocabulary/hsk/:level` - Get HSK level vocabulary
- `GET /quiz/generate` - Generate quiz
- `POST /quiz/submit` - Submit quiz answers
- `GET /dictionary/search` - Search dictionary
- `GET /dictionary/:word` - Get word definition
- `POST /chat/message` - Send chat message
- `GET /chat/history` - Get chat history

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (#0ea5e9 to #eab308)
- **Secondary**: Yellow/Orange (#facc15)
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **English**: Inter font family
- **Chinese**: Noto Sans SC font family
- **Responsive**: Mobile-first design

### Components
- Consistent button styles (primary, secondary, outline)
- Card components with shadows
- Form inputs with focus states
- Responsive navigation

## 📝 Notes

- The project is set up with a production-ready architecture
- All dependencies are pinned to specific versions for stability
- TypeScript strict mode is enabled for better code quality
- Docker containers are optimized for both development and production
- The database schema supports future authentication and user features
- The frontend is designed to be mobile-responsive from the start

This framework provides a solid foundation for building a comprehensive Chinese learning application with all the requested features. 
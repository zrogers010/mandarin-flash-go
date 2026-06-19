# MandarinFlash-Go

A comprehensive Chinese learning platform built with Go (backend) and React (frontend) for mastering HSK vocabulary, featuring interactive quizzes, AI-powered conversation practice, and a smart dictionary.

## 🚀 Quick Start

**⚠️ IMPORTANT: You need Docker Desktop running to start the application!**

1. **Start Docker Desktop**
   ```bash
   # On macOS, start Docker Desktop
   open -a Docker
   # Wait for Docker to fully start (you'll see the whale icon in your menu bar)
   ```

2. **Stop local Postgres.app (if running)**
   ```bash
   # If you have Postgres.app running locally, stop it to avoid port conflicts
   pkill -f "postgres" || echo "No local postgres running"
   ```

3. **Clone and setup the project**
   ```bash
   git clone <repository-url>
   cd mandarinflash-go
   make setup
   ```

4. **Start the entire application**
   ```bash
   make dev
   ```

5. **Access the application**
   - 🌐 **Frontend**: http://localhost:3000
   - 🔧 **Backend API**: http://localhost:8080

That's it! The `make dev` command will:
- Start PostgreSQL and Redis in Docker containers
- Run database migrations automatically
- Start the Go backend server with hot reloading
- Start the React frontend development server

## 🛠️ Alternative Startup Methods

### Option 1: Manual Docker Compose (if you prefer more control)
```bash
# Start just the database and Redis
docker-compose up -d postgres redis

# Run migrations
make migrate-up

# Start backend (in one terminal)
cd backend && go run cmd/server/main.go

# Start frontend (in another terminal)
cd frontend && npm run dev
```

### Option 2: Full Docker Compose (production-like)
```bash
# Start everything in Docker containers
make docker-run
```

## 🚀 Features

- **HSK Vocabulary Practice**: HSK 2.0 levels 1-5 (~2,500 words) with definitions, pinyin, tones, and native example sentences (HSK 6 coming soon)
- **Smart Search**: Search by Chinese characters, pinyin (with or without tones), or English
- **Interactive Quizzes**: Test your knowledge with flashcards and scored multiple-choice quizzes
- **Dictionary Lookup**: Comprehensive word definitions and examples
- **Responsive Design**: Modern, mobile-friendly interface
- **AI Chat Practice**: Conversation practice with an AI tutor (planned — backend ready, UI in progress)

## 🏗️ Architecture

- **Backend**: Go with Gin framework, PostgreSQL database, Redis caching
- **Frontend**: React with TypeScript, Vite, Tailwind CSS
- **Database**: PostgreSQL with custom tone-stripping functions for pinyin search
- **Caching**: Redis for session management and performance optimization

## 🛠️ Tech Stack

### Backend
- **Go 1.21+** - Main backend language
- **Gin** - HTTP web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **Air** - Hot reloading for development

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Query** - Data fetching and caching
- **Lucide React** - Icons

## 📦 Installation

### Prerequisites
- **Docker Desktop** (required for database and Redis)
- Go 1.21+
- Node.js 18+

## 🗄️ Database Setup

The application uses PostgreSQL with custom functions for Chinese language support:

### Key Features
- **Tone-stripped Pinyin Search**: Search for words without knowing exact tones
- **HSK Level Organization**: Vocabulary organized by HSK levels
- **Example Sentences**: Each word includes contextual examples
- **Part of Speech**: Grammatical information for each word

### Migration Commands
```bash
# Run migrations
make migrate-up

# Rollback migrations
make migrate-down

# Seed database with HSK vocabulary
make seed-db
```

## 🔍 API Endpoints

### Vocabulary
- `GET /api/v1/vocabulary/` - List vocabulary with filters
- `GET /api/v1/vocabulary/random` - Get random vocabulary for practice
- `GET /api/v1/vocabulary/hsk/:level` - Get vocabulary by HSK level
- `GET /api/v1/vocabulary/:id` - Get specific vocabulary item

### Health Check
- `GET /api/v1/health` - Service health status

## 🎯 Search Features

The vocabulary search supports multiple input methods:

- **Chinese Characters**: Search by Chinese characters (汉字)
- **Pinyin with Tones**: Search with exact tones (xià)
- **Pinyin without Tones**: Search without tones (xia) - finds all variations
- **English**: Search by English translations

### Example Searches
- `xia` → finds: xià (下), xiā (虾), xiǎ (夏), etc.
- `ma` → finds: mǎ (马), ma (吗), má (麻), etc.
- `ni` → finds: nǐ (你), ní (尼), nì (逆), etc.

## 🔧 Troubleshooting

### Common Issues

**"Failed to ping database" or "Postgres.app failed to verify trust authentication" error**
- Stop local Postgres.app: `pkill -f "postgres"`
- Make sure Docker Desktop is running
- Run `docker ps` to verify containers are running
- If containers aren't running, try `make dev` again

**"Cannot connect to Docker daemon" error**
- Start Docker Desktop: `open -a Docker`
- Wait for Docker to fully start (whale icon in menu bar)
- Try the command again

**Port already in use errors**
- Stop any existing services: `make docker-stop`
- Or kill processes using the ports: `lsof -ti:3000 | xargs kill -9`

## 🧪 Development

### Available Commands
```bash
# Install dependencies
make setup

# Start development environment
make dev

# Build for production
make build

# Run tests
make test

# Format code
make format

# Lint code
make lint
```

### Project Structure
```
mandarinflash-go/
├── backend/                 # Go backend
│   ├── cmd/                # Application entry points
│   ├── internal/           # Private application code
│   │   ├── api/           # HTTP handlers
│   │   ├── config/        # Configuration
│   │   ├── database/      # Database connection
│   │   ├── models/        # Data models
│   │   └── redis/         # Redis connection
│   ├── db/                # Database migrations
│   └── scripts/           # Utility scripts
├── frontend/              # React frontend
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities and API
│   └── public/           # Static assets
├── docker-compose.yml    # Docker services
└── Makefile             # Build and development commands
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- HSK 3.0 vocabulary data
- Chinese language learning community
- Open source contributors 
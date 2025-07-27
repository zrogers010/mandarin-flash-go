# MandarinFlash-Go

A comprehensive Chinese learning platform built with Go (backend) and React (frontend) for mastering HSK vocabulary, featuring interactive quizzes, AI-powered conversation practice, and a smart dictionary.

## 🚀 Features

- **HSK Vocabulary Practice**: Complete HSK 3.0 Level 1 vocabulary with 499 words
- **Smart Search**: Search by Chinese characters, pinyin (with or without tones), or English
- **Interactive Quizzes**: Test your knowledge with various question types
- **AI Chat Practice**: Practice conversations with AI assistance
- **Dictionary Lookup**: Comprehensive word definitions and examples
- **Responsive Design**: Modern, mobile-friendly interface

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
- Go 1.21+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mandarinflash-go
   ```

2. **Start the services**
   ```bash
   # Start database and Redis
   docker-compose up -d postgres redis
   
   # Run migrations
   make migrate-up
   
   # Start backend
   cd backend && go run cmd/server/main.go
   
   # Start frontend (in another terminal)
   cd frontend && npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

### Manual Setup

1. **Backend Setup**
   ```bash
   cd backend
   go mod download
   
   # Set environment variables
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=chinese_learning
   export DB_USER=postgres
   export DB_PASSWORD=password
   
   # Run migrations
   make migrate-up
   
   # Start server
   go run cmd/server/main.go
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

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
# Gold Shop Management System (طلافروشی)

A comprehensive web application for gold shop business management built with React TypeScript frontend and FastAPI backend, fully containerized with Docker.

## 🐳 Docker Environment

This application runs entirely in Docker containers. All development, testing, and deployment must be done within the Docker environment.

## Project Structure

```
goldshop/
├── backend/                 # FastAPI backend
│   ├── tests/              # Backend tests (real PostgreSQL)
│   ├── main.py             # FastAPI application
│   ├── models.py           # SQLAlchemy models
│   ├── database.py         # Database configuration
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container
│   └── init.sql           # Database initialization
├── frontend/               # React TypeScript frontend
│   ├── src/               # Source code
│   ├── public/            # Public assets
│   ├── package.json       # Node dependencies
│   └── Dockerfile         # Frontend container
├── docker-compose.yml     # Development environment
├── docker-compose.test.yml # Testing environment
├── .env                   # Environment variables
└── README.md             # This file
```

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Development Setup

1. Clone the repository
2. Start the development environment:
```bash
docker-compose up --build -d
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Using Development Scripts

For convenience, use the provided scripts:

**Windows (PowerShell):**
```powershell
# Start development environment
.\scripts\dev.ps1 start

# Run all tests
.\scripts\dev.ps1 test

# Run backend tests only
.\scripts\dev.ps1 test-backend

# Run frontend tests only
.\scripts\dev.ps1 test-frontend

# View logs
.\scripts\dev.ps1 logs

# Stop services
.\scripts\dev.ps1 stop

# Clean up
.\scripts\dev.ps1 clean
```

**Linux/Mac:**
```bash
# Start development environment
./scripts/dev.sh start

# Run all tests
./scripts/dev.sh test

# Run backend tests only
./scripts/dev.sh test-backend

# Run frontend tests only
./scripts/dev.sh test-frontend

# View logs
./scripts/dev.sh logs

# Stop services
./scripts/dev.sh stop

# Clean up
./scripts/dev.sh clean
```

### Manual Docker Commands

Run all tests in Docker environment:
```bash
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

Run backend tests only:
```bash
docker-compose up -d db backend
docker-compose -f docker-compose.test.yml run --rm test-backend
```

Run frontend tests only:
```bash
docker-compose up -d db backend
docker-compose -f docker-compose.test.yml run --rm test-frontend
```

## Environment Variables

Key environment variables (see `.env` file):

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT token secret key
- `SMS_API_KEY`: SMS service API key
- `REACT_APP_API_URL`: Backend API URL for frontend

## Database

The application uses PostgreSQL 15 with the following key features:
- UUID primary keys
- Automatic timestamps
- Proper relationships and constraints
- Initial data seeding

### Database Schema

Main tables:
- `users` - User accounts and authentication
- `roles` - User roles and permissions
- `categories` - Product categories
- `inventory_items` - Gold inventory
- `customers` - Customer information
- `invoices` - Sales invoices
- `invoice_items` - Invoice line items
- `accounting_entries` - Financial transactions
- `company_settings` - System configuration

## API Endpoints

### Health Check
- `GET /` - API status
- `GET /health` - Health check with database connectivity

## Testing Strategy

### 🐳 Critical Testing Requirements
- ALL tests run in Docker containers
- ALL backend tests use the MAIN PostgreSQL database (not separate test database)
- ALL frontend tests use the MAIN backend service
- NO mocking of database connections
- NO testing outside Docker environment
- Data persistence through Docker volumes

### Backend Testing
- Unit tests with real database operations on MAIN database
- Integration tests with actual PostgreSQL (main database)
- API endpoint testing with database transactions on persistent data
- Business logic testing with real data that persists between test runs

### Frontend Testing
- Component testing with real API calls to MAIN backend
- Integration testing with MAIN backend services
- RTL (Persian) functionality testing
- User workflow testing with persistent data

## Development Workflow

1. Start development environment: `docker-compose up`
2. Make code changes (hot reload enabled)
3. Run tests: `docker-compose -f docker-compose.test.yml up`
4. Commit changes

## Production Deployment

For production deployment, update environment variables in `.env` and use:
```bash
docker-compose -f docker-compose.yml up -d
```

## Features

- 🔐 JWT Authentication with role-based access
- 📊 Comprehensive dashboard with real-time metrics
- 📦 Inventory management with categories and stock tracking
- 👥 Customer management with debt tracking
- 🧾 Invoice creation with gram-based pricing
- 💰 Complete accounting system with multiple ledgers
- 📈 Reports and analytics with interactive charts
- ⚙️ System settings and configuration
- 📱 SMS notification system
- 🌐 Bilingual support (Persian RTL + English)
- 🐳 Full Docker containerization

## Technology Stack

### Backend
- FastAPI (Python 3.11+)
- PostgreSQL 15
- SQLAlchemy ORM
- Pydantic validation
- JWT authentication
- Pytest for testing

### Frontend
- React 18 with TypeScript
- React Router for navigation
- React Query for API state management
- Tailwind CSS with RTL support
- Chart.js for data visualization
- shadcn/ui components (to be added)

### Infrastructure
- Docker & Docker Compose
- PostgreSQL with persistent volumes for data retention
- Persistent volumes for uploads and node_modules
- Environment-based configuration

### Persistent Data Storage
The application uses Docker volumes for data persistence:
- `postgres_data`: PostgreSQL database data (survives container restarts)
- `uploads_data`: File uploads and media storage
- `frontend_node_modules`: Node.js dependencies cache

## License

This project is proprietary software for gold shop management.
## ✅ 
Task 1 Implementation Summary

### Docker Environment Setup Completed

**Key Features Implemented:**

1. **🐳 Docker Environment with Persistent Volumes**:
   - Main PostgreSQL database with persistent data storage
   - Backend and frontend services with volume mounts
   - Persistent volumes: `postgres_data`, `uploads_data`, `frontend_node_modules`

2. **🧪 Testing with Main Database**:
   - ALL tests run against the MAIN PostgreSQL database (not separate test database)
   - Backend tests: 13/13 passing ✅
   - Frontend tests: 11/11 passing ✅
   - Data persistence tests verify volume functionality

3. **📊 Test Coverage**:
   - Docker environment setup and connectivity
   - Database operations with real PostgreSQL
   - API endpoint testing with persistent data
   - Frontend component and integration testing
   - Data persistence across container restarts

4. **🔧 Development Tools**:
   - PowerShell and Bash scripts for easy management
   - Hot reload for both backend and frontend
   - Comprehensive logging and health checks

### Test Results:
- **Backend Tests**: 13 tests passing (Docker setup + Data persistence)
- **Frontend Tests**: 11 tests passing (Component + API integration)
- **Database**: Real PostgreSQL with seeded data and persistent storage
- **Volumes**: All data persists across container restarts

### Usage:
```bash
# Start development environment
docker-compose up -d

# Run all tests with main database
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Use development scripts
.\scripts\dev.ps1 start    # Windows
./scripts/dev.sh start     # Linux/Mac
```

The Docker environment is now fully configured with persistent data storage and comprehensive testing using the main database as requested.
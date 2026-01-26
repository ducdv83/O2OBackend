# O2O Backend API

Backend API server cho O2O Care Platform - Xây dựng với NestJS.

## Công nghệ

- **Framework**: NestJS
- **Database**: PostgreSQL (với PostGIS extension)
- **Cache**: Redis (optional)
- **ORM**: TypeORM
- **WebSocket**: Socket.IO
- **Language**: TypeScript
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI

## Cấu trúc thư mục

```
O2OBackend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── common/                    # Shared modules (guards, decorators, filters, interceptors)
│   ├── config/                    # Configuration files
│   ├── database/                  # Database setup & migrations
│   ├── auth/                      # Authentication module
│   ├── users/                     # Users module
│   ├── carepro/                   # CarePro profiles module
│   ├── client/                    # Client profiles module
│   ├── jobs/                      # Jobs module
│   ├── matching/                  # Matching algorithm (FitScore)
│   ├── proposals/                 # Proposals module
│   ├── bookings/                  # Bookings module
│   ├── timesheets/                # Timesheets module
│   ├── payments/                  # Payments & Escrow module
│   ├── payouts/                   # Payouts module
│   ├── reviews/                   # Reviews module
│   ├── messages/                  # Chat/Messages module
│   ├── verifications/             # eKYC & Verifications module
│   ├── disputes/                  # Disputes module
│   ├── notifications/             # Notifications module
│   ├── admin/                     # Admin module
│   ├── otp/                       # OTP service module
│   └── file-storage/              # File upload/storage module
├── migrations/                    # Database migrations
├── .env.example                   # Environment variables template
└── package.json
```

## Setup

### Yêu cầu

- Node.js >= 18.x
- PostgreSQL >= 14 (với PostGIS extension)
- Redis >= 6 (optional, cho caching)

### Cài đặt

```bash
# Cài đặt dependencies
npm install

# Tạo file .env từ .env.example
cp .env.example .env

# Chỉnh sửa .env với thông tin database của bạn
```

### Cấu hình Database

1. Tạo database PostgreSQL:
```sql
CREATE DATABASE o2o_db;
```

2. Enable PostGIS extension:
```sql
\c o2o_db
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

3. Chạy migrations:
```bash
npm run migration:run
```

### Chạy ứng dụng

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Server sẽ chạy tại: `http://localhost:3000`

## Environment Variables

Tạo file `.env` từ `.env.example` và cấu hình:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=o2o_db

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# OTP
OTP_EXPIRES_IN=300
OTP_LENGTH=6
```

Xem `.env.example` để biết đầy đủ các biến môi trường.

## API Documentation

Sau khi chạy server, truy cập Swagger UI tại:
- **Development**: http://localhost:3000/api/docs

## Modules

### Đã hoàn thành (Sprint 3.1)

- ✅ **Setup & Database**: NestJS project structure, PostgreSQL connection, Redis cache, migrations, logging, error handling
- ✅ **Auth Module**: OTP-based authentication, JWT tokens
- ✅ **Users Module**: User management, profile updates
- ✅ **OTP Service**: OTP generation & verification (mock SMS)

### Đang phát triển

- ⏳ **CarePro Module**: CarePro profiles, skills, ratings
- ⏳ **Jobs Module**: Job posting, geospatial queries
- ⏳ **Matching Module**: FitScore algorithm
- ⏳ **Bookings Module**: Booking management
- ⏳ **Payments Module**: Payment gateway integration, Escrow system
- ⏳ **Messages Module**: WebSocket chat
- ⏳ **Verifications Module**: eKYC, document verification
- ⏳ **Admin Module**: Admin dashboard APIs

## Database

Schema được định nghĩa trong `docs/schema_o2o_v1.sql` và migrations trong `src/database/migrations/`.

### Chạy Migrations

```bash
# Tạo migration mới
npm run migration:generate -- -n MigrationName

# Chạy migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Development

### Code Style

- Sử dụng ESLint và Prettier
- Format code: `npm run format`
- Lint code: `npm run lint`

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/request-otp` - Request OTP
- `POST /api/v1/auth/verify-otp` - Verify OTP & get token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile

Xem Swagger documentation để biết đầy đủ API endpoints.

## Roadmap

Xem `docs/IMPLEMENTATION_PLAN.md` để biết chi tiết kế hoạch phát triển theo từng phase.

**Phase 3 Status:**
- ✅ Sprint 3.1: Setup & Database
- ⏳ Sprint 3.2: Authentication & User Management (đang phát triển)
- ⏳ Sprint 3.3-3.10: Các modules còn lại

## License

[Thêm license của bạn]

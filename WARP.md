# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Gym Management System** built with NestJS, TypeScript, and PostgreSQL. The system manages users, authentication, roles, memberships, subscriptions, and attendance tracking.

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Then configure .env with your database and JWT settings

# Start PostgreSQL database with Docker
docker-compose up -d

# Run database seed (creates initial roles and users)
curl -X POST http://localhost:3000/seed
```

### Running the Application
```bash
# Development mode with hot-reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

### Testing
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Debug tests
npm run test:debug
```

### Code Quality
```bash
# Run ESLint (auto-fix)
npm run lint

# Format code with Prettier
npm run format
```

## Architecture

### Module Structure

The application follows NestJS modular architecture with these primary modules:

1. **Auth Module** (`src/auth/`)
   - Handles authentication, authorization, and user management
   - JWT-based authentication with Passport strategy
   - Role-based access control (RBAC) with custom decorators and guards
   - Entities: `User`, `Role`
   - Key files:
     - `strategies/jwt.strategy.ts` - JWT validation
     - `guards/user-role.guard.ts` - Role-based authorization
     - `decorators/auth.decorator.ts` - Composite decorator combining role protection and auth guards

2. **Memberships Module** (`src/memberships/`)
   - Manages gym membership plans
   - Defines membership types with pricing, duration, and access limits

3. **Subscriptions Module** (`src/subscriptions/`)
   - Handles user subscriptions to memberships
   - Links users to memberships with purchase dates and tracking
   - Many-to-many relationship with Memberships

4. **Attendances Module** (`src/attendances/`)
   - Tracks user attendance (implementation pending)

5. **Users Module** (`src/users/`)
   - User CRUD operations (separate from Auth for business logic)

6. **Seed Module** (`src/seed/`)
   - Database seeding with initial data
   - Creates roles (admin, coach, client, receptionist) and test users
   - Endpoint: `POST /seed`

### Database Architecture

**TypeORM** with PostgreSQL (port 5433 in docker-compose, connects to 5432 in container):

- **User** entity: Email, fullName, age, password, isActive, roles (many-to-many with Role), subscriptions (one-to-many)
- **Role** entity: name (ValidRoles enum), users (many-to-many with User)
- **Membership** entity: name, cost, max_classes_assistance, max_gym_assistance, duration_months, status
- **Subscription** entity: Connects users to memberships, includes purchase_date, cost, assistance limits
- **Join table**: `user_roles` (User ↔ Role many-to-many)
- **Join table**: `subscription_memberships` (Subscription ↔ Membership many-to-many)

**Note**: `synchronize: true` is enabled in TypeORM config - this auto-syncs schema changes. Disable in production.

### Authentication & Authorization

- **Strategy**: JWT tokens with 1-hour expiration
- **Roles**: admin, coach, client, receptionist (defined in `auth/enums/roles.enum.ts`)
- **Custom decorators**:
  - `@Auth(...roles)` - Composite decorator that applies `@RoleProtected()` + `AuthGuard()` + `UserRoleGuard`
  - `@GetUser()` - Extracts authenticated user from request
  - `@RawHeaders()` - Extracts raw headers
- **Guards**:
  - `AuthGuard('jwt')` - Validates JWT token
  - `UserRoleGuard` - Checks user has required roles
- **JWT payload**: Contains user `id`, validated against database with eager-loaded roles

### Environment Configuration

Required environment variables (see `.env.example`):
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - Database connection
- `JWT_SECRET` - JWT signing secret
- `PORT` - Application port (default: 3000)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` - Docker PostgreSQL config

## Development Guidelines

### Using Role-Based Protection

To protect endpoints with role-based access control:

```typescript
import { Auth } from './auth/decorators/auth.decorator';
import { ValidRoles } from './auth/enums/roles.enum';

@Get('admin-only')
@Auth(ValidRoles.admin)
adminEndpoint() {
  // Only admin role can access
}

@Get('multiple-roles')
@Auth(ValidRoles.admin, ValidRoles.coach)
multiRoleEndpoint() {
  // Admin or coach can access
}
```

### Getting Authenticated User

```typescript
import { GetUser } from './auth/decorators/get-user.decorator';
import { User } from './auth/entities/users.entity';

@Get('profile')
@Auth()
getProfile(@GetUser() user: User) {
  // user object includes roles (eager loaded via JWT strategy)
}
```

### Adding New Entities

1. Create entity in appropriate module's `entities/` directory
2. Define TypeORM columns and relations
3. Add entity to module's `TypeOrmModule.forFeature([Entity])`
4. Create corresponding DTOs in `dto/` directory
5. Update seed data if needed in `src/seed/data/`

### Database Management

- **Adminer** UI available at `http://localhost:8080` when running docker-compose
- **Reset database**: Stop containers, remove volume `postgres_data`, restart with `docker-compose up -d`
- **Reseed**: `curl -X POST http://localhost:3000/seed` (WARNING: Deletes all users and roles)

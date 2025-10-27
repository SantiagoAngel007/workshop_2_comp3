# 🧪 Test Documentation - Gym Management System

## 📋 Overview

This document provides comprehensive information about the testing strategy and implementation for the Gym Management System. The project achieves **80%+ code coverage** using Jest for unit tests and Supertest for integration tests.

## 🏗️ Testing Architecture

### Test Structure
```
test/
├── utils/
│   ├── test-utils.ts           # Mock utilities and test data
│   └── database-test-utils.ts  # Database testing utilities
├── setup.ts                    # Global test setup
├── app.e2e-spec.ts            # Main application e2e tests
├── auth.e2e-spec.ts           # Authentication e2e tests
└── subscriptions.e2e-spec.ts  # Subscriptions e2e tests

src/
├── **/*.spec.ts               # Unit tests for each module
└── **/*.e2e-spec.ts          # Integration tests
```

## 🎯 Testing Strategy

### Unit Tests (Jest)
- **Services**: Test business logic, error handling, and data manipulation
- **Controllers**: Test HTTP request/response handling and route logic
- **Guards**: Test authentication and authorization logic
- **Utilities**: Test helper functions and utilities

### Integration Tests (Supertest)
- **API Endpoints**: Test complete request/response cycles
- **Authentication Flow**: Test login, registration, and protected routes
- **Database Operations**: Test CRUD operations with real database interactions
- **Error Scenarios**: Test error handling and edge cases

## 📊 Coverage Goals

- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Coverage Report
```bash
npm run test:cov
```

### Watch Mode
```bash
npm run test:watch
```

### Debug Mode
```bash
npm run test:debug
```

## 📝 Test Categories

### 1. Authentication Tests (`auth.service.spec.ts`, `auth.controller.spec.ts`, `auth.e2e-spec.ts`)

**Unit Tests:**
- User registration with valid/invalid data
- User login with correct/incorrect credentials
- Password encryption and validation
- JWT token generation and validation
- User CRUD operations
- Role assignment and validation

**Integration Tests:**
- Complete registration flow
- Complete login flow
- Protected route access
- Token-based authentication
- Role-based authorization

### 2. Subscriptions Tests (`subscriptions.service.spec.ts`, `subscriptions.controller.spec.ts`, `subscriptions.e2e-spec.ts`)

**Unit Tests:**
- Subscription creation for users
- Membership assignment to subscriptions
- Subscription updates and modifications
- Subscription retrieval and filtering
- Error handling for invalid operations

**Integration Tests:**
- Complete subscription management flow
- Membership addition/removal
- User-subscription relationships
- Admin-only operations
- Data validation and constraints

### 3. Memberships Tests (`memberships.service.spec.ts`, `memberships.controller.spec.ts`)

**Unit Tests:**
- Membership CRUD operations
- Membership validation
- Cost and duration calculations
- Status management

### 4. Users Tests (`users.service.spec.ts`, `users.controller.spec.ts`)

**Unit Tests:**
- User management operations
- Profile updates
- User status management

### 5. Attendances Tests (`attendances.service.spec.ts`, `attendances.controller.spec.ts`)

**Unit Tests:**
- Attendance tracking
- Attendance validation
- Reporting functionality

## 🛠️ Test Utilities

### Mock Repository (`test-utils.ts`)
```typescript
export const createMockRepository = <T = any>(): Partial<Repository<T>> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  // ... other repository methods
});
```

### Test Data
- `mockUser`: Standard user object for testing
- `mockRole`: Role object with different permissions
- `mockMembership`: Membership with standard configuration
- `mockSubscription`: Subscription with user and membership relations

### Database Test Utils (`database-test-utils.ts`)
- `cleanDatabase()`: Clean all test data
- `seedRoles()`: Create default roles
- `createTestUser()`: Create user with specific role
- `createTestMembership()`: Create membership with custom data
- `createTestSubscription()`: Create subscription with relations

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // ... other configurations
};
```

### E2E Configuration (`test/jest-e2e.json`)
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

## 🎨 Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow AAA pattern: Arrange, Act, Assert

### 2. Mocking Strategy
- Mock external dependencies (database, HTTP calls)
- Use dependency injection for easier testing
- Create reusable mock factories

### 3. Data Management
- Use fresh test data for each test
- Clean up after tests to avoid interference
- Use realistic test data that matches production scenarios

### 4. Error Testing
- Test both success and failure scenarios
- Verify proper error messages and status codes
- Test edge cases and boundary conditions

### 5. Integration Testing
- Test complete user workflows
- Verify database transactions
- Test authentication and authorization flows

## 📈 Coverage Reports

Coverage reports are generated in the `coverage/` directory and include:
- HTML report for detailed line-by-line coverage
- LCOV report for CI/CD integration
- Text summary for quick overview

## 🚨 Common Issues and Solutions

### 1. Database Connection Issues
```typescript
// Ensure proper database cleanup
beforeEach(async () => {
  await DatabaseTestUtils.cleanDatabase(/* repositories */);
});
```

### 2. Authentication in E2E Tests
```typescript
// Generate valid JWT tokens for testing
const token = jwtService.sign({ id: user.id });
```

### 3. Async Test Handling
```typescript
// Always use async/await for database operations
it('should create user', async () => {
  const result = await service.create(userData);
  expect(result).toBeDefined();
});
```

## 🎯 Continuous Integration

The test suite is designed to run in CI/CD environments with:
- Automated test execution on pull requests
- Coverage reporting and enforcement
- Integration with code quality tools
- Parallel test execution for faster feedback

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [TypeORM Testing](https://typeorm.io/#/testing)

---

**Note**: This testing implementation ensures robust code quality and provides confidence in the application's reliability through comprehensive test coverage.

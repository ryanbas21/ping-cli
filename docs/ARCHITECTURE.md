# Architecture Documentation

This document describes the architecture, design patterns, and organization of the PingOne SDK CI CLI monorepo.

## Table of Contents

- [Overview](#overview)
- [Monorepo Structure](#monorepo-structure)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Service Composition](#service-composition)
- [Design Patterns](#design-patterns)
- [Module Dependencies](#module-dependencies)
- [Data Flow](#data-flow)
- [Error Handling Strategy](#error-handling-strategy)
- [Testing Architecture](#testing-architecture)
- [Future Improvements](#future-improvements)

---

## Overview

The PingOne SDK CI CLI is a **monorepo** containing two packages built with Effect library patterns:

1. **`ping-cli`**: Command-line tool for managing PingOne resources (users, groups, populations, applications)
2. **`js-sdk-ci-cli`**: Internal tool for automating GitHub workflows for the Ping JavaScript SDK

### Design Goals

- **Type Safety**: Leverage TypeScript and Effect Schema for compile-time and runtime type safety
- **Functional Programming**: Use Effect library for composable, testable, and maintainable code
- **Error Handling**: Structured error types with comprehensive error recovery
- **Modularity**: Clear separation of concerns between CLI, services, HTTP clients, and business logic
- **Service Composition**: Cross-cutting concerns (retry, caching) handled via Effect Layer composition

---

## Monorepo Structure

This project uses **pnpm workspaces** for managing multiple packages:

```
sdk-ci-cli/                     # Monorepo root
├── packages/
│   ├── ping-cli/              # ping-cli - PingOne resource management
│   │   ├── src/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   └── js-sdk-ci-cli/         # js-sdk-ci-cli - GitHub workflow automation
│       ├── src/
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── docs/                      # Shared documentation
├── pnpm-workspace.yaml        # Workspace configuration
├── tsconfig.base.json         # Shared TypeScript config
└── package.json               # Root package with recursive scripts
```

### Package Responsibilities

#### ping-cli
- **Purpose**: Manage PingOne resources via API
- **Features**: Users, Groups, Populations, Applications CRUD operations
- **Binary**: `ping-cli`
- **Services**: RetryService, CacheService for resilient API interactions

#### js-sdk-ci-cli
- **Purpose**: Internal GitHub workflow automation
- **Features**: Trigger CI and publish workflows
- **Binary**: `js-sdk-ci`
- **Scope**: Internal development tool only

---

## Technology Stack

### Core Libraries

- **Effect** (v3.19.2): Functional programming library for TypeScript
  - Provides `Effect.gen` for generator-based composition
  - Schema validation for type-safe API interactions
  - Structured error handling with `Data.TaggedError`
  - Layer-based dependency injection

- **@effect/cli** (v0.72.0): CLI framework built on Effect
  - Declarative command definitions
  - Automatic help generation
  - Type-safe argument and option parsing

- **@effect/platform** (v0.93.0) / **@effect/platform-node** (v0.100.0):
  - HTTP client with Effect integration
  - Node.js runtime and context providers

### Development Tools

- **TypeScript** (v5.9.3): Static type checking
- **Vitest** (v4.0.8): Test runner
- **@effect/vitest** (v0.27.0): Effect-specific testing utilities
- **ESLint** (v9.39.1): Code linting with Effect plugin
- **pnpm** (v10.12.1): Package manager

---

## Service Composition

The `ping-cli` package uses **Effect Layer composition** to provide cross-cutting concerns like retry logic and caching. This follows Effect-ts best practices for dependency injection.

### Service Architecture

```
Application Entry Point (main.ts)
    ↓
Layer Composition (Layer.mergeAll)
    ├── NodeHttpClient.layer      # HTTP client
    ├── NodeContext.layer          # Node.js runtime
    ├── RetryServiceLive           # Retry logic service
    └── CacheServiceLive           # Caching service
    ↓
Commands (yield* services as needed)
    ↓
HTTP Client Functions (yield* services as needed)
```

### RetryService

Provides automatic retry logic with exponential backoff for transient failures:

**Location**: `packages/ping-cli/src/Services/RetryService.ts`

**Features**:
- Retries network errors, 5xx server errors, and 429 rate limits
- Exponential backoff: 100ms base, 2x multiplier, max 30s
- Respects `Retry-After` header from rate limit responses
- Maximum retry duration: 2 minutes
- Applied to all mutation operations (create, update, delete)
- Applied to all read operations (read, list)

**Usage Pattern**:
```typescript
export const createPingOneUser = (payload) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = /* HTTP request logic */

    return yield* retry.retryableRequest(httpRequest)
  })
```

### CacheService

Provides response caching to reduce API calls:

**Location**: `packages/ping-cli/src/Services/CacheService.ts`

**Features**:
- Per-resource caching (separate caches for users, groups, applications, populations)
- Cache TTL: 5 minutes
- Cache capacity: 100 entries per resource type
- Automatic cache invalidation on mutations
- Applied to all read operations (read, list)

**Usage Pattern**:
```typescript
export const readPingOneUser = (payload) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const cache = yield* CacheService
    const apiBaseUrl = yield* getApiBaseUrl()

    const req = HttpClientRequest.get(...).pipe(...)
    const httpRequest = Effect.gen(function*() {
      /* HTTP execution logic */
    })

    return yield* cache.getCached(req, retry.retryableRequest(httpRequest))
  })
```

### Layer Composition in main.ts

Services are provided globally via `Layer.mergeAll`:

```typescript
import { CacheServiceLive, RetryServiceLive } from "./Services/index.js"

const layers = Layer.mergeAll(
  NodeHttpClient.layer,
  NodeContext.layer,
  RetryServiceLive,
  CacheServiceLive
)

PingCli(process.argv).pipe(Effect.provide(layers), NodeRuntime.runMain)
```

**Benefits**:
- Services are memoized (single instance per application)
- HTTP client functions access services via `yield*` (dependency injection)
- Easy to test by providing mock layers
- No per-effect provision (anti-pattern avoided)

---

## Project Structure

### ping-cli Structure

```
packages/ping-cli/
├── src/
│   ├── Commands/              # CLI command implementations
│   │   ├── PingOne/          # PingOne resource management commands
│   │   │   ├── ConfigHelper.ts      # Shared configuration utilities
│   │   │   ├── applications/        # Application commands
│   │   │   ├── groups/              # Group commands
│   │   │   ├── populations/         # Population commands
│   │   │   └── index.ts             # Command aggregation
│   │   └── index.ts
│   ├── HttpClient/           # HTTP clients and API integration
│   │   ├── PingOneClient.ts        # User management API functions
│   │   ├── GroupClient.ts          # Group management API functions
│   │   ├── ApplicationClient.ts    # Application management API functions
│   │   ├── PopulationClient.ts     # Population management API functions
│   │   ├── PingOneSchemas.ts       # Request/response schemas
│   │   ├── GroupSchemas.ts
│   │   ├── ApplicationSchemas.ts
│   │   ├── PopulationSchemas.ts
│   │   └── *Types.ts               # TypeScript type definitions
│   ├── Services/             # Service layer (NEW)
│   │   ├── RetryService.ts         # Retry logic with exponential backoff
│   │   ├── CacheService.ts         # Response caching
│   │   └── index.ts                # Service exports
│   ├── Errors.ts             # Custom error type definitions
│   ├── PingCommand.ts        # Root command configuration
│   └── main.ts               # Application entry point with layer composition
├── docs/                     # Package documentation
├── examples/                 # Usage examples
├── coverage/                 # Test coverage reports
├── dist/                     # Compiled JavaScript output
├── README.md                # Package user documentation
└── package.json
```

### js-sdk-ci-cli Structure

```
packages/js-sdk-ci-cli/
├── src/
│   ├── Commands/
│   │   └── GitHub/           # GitHub workflow commands
│   │       ├── RunJSTests.ts      # CI workflow command
│   │       └── RunPublish.ts      # Publish workflow command
│   ├── HttpClient/
│   │   ├── HttpClient.ts          # GitHub API client
│   │   ├── schemas.ts             # Workflow schemas
│   │   └── types.ts               # Type definitions
│   ├── Errors.ts
│   ├── JSSdkCICommand.ts
│   └── main.ts
├── README.md
└── package.json
```

### Shared Documentation

```
docs/
├── API.md                    # API reference (both packages)
└── ARCHITECTURE.md           # This file
```

### Module Responsibilities

#### Commands Layer
- **Purpose**: Define CLI interface and user interactions
- **Responsibilities**:
  - Parse CLI arguments and options
  - Validate user inputs
  - Coordinate between config and HTTP client layers
  - Format output for console display
- **Pattern**: Each command is an Effect that handles end-to-end user workflow

#### Services Layer (NEW)
- **Purpose**: Provide cross-cutting concerns via dependency injection
- **Responsibilities**:
  - **RetryService**: Automatic retry logic with exponential backoff
  - **CacheService**: Response caching to reduce API calls
  - Centralize infrastructure concerns
  - Enable testability via Layer composition
- **Pattern**: Services provided globally via `Layer.mergeAll`, accessed via `yield*` in HTTP clients

#### HTTP Client Layer
- **Purpose**: Handle all HTTP API interactions
- **Responsibilities**:
  - Construct HTTP requests with proper headers
  - Execute HTTP calls via Effect HttpClient
  - Validate responses against schemas
  - Map HTTP errors to custom error types
  - **Integrate RetryService** for all requests (mutations and reads)
  - **Integrate CacheService** for read operations only
  - Use configurable API base URL from environment
- **Pattern**: Pure functions that return Effects, accessing services via `yield*`

#### Error Layer
- **Purpose**: Define structured error types
- **Responsibilities**:
  - Provide domain-specific error types
  - Include contextual information in errors
  - Support error recovery and debugging
- **Pattern**: Use `Data.TaggedError` for discriminated unions

---

## Design Patterns

### 1. Effect.gen Pattern

Used throughout for composing asynchronous operations:

```typescript
const program = Effect.gen(function* () {
  const config = yield* getConfig()
  const user = yield* createUser(config)
  yield* Console.log(`Created: ${user.id}`)
  return user
})
```

**Benefits**:
- Readable sequential code for async operations
- Automatic error propagation
- Type inference throughout the chain

### 2. Schema Validation

All API requests and responses are validated:

```typescript
// Define schema
export const PingOneCreateUserRequest = Schema.Struct({
  username: Schema.String,
  email: Schema.String,
  population: Schema.Struct({ id: Schema.String })
})

// Use in HTTP client
HttpClientRequest.schemaBodyJson(PingOneCreateUserRequest)(userData)
```

**Benefits**:
- Runtime validation of external data
- Type-safe API contracts
- Automatic error generation for invalid data

### 3. Tagged Errors

Custom error types for different failure scenarios:

```typescript
export class PingOneApiError extends Data.TaggedError("PingOneApiError")<{
  status: number
  message: string
  errorCode?: string
}> {}

// Usage
Effect.fail(new PingOneApiError({
  status: 404,
  message: "User not found"
}))
```

**Benefits**:
- Type-safe error handling with pattern matching
- Structured error information
- Clear error boundaries

### 4. Configuration Hierarchy

Environment variables with CLI option override:

```typescript
// Priority: CLI option > Environment variable
const envId = yield* Effect.if(
  Predicate.isTruthy(cliOption),
  {
    onTrue: () => Effect.succeed(cliOption),
    onFalse: () => Config.string("PINGONE_ENV_ID")
  }
)
```

**Benefits**:
- Flexible configuration
- Default values from environment
- Override capability via CLI flags

### 5. Layer-Based Dependency Injection

Runtime dependencies provided via layers:

```typescript
const layers = Layer.merge(
  NodeHttpClient.layer,
  NodeContext.layer
)

program.pipe(
  Effect.provide(layers),
  NodeRuntime.runMain
)
```

**Benefits**:
- Testable with mock layers
- Clear dependency management
- Environment isolation

---

## Module Dependencies

### Dependency Graph

```
main.ts
  └── PingCommand.ts
        ├── Commands/PingOne/index.ts
        │     ├── CreateUser.ts
        │     │     ├── ConfigHelper.ts
        │     │     └── HttpClient/PingOneClient.ts
        │     ├── ReadUser.ts
        │     │     ├── ConfigHelper.ts
        │     │     └── HttpClient/PingOneClient.ts
        │     ├── UpdateUser.ts
        │     │     ├── ConfigHelper.ts
        │     │     └── HttpClient/PingOneClient.ts
        │     ├── DeleteUser.ts
        │     │     ├── ConfigHelper.ts
        │     │     └── HttpClient/PingOneClient.ts
        │     └── VerifyUser.ts
        │           ├── ConfigHelper.ts
        │           └── HttpClient/PingOneClient.ts
        ├── Commands/RunJSTests.ts
        │     └── HttpClient/HttpClient.ts
        └── Commands/RunPublish.ts
              └── HttpClient/HttpClient.ts

HttpClient/PingOneClient.ts
  ├── HttpClient/PingOneSchemas.ts
  ├── HttpClient/PingOneTypes.ts
  └── Errors.ts

HttpClient/HttpClient.ts
  ├── HttpClient/schemas.ts
  ├── HttpClient/types.ts
  └── Errors.ts
```

### Key Dependencies

- **Commands → HttpClient**: Commands depend on HTTP client functions
- **HttpClient → Schemas**: HTTP clients depend on validation schemas
- **All → Errors**: All modules can throw custom errors
- **Commands → ConfigHelper**: PingOne commands share configuration utilities

---

## Data Flow

### Command Execution Flow

```
User Input
    ↓
CLI Parser (@effect/cli)
    ↓
Command Handler (Commands/)
    ↓
Input Validation
    ↓
Configuration Resolution (env vars + CLI options)
    ↓
HTTP Client Function (HttpClient/)
    ├── yield* RetryService       # Inject retry logic
    ├── yield* CacheService        # Inject caching (reads only)
    └── yield* getApiBaseUrl()     # Get configurable API base URL
    ↓
Request Schema Validation
    ↓
Cache Check (Read Operations Only)
    ├── Cache Hit → Return Cached Response
    └── Cache Miss → Continue
    ↓
HTTP Request (@effect/platform HttpClient)
    ↓
Retry Logic (Automatic)
    ├── Success → Continue
    ├── Transient Error (5xx, 429, network) → Retry with backoff
    └── Permanent Error (4xx) → Fail immediately
    ↓
HTTP Response
    ↓
Response Schema Validation
    ↓
Cache Update (Read Operations Only)
    ↓
Result or Error
    ↓
Console Output
```

### Example: Create User Flow (with Services)

```typescript
// 1. User runs CLI command
$ ping-cli create_user john.doe john@example.com \
    --environment-id env-123 \
    --population-id pop-456

// 2. CLI parser extracts arguments
{ username: "john.doe", email: "john@example.com", ... }

// 3. Command handler validates inputs
validateEmail(email) // Effect<string, PingOneValidationError>
validateUsername(username) // Effect<string, PingOneValidationError>

// 4. Resolve configuration
getEnvironmentId(cliOption) // Effect<string, PingOneAuthError>
getToken(cliOption) // Effect<string, PingOneAuthError>
getApiBaseUrl() // Effect<string> - reads PINGONE_API_URL or defaults

// 5. Build user data payload
{ username, email, population: { id: popId }, ... }

// 6. Call HTTP client with service integration
createPingOneUser({ envId, token, userData })
  // Inside createPingOneUser:
  // - yield* RetryService (inject retry logic)
  // - yield* getApiBaseUrl() (configurable API URL)
  // - Validates request against PingOneCreateUserRequest schema
  // - Makes HTTP POST to ${apiBaseUrl}/environments/${envId}/users
  // - RetryService automatically retries on transient errors (5xx, 429, network)
  // - Validates response against PingOneCreateUserResponse schema
  // Returns Effect<UserResponse, PingOneApiError>

// 7. Handle result
Success: Console.log("User created: {user.id}")
Failure: Console.error("Failed: {error.message}")
  // If transient error, already retried automatically
  // If permanent error (4xx), fails immediately
```

### Example: Read User Flow (with Caching)

```typescript
// 1. User runs CLI command
$ ping-cli read_user user-123

// 2. HTTP client called with caching
readPingOneUser({ envId, token, userId })
  // Inside readPingOneUser:
  // - yield* RetryService (inject retry logic)
  // - yield* CacheService (inject caching)
  // - yield* getApiBaseUrl() (configurable API URL)
  // - Creates HttpClientRequest.get(...)
  // - Calls cache.getCached(req, httpRequest)

// 3. Cache checks for cached response
CacheService.getCached(req, httpRequest)
  // Key: hash of request URL + headers
  // Check users cache (separate from groups, apps, populations)
  // If found and not expired (< 5 min old): return cached response
  // If not found or expired: execute httpRequest with retry

// 4. If cache miss, execute HTTP request
  // - Makes HTTP GET to ${apiBaseUrl}/environments/${envId}/users/${userId}
  // - RetryService retries on transient errors
  // - Validates response schema
  // - Stores response in cache
  // - Returns response

// 5. Result
Cache Hit: Returns immediately without API call
Cache Miss: Makes API call, stores in cache, returns response
```

---

## Error Handling Strategy

### Error Type Hierarchy

```
Effect Errors
├── PingOneAuthError          # Authentication/authorization failures
├── PingOneApiError           # HTTP API errors (4xx, 5xx)
├── PingOneValidationError    # Input validation failures
├── NoGithubToken             # Missing GitHub token
└── WorkflowDispatchError     # GitHub workflow failures
```

### Error Recovery Patterns

#### 1. Specific Error Handling

```typescript
effect.pipe(
  Effect.catchTag("PingOneApiError", (error) => {
    if (error.status === 404) {
      return Effect.succeed(null) // Not found is okay
    }
    return Effect.fail(error) // Re-throw other API errors
  })
)
```

#### 2. Fallback Values

```typescript
readUser(userId).pipe(
  Effect.catchAll(() => Effect.succeed(defaultUser))
)
```

#### 3. Retry with Backoff

```typescript
apiCall.pipe(
  Effect.retry({
    times: 3,
    schedule: Schedule.exponential("100 millis")
  })
)
```

#### 4. Error Transformation

```typescript
Effect.catchAll((error) =>
  Effect.fail(new PingOneValidationError({
    field: "userId",
    message: `Invalid user ID: ${error}`
  }))
)
```

---

## Testing Architecture

### Test Organization

```
src/
  HttpClient/
    PingOneClient.ts
    PingOneClient.test.ts      # Unit tests for client
  Commands/
    PingOne/
      CreateUser.ts
      CreateUser.test.ts        # Integration tests for command
```

### Testing Strategy

#### 1. Unit Tests (HttpClient Layer)

Test individual HTTP client functions with mocked HTTP responses:

```typescript
it.effect("should create user successfully", () =>
  Effect.gen(function* () {
    const mockClient = HttpClient.make((req) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          req,
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            headers: { "content-type": "application/json" }
          })
        )
      )
    )

    const result = yield* createPingOneUser({
      envId: "env-123",
      token: "test-token",
      userData: mockUserData
    }).pipe(
      Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient))
    )

    assert.strictEqual(result.username, "john.doe")
  })
)
```

#### 2. Schema Tests

Validate schema definitions:

```typescript
describe("PingOneCreateUserRequest", () => {
  it("should validate correct user data", () => {
    const validData = {
      username: "test",
      email: "test@example.com",
      population: { id: "pop-123" }
    }

    const result = Schema.decodeUnknownSync(
      PingOneCreateUserRequest
    )(validData)

    expect(result).toEqual(validData)
  })

  it("should reject invalid email", () => {
    const invalidData = {
      username: "test",
      email: "not-an-email",
      population: { id: "pop-123" }
    }

    expect(() =>
      Schema.decodeUnknownSync(PingOneCreateUserRequest)(invalidData)
    ).toThrow()
  })
})
```

#### 3. Error Scenario Tests

Test error handling:

```typescript
it.effect("should fail with PingOneApiError on 401", () =>
  Effect.gen(function* () {
    const mockClient = HttpClient.make((req) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          req,
          new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401
          })
        )
      )
    )

    const result = yield* createPingOneUser({
      envId: "env-123",
      token: "invalid-token",
      userData: mockUserData
    }).pipe(
      Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)),
      Effect.exit
    )

    assert.strictEqual(result._tag, "Failure")
    if (result._tag === "Failure" && result.cause._tag === "Fail") {
      const error = result.cause.error as PingOneApiError
      assert.strictEqual(error._tag, "PingOneApiError")
      assert.strictEqual(error.status, 401)
    }
  })
)
```

### Testing Tools

- **@effect/vitest**: Provides `it.effect` for Effect-based tests
- **assert methods**: Use `assert.strictEqual`, `assert.deepStrictEqual` instead of `expect`
- **Effect.exit**: For testing failure scenarios
- **Mock HttpClient**: Layer-based mocking for HTTP interactions

---

## Future Improvements

### Short-term

1. **Enhanced Error Types**
   - More specific error subtypes (e.g., `RateLimitError`, `ResourceNotFoundError`)
   - Include more detailed retry-after information
   - Add error recovery suggestions

2. **Request/Response Logging**
   - Add structured logging layer
   - Log all HTTP requests/responses
   - Redact sensitive information (tokens, credentials)

3. **Configuration Service**
   - Further centralize configuration logic
   - Provide typed configuration object with validation
   - Support environment profiles (dev, staging, prod)

### Medium-term

1. **Batch Operations Service**
   - Dedicated service for bulk operations
   - Built-in concurrency control with semaphores
   - Progress reporting and streaming results

2. **Circuit Breaker Pattern**
   - Add circuit breaker for failing endpoints
   - Prevent cascading failures
   - Auto-recovery after cooldown period

3. **Performance Monitoring**
   - Track API call latency
   - Monitor error rates and cache hit rates
   - Generate performance reports

### Long-term

1. **Plugin Architecture**
   - Support for custom commands
   - Extensible HTTP client middleware
   - Custom error handlers

2. **Advanced CLI Features**
   - Interactive mode
   - Command history
   - Tab completion

3. **Multi-tenancy Support**
   - Support multiple PingOne environments
   - Profile-based configuration
   - Environment switching

4. **GraphQL Support**
   - Add GraphQL client for future API versions
   - Schema-first development
   - Type generation from GraphQL schema

---

## Architectural Principles

### 1. Separation of Concerns
- Commands handle CLI interaction
- HTTP clients handle API communication
- Schemas handle validation
- Errors handle failure scenarios

### 2. Type Safety First
- Use TypeScript strict mode
- Validate all external data with Schema
- No `any` types or type assertions
- Leverage type inference

### 3. Functional Composition
- Pure functions wherever possible
- Use Effect.gen for composition
- Avoid side effects outside Effect context
- Immutable data structures

### 4. Error Handling
- Use structured error types
- Provide context in errors
- Support error recovery
- Fail fast for unrecoverable errors

### 5. Testability
- Layer-based dependency injection
- Mock HTTP clients in tests
- Test error scenarios
- Achieve high code coverage

---

## Best Practices

### Code Organization
- One module per file
- Group related functionality
- Keep files under 300 lines
- Use barrel exports (`index.ts`)

### Effect Usage
- Use `Effect.gen` for complex flows
- Use `pipe` for simple transformations
- Always use `return yield*` for terminal effects
- Never use try-catch in `Effect.gen`

### Error Handling
- Use `Data.TaggedError` for custom errors
- Provide meaningful error messages
- Include context in error payloads
- Use `Effect.catchTag` for specific errors

### Testing
- Test happy paths and error scenarios
- Use `it.effect` for Effect-based tests
- Mock external dependencies
- Aim for 80%+ code coverage

---

## Resources

- [Effect Documentation](https://effect.website)
- [Effect CLI Documentation](https://effect.website/docs/cli)
- [Effect Platform Documentation](https://effect.website/docs/platform)
- [Effect Schema Documentation](https://effect.website/docs/schema/introduction)
- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/)
- [GitHub REST API Documentation](https://docs.github.com/en/rest)

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines and [CLAUDE.md](../CLAUDE.md) for Effect library patterns.

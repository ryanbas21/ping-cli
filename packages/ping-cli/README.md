# p1-cli

Command-line tool for managing PingOne resources via the PingOne Management API.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
  - [From npm (Recommended)](#from-npm-recommended)
  - [From Source](#from-source)
- [Configuration](#configuration)
  - [Regional API Endpoints](#regional-api-endpoints)
- [Usage](#usage)
  - [User Commands](#user-commands)
  - [Bulk Operations](#bulk-operations)
    - [Bulk Import Users](#bulk-import-users)
    - [Bulk Export Users](#bulk-export-users)
    - [Bulk Delete Users](#bulk-delete-users)
  - [Group Commands](#group-commands)
  - [Population Commands](#population-commands)
  - [Application Commands](#application-commands)
- [Architecture](#architecture)
  - [Service Composition](#service-composition)
  - [Layer Composition](#layer-composition)
  - [HTTP Client Functions](#http-client-functions)
    - [Helper Functions](#helper-functions)
    - [Usage in Client Functions](#usage-in-client-functions)
- [Error Handling](#error-handling)
  - [Error Types](#error-types)
  - [Error Context](#error-context)
- [Development](#development)
  - [Build](#build)
  - [Lint](#lint)
  - [Test](#test)
- [API Documentation](#api-documentation)
- [License](#license)
- [Disclaimer](#disclaimer)

## Features

- **User Management**: Full CRUD operations for PingOne users with verification support
- **Bulk Operations**: Import, export, and delete users in bulk with CSV/JSON support and parallel processing
- **Groups Management**: Create, read, update, delete groups with member management
- **Populations Management**: Complete CRUD operations for managing user populations
- **Applications Management**: Create and manage OAuth/OIDC applications with full lifecycle support
- **Automatic Retry Logic**: Transient error handling with exponential backoff
- **Response Caching**: Configurable caching for read operations to reduce API calls
- **Reusable HTTP Helpers**: Centralized request handling with `executeRequest`, `executeCachedRequest`, and `executeVoidRequest`
- **Type-Safe**: Built with Effect library for robust error handling and type safety
- **Schema Validation**: Request/response validation using Effect Schema
- **Multi-Region Support**: Configurable API base URL for different PingOne regions

## Installation

### From npm (Recommended)

```bash
# Install globally
npm install -g p1-cli

# Or use with npx (no installation required)
npx p1-cli --help
```

### From Source

```bash
# Clone the repository
git clone https://github.com/ryanbas21/ping-cli
cd ping-cli

# Install dependencies
pnpm install

# Build the CLI
pnpm --filter 'p1-cli' build

# Link for local development
cd packages/ping-cli
npm link
```

## Configuration

The CLI uses environment variables for configuration. Create a `.env` file in the project root:

```bash
# Required: PingOne Environment ID
PINGONE_ENV_ID=your-environment-id

# Required: OAuth 2.0 Access Token
PINGONE_TOKEN=your-access-token

# Optional: PingOne API Base URL (defaults to North America)
PINGONE_API_URL=https://api.pingone.com/v1

# Optional: Population ID (can be provided per-command via --population-id)
PINGONE_POPULATION_ID=your-default-population-id
```

### Regional API Endpoints

Set `PINGONE_API_URL` to use different PingOne regions:

- **North America** (default): `https://api.pingone.com/v1`
- **Europe**: `https://api.pingone.eu/v1`
- **Asia Pacific**: `https://api.pingone.asia/v1`
- **Canada**: `https://api.pingone.ca/v1`

## Usage

### User Commands

```bash
# Create a user
p1-cli p1 create_user <username> <email> \
  --environment-id <env-id> \
  --pingone-token <token> \
  --population-id <pop-id> \
  --given-name "John" \
  --family-name "Doe"

# Read a user
p1-cli p1 read_user <user-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# Update a user
p1-cli p1 update_user <user-id> \
  --environment-id <env-id> \
  --pingone-token <token> \
  --email "newemail@example.com"

# Delete a user
p1-cli p1 delete_user <user-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# Verify a user with a verification code
p1-cli p1 verify_user <user-id> <verification-code> \
  --environment-id <env-id> \
  --pingone-token <token>
```

### Bulk Operations

Efficiently manage large numbers of users with bulk operations supporting CSV and JSON formats.

#### Bulk Import Users

Import users from a CSV or JSON file with parallel processing:

```bash
# Import from CSV (default format)
p1-cli p1 bulk_import_users users.csv \
  --environment-id <env-id> \
  --pingone-token <token> \
  --format csv

# Import from JSON
p1-cli p1 bulk_import_users users.json \
  --environment-id <env-id> \
  --pingone-token <token> \
  --format json

# Dry-run mode (preview without creating users)
p1-cli p1 bulk_import_users users.csv \
  --environment-id <env-id> \
  --pingone-token <token> \
  --dry-run

# Control concurrency (default: 5 parallel operations)
p1-cli p1 bulk_import_users users.csv \
  --environment-id <env-id> \
  --pingone-token <token> \
  --concurrency 10
```

**CSV Format Example:**
```csv
username,email,populationId,givenName,familyName,department
john.doe,john@example.com,pop-123,John,Doe,Engineering
jane.smith,jane@example.com,pop-123,Jane,Smith,Sales
```

**JSON Format Example:**
```json
[
  {
    "username": "john.doe",
    "email": "john@example.com",
    "populationId": "pop-123",
    "givenName": "John",
    "familyName": "Doe",
    "department": "Engineering"
  },
  {
    "username": "jane.smith",
    "email": "jane@example.com",
    "populationId": "pop-123",
    "givenName": "Jane",
    "familyName": "Smith",
    "department": "Sales"
  }
]
```

#### Bulk Export Users

Export users to CSV or JSON format:

```bash
# Export all users to CSV
p1-cli p1 bulk_export_users users.csv \
  --environment-id <env-id> \
  --pingone-token <token> \
  --format csv

# Export to JSON
p1-cli p1 bulk_export_users users.json \
  --environment-id <env-id> \
  --pingone-token <token> \
  --format json

# Export with filter
p1-cli p1 bulk_export_users active-users.csv \
  --environment-id <env-id> \
  --pingone-token <token> \
  --filter 'enabled eq true' \
  --limit 1000
```

#### Bulk Delete Users

Delete multiple users from a file containing user IDs:

```bash
# Delete users (requires --confirm flag for safety)
p1-cli p1 bulk_delete_users user-ids.csv \
  --environment-id <env-id> \
  --pingone-token <token> \
  --confirm

# Dry-run mode (preview without deleting)
p1-cli p1 bulk_delete_users user-ids.csv \
  --environment-id <env-id> \
  --pingone-token <token> \
  --dry-run

# Control concurrency for rate limiting
p1-cli p1 bulk_delete_users user-ids.csv \
  --environment-id <env-id> \
  --pingone-token <token> \
  --confirm \
  --concurrency 3
```

**CSV Format for Deletion:**
```csv
userId
abc-123-def
xyz-456-ghi
```

**Bulk Operations Features:**
- **Parallel Processing**: Process multiple operations concurrently (default: 5)
- **Progress Tracking**: Real-time progress updates every 10 operations
- **Error Collection**: Automatic collection and reporting of failures
- **Dry-Run Mode**: Preview operations without making changes
- **Flexible Formats**: Support for both CSV and JSON
- **Rate Limiting**: Configurable concurrency to respect API limits

### Group Commands

```bash
# Create a group
p1-cli p1 groups create_group <name> \
  --environment-id <env-id> \
  --pingone-token <token> \
  --description "Group description"

# Read a group
p1-cli p1 groups read_group <group-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# List all groups
p1-cli p1 groups list_groups \
  --environment-id <env-id> \
  --pingone-token <token> \
  --limit 10

# Update a group
p1-cli p1 groups update_group <group-id> \
  --environment-id <env-id> \
  --pingone-token <token> \
  --name "New Name"

# Delete a group
p1-cli p1 groups delete_group <group-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# Add a member to a group
p1-cli p1 groups add_member <group-id> <user-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# Remove a member from a group
p1-cli p1 groups remove_member <group-id> <user-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# List group members
p1-cli p1 groups list_members <group-id> \
  --environment-id <env-id> \
  --pingone-token <token>
```

### Population Commands

```bash
# Create a population
p1-cli p1 populations create_population <name> \
  --environment-id <env-id> \
  --pingone-token <token> \
  --description "Population description"

# Read a population
p1-cli p1 populations read_population <population-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# List all populations
p1-cli p1 populations list_populations \
  --environment-id <env-id> \
  --pingone-token <token>

# Update a population
p1-cli p1 populations update_population <population-id> \
  --environment-id <env-id> \
  --pingone-token <token> \
  --name "New Name"

# Delete a population
p1-cli p1 populations delete_population <population-id> \
  --environment-id <env-id> \
  --pingone-token <token>
```

### Application Commands

```bash
# Create an application
p1-cli p1 applications create_application <name> \
  --environment-id <env-id> \
  --pingone-token <token> \
  --description "App description" \
  --type "WEB_APP"

# Read an application
p1-cli p1 applications read_application <application-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# List all applications
p1-cli p1 applications list_applications \
  --environment-id <env-id> \
  --pingone-token <token>

# Update an application
p1-cli p1 applications update_application <application-id> \
  --environment-id <env-id> \
  --pingone-token <token> \
  --name "New Name"

# Delete an application
p1-cli p1 applications delete_application <application-id> \
  --environment-id <env-id> \
  --pingone-token <token>
```

## Architecture

### Service Composition

The CLI uses Effect-ts service composition for cross-cutting concerns:

#### RetryService

Automatically retries transient failures with exponential backoff:
- Retries network errors, 5xx server errors, and 429 rate limits
- Respects `Retry-After` header from rate limit responses
- Maximum retry duration: 2 minutes
- Applied to all mutation operations (create, update, delete)

#### CacheService

Caches read operation responses to reduce API calls:
- Per-resource caching (separate caches for users, groups, applications, populations)
- Cache TTL: 5 minutes
- Cache capacity: 100 entries per resource type
- Automatic cache invalidation on mutations
- Applied to all read operations (read, list)

### Layer Composition

Services are provided via Effect's Layer system in `src/main.ts`:

```typescript
const layers = Layer.mergeAll(
  NodeHttpClient.layer,
  NodeContext.layer,
  RetryServiceLive,
  CacheServiceLive
)
```

### HTTP Client Functions

All HTTP client functions (`src/HttpClient/*Client.ts`) use reusable helper functions from `src/HttpClient/helpers.ts` that encapsulate common patterns:

#### Helper Functions

**executeRequest** - Standard HTTP requests with schema validation:
```typescript
export const executeRequest = <A, I, R>(
  request: HttpClientRequest.HttpClientRequest,
  responseSchema: Schema.Schema<A, I, R>
): Effect.Effect<
  A,
  PingOneApiError | HttpClientError.HttpClientError | ParseResult.ParseError,
  HttpClient.HttpClient | RetryService | R
>
```

**executeCachedRequest** - GET requests with automatic caching:
```typescript
export const executeCachedRequest = <A, I, R>(
  request: HttpClientRequest.HttpClientRequest,
  responseSchema: Schema.Schema<A, I, R>
): Effect.Effect<
  A,
  PingOneApiError | HttpClientError.HttpClientError | ParseResult.ParseError,
  HttpClient.HttpClient | RetryService | CacheService | R
>
```

**executeVoidRequest** - DELETE/POST operations returning void:
```typescript
export const executeVoidRequest = (
  request: HttpClientRequest.HttpClientRequest
): Effect.Effect<
  HttpClientResponseType.HttpClientResponse,
  PingOneApiError | HttpClientError.HttpClientError,
  HttpClient.HttpClient | RetryService
>
```

#### Usage in Client Functions

**Create operations (mutation with schema validation):**
```typescript
export const createPopulation = <S extends Schema.Schema.Type<typeof CreatePopulationRequestSchema>>(
  { envId, token, populationData }: { envId: string; token: string; populationData: S }
) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/populations`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(CreatePopulationRequestSchema)(populationData)
    )

    return yield* executeRequest(request, PopulationSchema)
  })
```

**Read operations (cached with schema validation):**
```typescript
export const readPopulation = ({
  envId,
  token,
  populationId
}: {
  envId: string
  token: string
  populationId: string
}) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.get(
      `${apiBaseUrl}/environments/${envId}/populations/${populationId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeCachedRequest(request, PopulationSchema)
  })
```

**Delete operations (void response):**
```typescript
export const deletePopulation = ({
  envId,
  token,
  populationId
}: {
  envId: string
  token: string
  populationId: string
}) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.del(
      `${apiBaseUrl}/environments/${envId}/populations/${populationId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    yield* executeVoidRequest(request)
    return undefined
  })
```

**Benefits of Helper Functions:**
- **Code Reduction**: Eliminated 535+ lines of duplicated code across client files
- **Consistent Error Handling**: Centralized error handling for HTTP operations
- **Automatic Retry Logic**: Built-in retry with exponential backoff
- **Type Safety**: Full type inference and error type unions
- **Maintainability**: Changes to HTTP patterns require updates in one place

## Error Handling

The CLI uses structured error types for comprehensive error information:

### Error Types

- **`PingOneAuthError`**: Authentication failures (missing tokens, invalid credentials)
- **`PingOneApiError`**: API errors with status code, error code, and request ID
- **`PingOneValidationError`**: Input validation errors with field and constraint details
- **`NetworkError`**: Network connectivity issues with retry information
- **`RateLimitError`**: Rate limit errors with retry-after timing

### Error Context

All errors include context for debugging:

```typescript
{
  message: "Human-readable error message",
  cause: "Detailed cause description",
  context: {
    environmentId: "abc123",
    accessTokenProvided: true
  }
}
```

## Development

### Build

```bash
# Build TypeScript to JavaScript
pnpm build

# Type-check without building
pnpm tsc --noEmit
```

### Lint

```bash
# Run ESLint
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

### Test

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## API Documentation

For detailed API documentation, see:
- [API Reference](../../docs/API.md)
- [Architecture Guide](../../docs/ARCHITECTURE.md)

## License

ISC

## Disclaimer

⚠️ **IMPORTANT**: This is completely unsupported and is NOT an official release of a Ping product. This tool is provided as-is for development and testing purposes only. Use at your own risk.

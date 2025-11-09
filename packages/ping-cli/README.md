# ping-cli

Command-line tool for managing PingOne resources via the PingOne Management API.

## Features

- **User Management**: Full CRUD operations for PingOne users with verification support
- **Groups Management**: Create, read, update, delete groups with member management
- **Populations Management**: Complete CRUD operations for managing user populations
- **Applications Management**: Create and manage OAuth/OIDC applications with full lifecycle support
- **Automatic Retry Logic**: Transient error handling with exponential backoff
- **Response Caching**: Configurable caching for read operations to reduce API calls
- **Type-Safe**: Built with Effect library for robust error handling and type safety
- **Schema Validation**: Request/response validation using Effect Schema
- **Multi-Region Support**: Configurable API base URL for different PingOne regions

## Installation

```bash
# Install from the monorepo root
pnpm install

# Build the CLI
pnpm --filter 'ping-cli' build
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
ping-cli create_user <username> <email> \
  --population-id <pop-id> \
  --given-name "John" \
  --family-name "Doe"

# Read a user
ping-cli read_user <user-id>

# Update a user
ping-cli update_user <user-id> '{"email": "newemail@example.com"}'

# Delete a user
ping-cli delete_user <user-id>

# Verify a user with a verification code
ping-cli verify_user <user-id> <verification-code>
```

### Group Commands

```bash
# Create a group
ping-cli groups create <name> --description "Group description"

# Read a group
ping-cli groups read <group-id>

# List all groups
ping-cli groups list --limit 10

# Update a group
ping-cli groups update <group-id> '{"name": "New Name"}'

# Delete a group
ping-cli groups delete <group-id>

# Add a member to a group
ping-cli groups add_member <group-id> <user-id>

# Remove a member from a group
ping-cli groups remove_member <group-id> <user-id>

# List group members
ping-cli groups list_members <group-id>
```

### Population Commands

```bash
# Create a population
ping-cli populations create <name> --description "Population description"

# Read a population
ping-cli populations read <population-id>

# List all populations
ping-cli populations list

# Update a population
ping-cli populations update <population-id> '{"name": "New Name"}'

# Delete a population
ping-cli populations delete <population-id>
```

### Application Commands

```bash
# Create an application
ping-cli applications create <name> <type> --description "App description"

# Read an application
ping-cli applications read <application-id>

# List all applications
ping-cli applications list

# Update an application
ping-cli applications update <application-id> '{"name": "New Name"}'

# Delete an application
ping-cli applications delete <application-id>
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

All HTTP client functions (`src/HttpClient/*Client.ts`) use the services:

**Mutation operations:**
```typescript
export const createUser = (payload) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = /* HTTP request logic */

    return yield* retry.retryableRequest(httpRequest)
  })
```

**Read operations:**
```typescript
export const readUser = (payload) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const cache = yield* CacheService
    const apiBaseUrl = yield* getApiBaseUrl()

    const req = /* HTTP request setup */
    const httpRequest = /* HTTP execution logic */

    return yield* cache.getCached(req, retry.retryableRequest(httpRequest))
  })
```

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

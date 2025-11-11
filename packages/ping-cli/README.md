# p1-cli

Command-line tool for managing PingOne resources via the PingOne Management API.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
  - [From npm (Recommended)](#from-npm-recommended)
  - [From Source](#from-source)
- [Authentication](#authentication)
  - [Quick Start (OAuth)](#quick-start-oauth)
  - [Authentication Methods](#authentication-methods)
  - [CI/CD Integration](#cicd-integration)
- [Configuration](#configuration)
  - [Regional API Endpoints](#regional-api-endpoints)
- [Usage](#usage)
  - [Authentication Commands](#authentication-commands)
  - [Environment Commands](#environment-commands)
  - [User Commands](#user-commands)
  - [User Status Management](#user-status-management)
  - [Password Management](#password-management)
  - [MFA Operations](#mfa-operations)
  - [Session Management](#session-management)
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

- **OAuth 2.0 Authentication**: Secure client credentials flow with automatic token management and refresh
- **Cross-Platform Credential Storage**: System keychain integration (macOS, Windows, Linux) with encrypted file fallback
- **User Management**: Full CRUD operations for PingOne users with verification and listing support
- **User Status Management**: Enable, disable, lock, and unlock user accounts
- **Password Management**: Set, reset, and recover user passwords with admin and self-service flows
- **MFA Operations**: Enable/disable MFA, list and delete MFA devices for users
- **Session Management**: List active sessions and revoke specific user sessions
- **Bulk Operations**: Import, export, and delete users in bulk with CSV/JSON support and parallel processing
- **Groups Management**: Create, read, update, delete groups with member management
- **Populations Management**: Complete CRUD operations for managing user populations
- **Applications Management**: Create and manage OAuth/OIDC applications with full lifecycle support
- **Environments Management**: List and read PingOne environments to discover environment IDs
- **Automatic Retry Logic**: Transient error handling with exponential backoff
- **Response Caching**: Configurable caching for read operations to reduce API calls
- **Reusable HTTP Helpers**: Centralized request handling with `executeRequest`, `executeCachedRequest`, and `executeVoidRequest`
- **Type-Safe**: Built with Effect library for robust error handling and type safety
- **Schema Validation**: Request/response validation using Effect Schema
- **Multi-Region Support**: Configurable API base URL for different PingOne regions
- **CI/CD Ready**: Environment variable support for automated workflows

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

### System Requirements

**Node.js**: Version 18.x or higher recommended

**Optional: Native Keychain Support** (for secure credential storage)

The CLI uses [keytar](https://github.com/atom/node-keytar) for secure credential storage in system keychains:
- **macOS**: Keychain Access (built-in)
- **Windows**: Credential Manager (built-in)
- **Linux**: Secret Service API (requires `libsecret`)

**Installing on Linux** (for keychain support):
```bash
# Debian/Ubuntu
sudo apt-get install libsecret-1-dev

# Red Hat/Fedora
sudo yum install libsecret-devel

# Arch Linux
sudo pacman -S libsecret
```

**Note**: If keytar is unavailable or keychain access fails, the CLI automatically falls back to:
1. **Encrypted file storage** (`~/.ping-cli/credentials.enc`) - Suitable for development/testing
2. **Environment variables** - For CI/CD environments

See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed credential storage information.

## Authentication

The PingOne CLI supports OAuth 2.0 Client Credentials flow for secure, automatic token management.

### Quick Start (OAuth)

1. **Create a Worker Application** in PingOne ([detailed setup guide](./OAUTH_SETUP.md))
2. **Authenticate the CLI**:

```bash
p1-cli auth login \
  --client-id="your-client-id" \
  --client-secret="your-client-secret" \
  --environment-id="your-environment-id" \
  --region="com"
```

Or use interactive mode (CLI will prompt for missing values):

```bash
p1-cli auth login
```

3. **Verify authentication**:

```bash
p1-cli auth status
```

4. **Use the CLI** (tokens are managed automatically):

```bash
p1-cli users list --environment-id="your-env-id"
```

For complete setup instructions including PingOne Worker Application configuration, see [OAUTH_SETUP.md](./OAUTH_SETUP.md).

### Authentication Methods

The CLI supports three authentication methods with automatic fallback priority:

#### 1. OAuth Client Credentials (Recommended)

Store credentials once, tokens are managed automatically:

```bash
# Store credentials
p1-cli auth login --client-id="..." --client-secret="..." --environment-id="..." --region="com"

# Use CLI commands (no token needed)
p1-cli users list --environment-id="your-env-id"
```

**Benefits:**
- Automatic token refresh
- Secure credential storage (system keychain)
- No manual token management
- Best for interactive use

#### 2. Environment Variables

Set credentials via environment variables for CI/CD:

```bash
# For OAuth (preferred)
export PINGONE_CLIENT_ID="your-client-id"
export PINGONE_CLIENT_SECRET="your-client-secret"
export PINGONE_ENV_ID="your-environment-id"

# Legacy: Direct token (still supported)
export PINGONE_TOKEN="your-access-token"
export PINGONE_ENV_ID="your-environment-id"

# Use CLI
p1-cli users list
```

**Benefits:**
- No interactive login required
- Perfect for CI/CD pipelines
- Environment-specific credentials

#### 3. CLI Flags

Provide authentication per-command:

```bash
p1-cli users list \
  --environment-id="your-env-id" \
  --pingone-token="your-access-token"
```

**Benefits:**
- No stored credentials
- Useful for one-off commands
- Backward compatible

### Authentication Priority

The CLI checks authentication in this order:

1. `--pingone-token` CLI flag (if provided)
2. `PINGONE_TOKEN` environment variable
3. OAuth service (stored credentials from `auth login`)

If none are available, the CLI will prompt you to run `p1-cli auth login`.

### CI/CD Integration

For automated environments (GitHub Actions, GitLab CI, etc.):

```yaml
# Example: GitHub Actions
env:
  PINGONE_CLIENT_ID: ${{ secrets.PINGONE_CLIENT_ID }}
  PINGONE_CLIENT_SECRET: ${{ secrets.PINGONE_CLIENT_SECRET }}
  PINGONE_ENV_ID: ${{ secrets.PINGONE_ENV_ID }}

steps:
  - name: List Users
    run: p1-cli users list
```

**Security Best Practices:**
- Store credentials in CI/CD secrets (never in code)
- Use separate Worker Applications per environment
- Rotate credentials regularly
- Grant minimum required permissions

## Configuration

Optional configuration via environment variables:

```bash
# Optional: PingOne API Base URL (defaults to North America)
PINGONE_API_URL=https://api.pingone.com/v1

# Optional: Default population ID
PINGONE_POPULATION_ID=your-default-population-id
```

### Regional API Endpoints

The CLI automatically configures the correct API endpoint based on the region you specify during `auth login`. You can also override it manually:

- **North America** (default): `https://api.pingone.com/v1`
- **Europe**: `https://api.pingone.eu/v1`
- **Asia Pacific**: `https://api.pingone.asia/v1`
- **Canada**: `https://api.pingone.ca/v1`

## Usage

### Authentication Commands

Manage OAuth authentication and view authentication status:

```bash
# Login with OAuth client credentials
p1-cli auth login \
  --client-id="your-client-id" \
  --client-secret="your-client-secret" \
  --environment-id="your-environment-id" \
  --region="com"

# Login with interactive prompts
p1-cli auth login

# Check authentication status
p1-cli auth status

# Logout (clear stored credentials)
p1-cli auth logout
```

**Authentication Status Output:**

```text
✓ Authenticated

Client ID: 12345678****abcd
Environment: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

✓ Access token is valid
  Expires: 1/10/2025, 3:30:00 PM
```

### Environment Commands

Discover and manage PingOne environments. These commands help you find your environment ID, which is required for other CLI operations.

```bash
# List all environments your token has access to
p1-cli p1 environments list_environments \
  --pingone-token <token>

# List environments with pagination
p1-cli p1 environments list_environments \
  --pingone-token <token> \
  --limit 10

# List environments with filter (production only)
p1-cli p1 environments list_environments \
  --pingone-token <token> \
  --filter 'type eq "PRODUCTION"'

# List environments with filter (sandbox only)
p1-cli p1 environments list_environments \
  --pingone-token <token> \
  --filter 'type eq "SANDBOX"'

# List environments by region
p1-cli p1 environments list_environments \
  --pingone-token <token> \
  --filter 'region eq "NA"'

# List environments by name (contains)
p1-cli p1 environments list_environments \
  --pingone-token <token> \
  --filter 'name sw "Dev"'

# Read a specific environment by ID
p1-cli p1 environments read_environment <environment-id> \
  --pingone-token <token>
```

**Filter Operators:**
- `eq` - Equals (exact match)
- `ne` - Not equals
- `sw` - Starts with
- `ew` - Ends with
- `co` - Contains
- `and` - Logical AND
- `or` - Logical OR

**Pagination Limitations:**
- The `--limit` parameter controls the maximum number of results returned in a single request
- Currently, cursor-based pagination for fetching additional pages is not supported
- If your organization has more environments than the limit specified, only the first N results will be returned
- To retrieve all environments when you have many, you may need to use filtering to narrow results
- Results are cached for 5 minutes to improve performance and reduce API load

**Note:** Environment commands only require a `--pingone-token` (not an `--environment-id`) since they operate at the organization level.

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

# List users with optional filtering
p1-cli p1 list_users \
  --environment-id <env-id> \
  --pingone-token <token> \
  --limit 20 \
  --filter 'email eq "john@example.com"'
```

### User Status Management

Control user account status and authentication capabilities:

```bash
# Enable a user account
p1-cli p1 enable_user <user-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# Disable a user account
p1-cli p1 disable_user <user-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# Lock a user account (prevents authentication)
p1-cli p1 lock_user <user-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# Unlock a user account (allows authentication)
p1-cli p1 unlock_user <user-id> \
  --environment-id <env-id> \
  --pingone-token <token>
```

**Note:** Lock/unlock controls the `account.canAuthenticate` flag, while enable/disable controls the `enabled` flag.

### Password Management

Manage user passwords with set, reset, and recovery operations:

```bash
# Set a user's password directly (admin operation)
p1-cli p1 set_password <user-id> <password> \
  --environment-id <env-id> \
  --pingone-token <token>

# Set password and force change on next login
p1-cli p1 set_password <user-id> <password> \
  --environment-id <env-id> \
  --pingone-token <token> \
  --force-change

# Reset password (admin-initiated, sends reset email)
p1-cli p1 reset_password <email> \
  --environment-id <env-id> \
  --pingone-token <token>

# Recover password (self-service, sends recovery email)
p1-cli p1 recover_password <email> \
  --environment-id <env-id> \
  --pingone-token <token>
```

**Note:**
- `set_password` - Direct password change by administrator
- `reset_password` - Admin-initiated password reset flow (sends email)
- `recover_password` - Self-service password recovery flow (sends email)

### MFA Operations

Manage multi-factor authentication for users:

```bash
# Enable MFA for a user
p1-cli p1 enable_mfa <user-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# Disable MFA for a user
p1-cli p1 disable_mfa <user-id> \
  --environment-id <env-id> \
  --pingone-token <token>

# List MFA devices for a user
p1-cli p1 list_mfa_devices <user-id> \
  --environment-id <env-id> \
  --pingone-token <token> \
  --limit 10

# Delete a specific MFA device
p1-cli p1 delete_mfa_device <user-id> <device-id> \
  --environment-id <env-id> \
  --pingone-token <token>
```

### Session Management

Manage and monitor user sessions:

```bash
# List active sessions for a user
p1-cli p1 list_sessions <user-id> \
  --environment-id <env-id> \
  --pingone-token <token> \
  --limit 10

# Revoke a specific session
p1-cli p1 revoke_session <user-id> <session-id> \
  --environment-id <env-id> \
  --pingone-token <token>
```

**Note:** Session management is useful for security operations like force logout or investigating active sessions.

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

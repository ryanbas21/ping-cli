# p1-cli

## 0.3.0

### Minor Changes

- [#15](https://github.com/ryanbas21/ping-cli/pull/15) [`215666a`](https://github.com/ryanbas21/ping-cli/commit/215666a67daf76d8d14dfd4cb5a24ad1264b381c) Thanks [@ryanbas21](https://github.com/ryanbas21)! - refactor a lot of code to be more effectful, use new modules, add features and schemas

- [#15](https://github.com/ryanbas21/ping-cli/pull/15) [`215666a`](https://github.com/ryanbas21/ping-cli/commit/215666a67daf76d8d14dfd4cb5a24ad1264b381c) Thanks [@ryanbas21](https://github.com/ryanbas21)! - **BREAKING CHANGE (pre-1.0)**: CacheService now requires schema validation for all cached values

  CacheService.getCached() now requires a schema parameter for improved type safety:

  - **BREAKING**: Schema parameter is now required (was optional)
  - Validates all cached data at runtime to ensure type correctness
  - Automatically invalidates and recomputes corrupted cache entries
  - Protects against cache corruption and API version mismatches
  - Eliminates unsafe type assertions (removed `as A` cast)

  **Note**: This is a breaking change in a pre-1.0 package. Per semver, breaking changes in pre-1.0 versions are acceptable as minor releases.

  **Migration Guide:**

  ```typescript
  // Before (schema was optional):
  cache.getCached(request, compute);

  // After (schema is required):
  cache.getCached(request, compute, responseSchema);

  // For arbitrary data, use Schema.Unknown:
  cache.getCached(request, compute, Schema.Unknown);
  ```

  Additional improvements:

  - CredentialService: Added explicit scrypt parameters (N=16384, r=8, p=1, maxmem=32MB) for improved security
  - Enhanced CacheService documentation with required schema validation
  - Updated all examples to include schema parameter

## 0.3.0

### Major Changes

- **BREAKING CHANGE**: CacheService now requires schema validation for all cached values

  CacheService.getCached() now requires a schema parameter for improved type safety:

  - **BREAKING**: Schema parameter is now required (was optional)
  - Validates all cached data at runtime to ensure type correctness
  - Automatically invalidates and recomputes corrupted cache entries
  - Protects against cache corruption and API version mismatches
  - Eliminates unsafe type assertions (removed `as A` cast)

  **Migration Guide:**

  ```typescript
  // Before (schema was optional):
  cache.getCached(request, compute);

  // After (schema is required):
  cache.getCached(request, compute, responseSchema);

  // For arbitrary data, use Schema.Unknown:
  cache.getCached(request, compute, Schema.Unknown);
  ```

  Additional P0 security improvements:

  - CredentialService: Added explicit scrypt parameters (N=16384, r=8, p=1, maxmem=32MB)

  Updated documentation:

  - Fixed license from ISC to MIT to match package.json
  - Enhanced CacheService documentation with required schema validation
  - Updated all examples to include schema parameter

## 0.2.0

### Minor Changes

- [#10](https://github.com/ryanbas21/ping-cli/pull/10) [`94ba07d`](https://github.com/ryanbas21/ping-cli/commit/94ba07d3c4aaefed99d24e951caf5fd7d9d054d5) Thanks [@ryanbas21](https://github.com/ryanbas21)! - Add OAuth 2.0 client credentials authentication with automatic token management.

  ## New Features

  - **OAuth Authentication**: Secure OAuth 2.0 Client Credentials flow with automatic token refresh and 5-minute expiration buffer
  - **Cross-Platform Credential Storage**: System keychain integration (macOS Keychain Access, Windows Credential Manager, Linux Secret Service) with AES-256-GCM encrypted file fallback
  - **Three-Tier Authentication Priority**: CLI flag → environment variables → OAuth service with automatic fallback
  - **Multi-Region Support**: North America, Europe, Asia Pacific, Canada

  ## New Commands

  - `auth login`: Store OAuth client credentials securely (supports interactive prompts)
  - `auth logout`: Clear stored credentials and cached tokens
  - `auth status`: View authentication status and token validity

  ## New Services

  - **OAuthService**: Token lifecycle management with automatic caching and refresh
  - **CredentialService**: Cross-platform secure credential storage

  ## Documentation

  - **OAUTH_SETUP.md**: Complete setup guide for PingOne Worker Application configuration
  - **README.md**: Updated with OAuth quick start and authentication methods

  ## Backward Compatibility

  - Existing token-based authentication (`--pingone-token`, `PINGONE_TOKEN`) continues to work
  - No breaking changes to existing commands
  - Automatic fallback ensures smooth migration path

## 0.1.0

### Minor Changes

- [#5](https://github.com/ryanbas21/ping-cli/pull/5) [`0cdbac1`](https://github.com/ryanbas21/ping-cli/commit/0cdbac132ffe0bcee78a819e0a60a490975c2dcd) Thanks [@ryanbas21](https://github.com/ryanbas21)! - Add environment management commands for discovering environment IDs

  **New Commands:**

  - `p1-cli p1 environments list_environments`: List all accessible environments
  - `p1-cli p1 environments read_environment`: Read specific environment details

  **Features:**

  - List environments with pagination (`--limit`) and filtering (`--filter`)
  - Discover environment IDs without needing prior knowledge
  - Read environment details including name, type, region, and license info
  - Commands operate at organization level (no `--environment-id` required)
  - Automatic response caching with 5-minute TTL for GET operations

  **HTTP Client:**

  - New `EnvironmentClient.ts` with `listEnvironments` and `readEnvironment` functions
  - Uses `executeCachedRequest` helper for efficient API calls
  - Full schema validation with `EnvironmentSchemas.ts`

  **Testing:**

  - 5 comprehensive tests for EnvironmentClient (all passing)
  - 3 smoke tests for environment commands (all passing)
  - Full integration with existing test infrastructure

  **Documentation:**

  - Updated README with Environment Commands section
  - Added feature to Features list
  - Included usage examples with pagination and filtering

### Patch Changes

- [#2](https://github.com/ryanbas21/ping-cli/pull/2) [`c19356a`](https://github.com/ryanbas21/ping-cli/commit/c19356a5d8b89594634b3678ca1fe9fa4100e99b) Thanks [@ryanbas21](https://github.com/ryanbas21)! - Code quality improvements: Remove type assertions and eliminate HTTP duplication

  **CacheService Type Safety:**

  - Removed all 6 instances of `as unknown` type assertions
  - Properly typed cache with generic `CachedResponse` type
  - Full type safety throughout cache implementation

  **HTTP Request Helpers:**

  - Created reusable helpers in `src/HttpClient/helpers.ts`:
    - `executeRequest`: Standard HTTP requests with schema validation
    - `executeCachedRequest`: GET requests with automatic caching
    - `executeVoidRequest`: DELETE/POST operations returning void
  - Helpers use proper Effect combinators (`Effect.flatMap`, `Effect.if`) and pipe composition
  - Centralized error handling and retry logic

  **Client Refactoring:**
  Refactored all HTTP client files to use the new helpers:

  - **PingOneClient.ts**: 851 → 628 lines (223 lines saved, 26.2% reduction)
  - **GroupClient.ts**: 436 → 302 lines (134 lines saved, 30.7% reduction)
  - **ApplicationClient.ts**: 283 → 194 lines (89 lines saved, 31.4% reduction)
  - **PopulationClient.ts**: 283 → 194 lines (89 lines saved, 31.4% reduction)

  **Total Impact:**

  - **535 lines of duplicated code eliminated** across 4 client files
  - **Average 30% reduction** in client file size
  - All 166 tests passing
  - Zero new linting errors introduced
  - Improved maintainability and consistency

## 0.0.1

### Patch Changes

- [`44d5d43`](https://github.com/ryanbas21/ping-cli/commit/44d5d439db73a5b82b5955a1365ee73648affc53) Thanks [@ryanbas21](https://github.com/ryanbas21)! - Initial npm release of PingOne CLI - a comprehensive command-line tool for managing PingOne resources via the PingOne Management API.

  ## Features

  - **User Management**: Full CRUD operations for PingOne users with verification support
  - **Bulk Operations**: Import, export, and delete users in bulk with CSV/JSON support and parallel processing
  - **Groups Management**: Create, read, update, delete groups with member management
  - **Populations Management**: Complete CRUD operations for managing user populations
  - **Applications Management**: Create and manage OAuth/OIDC applications with full lifecycle support
  - **Automatic Retry Logic**: Transient error handling with exponential backoff
  - **Response Caching**: Configurable caching for read operations to reduce API calls
  - **Type-Safe**: Built with Effect library for robust error handling and type safety
  - **Schema Validation**: Request/response validation using Effect Schema
  - **Multi-Region Support**: Configurable API base URL for different PingOne regions

  ## Bulk Operations

  New bulk operations feature for efficient management of large user datasets:

  - **Bulk Import**: Import users from CSV or JSON files with parallel processing
  - **Bulk Export**: Export users to CSV or JSON format with filtering support
  - **Bulk Delete**: Delete multiple users from a file with safety confirmation
  - **Parallel Processing**: Configurable concurrency (default: 5 parallel operations)
  - **Progress Tracking**: Real-time progress updates every 10 operations
  - **Dry-Run Mode**: Preview operations without making changes
  - **Error Collection**: Automatic collection and reporting of failures
  - **Flexible Formats**: Support for both CSV and JSON file formats

  ## Available Commands

  Total of 26+ commands organized by resource type:

  - **User Operations** (5 commands): `create_user`, `read_user`, `update_user`, `delete_user`, `verify_user`
  - **Bulk Operations** (3 commands): `bulk_import_users`, `bulk_export_users`, `bulk_delete_users`
  - **Groups** (8 commands): `create_group`, `read_group`, `list_groups`, `update_group`, `delete_group`, `add_member`, `remove_member`, `list_members`
  - **Populations** (5 commands): `create_population`, `read_population`, `list_populations`, `update_population`, `delete_population`
  - **Applications** (5 commands): `create_application`, `read_application`, `list_applications`, `update_application`, `delete_application`

  All commands support:

  - Environment variable configuration via `.env` file
  - CLI flags and options
  - Comprehensive error handling with structured error types
  - Pagination and filtering on list operations

  ## Package Quality

  - **166 comprehensive tests** with full coverage
  - **TypeScript strict mode** enabled
  - **Clean package output** - no test files or development artifacts
  - **MIT License** for open source usage
  - **Proper npm metadata** - repository, bugs, homepage links
  - **Latest Effect dependencies** (v3.19.3)
  - **Automated executable permissions** for CLI binary
  - **Configuration template** included (.env.example)

  ## Installation

  ```bash
  # Install globally
  npm install -g p1-cli

  # Or use with npx
  npx p1-cli --help
  ```

  ## Documentation

  The package includes:

  - Comprehensive README with usage examples
  - Bulk operations documentation with CSV/JSON format examples
  - Configuration guide with multi-region support
  - API endpoint documentation
  - Error handling patterns

  ***

  **IMPORTANT DISCLAIMER**: This is completely unsupported and is NOT an official release of a Ping product. This tool is provided as-is for development and testing purposes only. Use at your own risk.

## 0.0.0-20251109153621

### Patch Changes

- [`44d5d43`](https://github.com/ryanbas21/ping-cli/commit/44d5d439db73a5b82b5955a1365ee73648affc53) Thanks [@ryanbas21](https://github.com/ryanbas21)! - Initial release of PingOne SDK CI CLI - a comprehensive command-line tool for managing PingOne resources.

  ## Features

  - **User Management**: Full CRUD operations for PingOne users with verification support
  - **Groups Management**: Create, read, update, delete groups with member management (add/remove members, list members)
  - **Populations Management**: Complete CRUD operations for managing user populations
  - **Applications Management**: Create and manage OAuth/OIDC applications with full lifecycle support
  - **GitHub Workflow Integration**: Trigger CI and publish workflows for the Ping JavaScript SDK
  - **Type-Safe**: Built with Effect library for robust error handling and type safety
  - **Schema Validation**: Request/response validation using Effect Schema
  - **Functional Programming**: Leverages Effect's functional programming patterns for reliability

  ## Available Commands

  - 26 total CLI commands across Users, Groups, Populations, and Applications
  - All commands support environment variable configuration and CLI flags
  - Comprehensive error handling with structured error types
  - Support for pagination and filtering on list operations

  ## Testing & Quality

  - 148 comprehensive tests with full coverage
  - TypeScript strict mode enabled
  - Effect library patterns throughout
  - Automated CI/CD pipeline

  ***

  **IMPORTANT DISCLAIMER**: This is completely unsupported and is NOT an official release of a Ping product. This tool is provided as-is for development and testing purposes only. Use at your own risk.

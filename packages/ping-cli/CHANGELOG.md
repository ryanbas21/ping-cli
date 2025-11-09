# p1-cli

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

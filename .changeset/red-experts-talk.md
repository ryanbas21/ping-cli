---
"p1-cli": patch
---

Initial release of PingOne SDK CI CLI - a comprehensive command-line tool for managing PingOne resources.

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

---

**IMPORTANT DISCLAIMER**: This is completely unsupported and is NOT an official release of a Ping product. This tool is provided as-is for development and testing purposes only. Use at your own risk.

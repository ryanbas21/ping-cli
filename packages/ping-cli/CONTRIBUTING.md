# Contributing to p1-cli

Thank you for your interest in contributing to the PingOne CLI! This document provides guidelines and information for developers working on this project.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Build and Test](#build-and-test)
- [Code Quality](#code-quality)
- [Architecture](#architecture)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)

## Development Setup

### Prerequisites

- **Node.js**: Version 18.x or higher
- **pnpm**: Package manager (v10.12.1 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/ryanbas21/ping-cli
cd ping-cli

# Install dependencies
pnpm install

# Build the CLI
pnpm --filter p1-cli build

# Link for local development (optional)
cd packages/ping-cli
npm link
```

## Project Structure

```text
packages/ping-cli/
├── src/
│   ├── Commands/        # CLI command definitions
│   │   └── PingOne/    # PingOne-specific commands
│   ├── HttpClient/      # HTTP client functions and schemas
│   ├── Services/        # Effect services (OAuth, Cache, Retry, etc.)
│   ├── Errors.ts        # Error types
│   ├── PingCommand.ts   # Main CLI command composition
│   └── main.ts          # Application entry point
├── dist/                # Compiled JavaScript output
├── tests/               # Test files
└── package.json
```

## Build and Test

### Building

```bash
# Build TypeScript to JavaScript
pnpm --filter p1-cli build

# Type-check without building
pnpm --filter p1-cli tsc
```

### Testing

```bash
# Run all tests
pnpm --filter p1-cli test

# Run tests in watch mode
pnpm --filter p1-cli test:watch

# Run tests with coverage
pnpm --filter p1-cli test:coverage
```

### Linting

```bash
# Run ESLint
pnpm --filter p1-cli lint

# Auto-fix linting issues
pnpm --filter p1-cli lint:fix
```

## Code Quality

### Standards

- **TypeScript**: All code must be TypeScript with proper type annotations
- **Effect Library**: Use Effect patterns for error handling, composition, and services
- **Functional Programming**: Prefer pure functions and immutable data structures
- **No Hardcoding**: Configuration should come from environment variables or package.json

### Testing Requirements

- All new features must include tests
- Use `@effect/vitest` for Effect-based code
- Maintain or improve code coverage
- Test both success and error cases

## Architecture

### Service Composition

The CLI uses Effect-ts wrapper layer pattern for cross-cutting concerns:

**Retry Logic (HttpClientWithRetry)**
- Automatically retries transient failures
- Retries: Network errors, 5xx server errors, and 429 rate limits
- Respects `Retry-After` header from rate limit responses
- Applied to all HTTP requests automatically

**Caching (CacheService)**
- Caches read operation responses with runtime type safety
- Per-resource caching with 5-minute TTL
- Automatic cache invalidation on mutations
- Runtime schema validation for cached values

### HTTP Client Patterns

All HTTP client functions use reusable helper functions from `src/HttpClient/helpers.ts`:

- **`executeRequest`** - Standard HTTP requests with schema validation
- **`executeCachedRequest`** - Cached GET requests with schema validation
- **`executeVoidRequest`** - DELETE/POST operations returning void

For detailed architecture documentation, see [../../docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).

## Making Changes

### Creating New Commands

1. Create command file in `src/Commands/PingOne/`
2. Define command using `@effect/cli` Command API
3. Add command to `src/PingCommand.ts` command list
4. Write tests in corresponding `.test.ts` file
5. Update README usage examples if needed

### Adding HTTP Client Functions

1. Create or update client in `src/HttpClient/`
2. Define schemas in corresponding `*Schemas.ts` file
3. Use helper functions (`executeRequest`, `executeCachedRequest`, `executeVoidRequest`)
4. Write comprehensive tests
5. Document function with JSDoc comments

### Error Handling

Use structured error types from `src/Errors.ts`:

```typescript
import { PingOneApiError } from "../Errors.js"

// Failing with structured error
return yield* Effect.fail(
  new PingOneApiError({
    status: response.status,
    message: "Descriptive error message"
  })
)
```

## Submitting Changes

### Commit Messages

Follow conventional commit format:

```text
feat: add bulk user export command
fix: correct token refresh logic
docs: update authentication examples
refactor: simplify HTTP client helpers
test: add tests for group commands
```

### Pull Request Process

1. **Create a feature branch**: `git checkout -b feature/my-feature`
2. **Make your changes** with tests
3. **Run quality checks**:
   ```bash
   pnpm --filter p1-cli lint
   pnpm --filter p1-cli test
   pnpm --filter p1-cli tsc
   ```
4. **Commit your changes** with conventional commit messages
5. **Push to your fork**: `git push origin feature/my-feature`
6. **Open a Pull Request** with:
   - Clear description of changes
   - Test plan
   - Any breaking changes noted

### Code Review

- Address review feedback promptly
- Keep PRs focused and reasonably sized
- Ensure CI passes before requesting review
- Be open to suggestions and discussion

## Questions?

If you have questions about contributing:

- Check existing [GitHub Issues](https://github.com/ryanbas21/ping-cli/issues)
- Review [Architecture Documentation](../../docs/ARCHITECTURE.md)
- Open a new issue for discussion

Thank you for contributing! 🎉

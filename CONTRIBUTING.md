# Contributing to PingOne SDK CI CLI

Thank you for your interest in contributing to this project! This guide will help you get started with development.

## Development Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **pnpm**: Version 10.12.1 or higher (specified in `packageManager` field)
- **Git**: For version control

### Initial Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd sdk-ci-cli
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env` file in the project root:

```env
PINGONE_ENV_ID=your-test-environment-id
PINGONE_TOKEN=your-test-token
PINGONE_POPULATION_ID=your-test-population-id
GH_TOKEN=your-github-token
```

⚠️ **Important**: Never commit your `.env` file. It's already in `.gitignore`.

4. **Build the project**

```bash
pnpm build
```

5. **Run tests**

```bash
pnpm test
```

6. **(Optional) Set up shell completions**

For development convenience, you can install shell completions:

```bash
# After building, install completions for your shell
# See README.md "Shell Completions" section for detailed instructions

# Example for bash:
echo 'eval "$(node /home/programming/sdk-ci-cli/packages/ping-cli/dist/main.js --completions bash)"' >> ~/.bashrc
source ~/.bashrc
```

**Note**: Completions are auto-generated from command definitions via `@effect/cli`. When you add new commands, completions automatically update - no manual maintenance required!

## Development Workflow

### Code Standards

This project follows the Effect library development patterns and conventions. Please review [CLAUDE.md](./CLAUDE.md) for detailed guidelines.

### Key Principles

1. **Effect-First**: Use Effect library patterns throughout
2. **Type Safety**: No `any`, `as any`, `as never`, or `as unknown` type assertions
3. **Functional Programming**: Prefer pure functions and immutable data
4. **Error Handling**: Use `Data.TaggedError` for custom errors
5. **Testing**: Write tests using `@effect/vitest` with `it.effect`

### Development Commands

```bash
# Build the project
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Fix linting issues automatically (TypeScript files only)
pnpm lint:fix
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled**: All TypeScript strict checks are enforced
- **No explicit any**: Always use proper types
- **Use Effect patterns**: Prefer `Effect.gen` for complex flows
- **Return yield pattern**: Always use `return yield*` for terminal effects

```typescript
// ✅ Good
Effect.gen(function* () {
  if (someCondition) {
    return yield* Effect.fail(new CustomError({ message: "error" }))
  }
  const result = yield* someEffect
  return result
})

// ❌ Bad - missing return keyword
Effect.gen(function* () {
  if (someCondition) {
    yield* Effect.fail(new CustomError({ message: "error" }))
  }
})
```

### Error Handling

- **Never use try-catch in Effect.gen**: Use Effect error handling instead
- **Use Data.TaggedError**: For all custom error types
- **Structured errors**: Include relevant context in error payloads

```typescript
// ✅ Good
export class PingOneApiError extends Data.TaggedError("PingOneApiError")<{
  status: number
  message: string
  errorCode?: string
}> {}

// Usage in Effect
Effect.gen(function* () {
  const response = yield* makeRequest()
  if (response.status !== 200) {
    return yield* Effect.fail(
      new PingOneApiError({
        status: response.status,
        message: "Request failed"
      })
    )
  }
})

// ❌ Bad - using try-catch in Effect.gen
Effect.gen(function* () {
  try {
    const result = yield* someEffect
  } catch (error) {
    // This won't work as expected!
  }
})
```

### Testing

- **Use @effect/vitest**: For all Effect-based code
- **Use it.effect**: For test cases that work with Effects
- **Use assert methods**: Not `expect` from vitest

```typescript
// ✅ Good
import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"

describe("MyModule", () => {
  it.effect("should do something", () =>
    Effect.gen(function* () {
      const result = yield* myFunction()
      assert.strictEqual(result, expectedValue)
    })
  )
})

// ❌ Bad - using regular vitest for Effect code
import { describe, expect, it } from "vitest"

it("test", () => {
  const result = Effect.runSync(myEffect)
  expect(result).toBe(value)
})
```

### Formatting

The project uses `@effect/dprint` for code formatting:

- **Indent width**: 2 spaces
- **Line width**: 120 characters
- **Semicolons**: ASI (automatic semicolon insertion)
- **Quote style**: Always double quotes
- **Trailing commas**: Never
- **Arrow functions**: Always use parentheses

The linter will automatically fix formatting issues when you run `pnpm lint:fix`.

## Making Changes

### Branch Naming

Use descriptive branch names:

```bash
feature/add-user-search
fix/auth-token-validation
docs/update-api-documentation
refactor/extract-http-client
```

### Commit Messages

Follow conventional commit format:

```bash
feat: add user search functionality
fix: validate auth token before API calls
docs: update API documentation
refactor: extract HTTP client patterns
test: add schema validation tests
chore: update dependencies
```

### Pull Request Process

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

- Write code following the style guidelines
- Add tests for new functionality
- Update documentation as needed

3. **Run validation checks**

```bash
# Run all checks before committing
pnpm build
pnpm lint
pnpm test
```

4. **Commit your changes**

```bash
git add .
git commit -m "feat: add new feature"
```

5. **Push to your fork**

```bash
git push origin feature/your-feature-name
```

6. **Create a Pull Request**

- Provide a clear description of the changes
- Reference any related issues
- Ensure all CI checks pass

## Testing Guidelines

### Test Structure

Organize tests by module:

```bash
src/
  HttpClient/
    PingOneClient.ts
    PingOneClient.test.ts
  Commands/
    PingOne/
      CreateUser.ts
      CreateUser.test.ts  (if needed)
```

### Test Coverage Requirements

- **Minimum coverage**: 80% for new code
- **Critical paths**: 100% coverage for error handling
- **Schema validation**: Test all schema definitions

### Writing Tests

1. **Unit Tests**: Test individual functions in isolation
2. **Integration Tests**: Test HTTP client interactions with mocks
3. **Schema Tests**: Validate schema definitions with various inputs

Example test structure:

```typescript
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { HttpClient } from "@effect/platform"

describe("PingOneClient", () => {
  describe("createUser", () => {
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
          userData: { username: "test", email: "test@example.com", population: { id: "pop-123" } }
        }).pipe(Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)))

        assert.strictEqual(result.username, "test")
      })
    )

    it.effect("should fail with PingOneApiError on 401", () =>
      Effect.gen(function* () {
        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const result = yield* createPingOneUser({
          envId: "env-123",
          token: "invalid-token",
          userData: { username: "test", email: "test@example.com", population: { id: "pop-123" } }
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
  })
})
```

## Adding New Features

### Adding a New PingOne Command

1. **Create the command file**

```bash
src/Commands/PingOne/NewCommand.ts
```

2. **Implement the command**

```typescript
import { Args, Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"

const someArg = Args.text({ name: "someArg" })
const someOption = Options.text("some-option").pipe(Options.optional)

export const newCommand = Command.make(
  "new_command",
  { someArg, someOption },
  ({ someArg, someOption }) =>
    Effect.gen(function* () {
      // Implementation here
      yield* Console.log("Command executed")
    })
)
```

3. **Add to command index**

```typescript
// src/Commands/PingOne/index.ts
import { newCommand } from "./NewCommand.js"

const p1Subcommands = Array.make(
  createUser,
  readUser,
  updateUser,
  deleteUser,
  verifyUser,
  newCommand // Add here
)
```

4. **Add tests**

```bash
src/Commands/PingOne/NewCommand.test.ts
```

5. **Update documentation**

Update README.md with the new command usage.

### Adding a New API Client Function

1. **Define schemas** in `src/HttpClient/PingOneSchemas.ts`
2. **Define types** in `src/HttpClient/PingOneTypes.ts`
3. **Implement client function** in `src/HttpClient/PingOneClient.ts`
4. **Add tests** in `src/HttpClient/PingOneClient.test.ts`
5. **Update documentation** in `docs/API.md`

## Documentation

### When to Update Documentation

- **Always**: When adding new commands or features
- **Always**: When changing existing command behavior
- **Always**: When modifying API contracts
- **Recommended**: When fixing bugs that users might encounter

### Documentation Files

- **README.md**: User-facing documentation
- **CONTRIBUTING.md**: This file - development guidelines
- **docs/API.md**: API reference documentation
- **CLAUDE.md**: Effect library development patterns (don't modify)

### JSDoc Comments

Add JSDoc comments to all public functions:

```typescript
/**
 * Creates a user in PingOne via API
 *
 * @param envId - PingOne environment ID
 * @param token - PingOne access token
 * @param userData - User data matching PingOneCreateUserRequest schema
 * @returns Effect that yields the created user response
 *
 * @example
 * ```ts
 * import { createPingOneUser } from "./PingOneClient"
 * import { Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const user = yield* createPingOneUser({
 *     envId: "env-123",
 *     token: "access-token",
 *     userData: {
 *       username: "john.doe",
 *       email: "john@example.com",
 *       population: { id: "pop-123" }
 *     }
 *   })
 *   console.log("Created user:", user.id)
 * })
 * ```
 *
 * @throws {PingOneApiError} When API request fails with non-2xx status
 */
export const createPingOneUser = ...
```

## Common Issues and Solutions

### ESLint Errors

If you encounter ESLint configuration errors:

```bash
# Only lint TypeScript files
pnpm lint:fix src/**/*.ts
```

### Type Errors

If TypeScript compilation fails:

```bash
# Check for type errors
pnpm build

# Look for:
# - Missing imports
# - Type mismatches
# - Incorrect Effect types
```

### Test Failures

If tests fail:

```bash
# Run specific test file
pnpm test src/HttpClient/PingOneClient.test.ts

# Run with verbose output
pnpm test --reporter=verbose
```

## Getting Help

- **Questions**: Open a GitHub issue with the "question" label
- **Bugs**: Open a GitHub issue with detailed reproduction steps
- **Features**: Open a GitHub issue describing the feature request
- **Documentation**: Open a GitHub issue or submit a PR with improvements

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Maintain a professional environment

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (ISC).

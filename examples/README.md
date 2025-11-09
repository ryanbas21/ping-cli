# Examples

This directory contains example scripts demonstrating common usage patterns for the PingOne SDK CI CLI.

## Running Examples

### Prerequisites

1. Set up your environment variables in `.env`:

```env
PINGONE_ENV_ID=your-environment-id
PINGONE_TOKEN=your-access-token
PINGONE_POPULATION_ID=your-population-id
GH_TOKEN=your-github-token
```

2. Build the project:

```bash
pnpm build
```

3. Run an example:

```bash
pnpm tsx examples/create-and-verify-user.ts
```

## Available Examples

### 1. Create and Verify User (`create-and-verify-user.ts`)

Demonstrates a complete user registration workflow:

- Creating a new user in PingOne
- Verifying the user with a verification code
- Reading the verified user details

**Use case**: User onboarding and account verification flows

```bash
pnpm tsx examples/create-and-verify-user.ts
```

**What you'll learn**:
- How to create users with the API
- How to verify user accounts
- How to read user information
- Basic Effect composition patterns

---

### 2. Batch User Operations (`batch-user-operations.ts`)

Shows how to perform operations on multiple users efficiently:

- Creating multiple users concurrently
- Updating multiple users in batch
- Handling individual operation failures
- Controlling concurrency limits

**Use case**: Bulk user provisioning, mass updates

```bash
pnpm tsx examples/batch-user-operations.ts
```

**What you'll learn**:
- Concurrent operations with `Effect.all`
- Concurrency control
- Error handling for batch operations
- Filtering successful vs. failed operations

---

### 3. Error Handling (`error-handling.ts`)

Comprehensive guide to error handling strategies:

- Catching specific error types
- Retry logic with exponential backoff
- Fallback strategies for failed operations
- Error recovery with cleanup
- Validation error handling

**Use case**: Building resilient applications

```bash
pnpm tsx examples/error-handling.ts
```

**What you'll learn**:
- Using `Effect.catchTags` for specific errors
- Implementing retry patterns with `Schedule`
- Fallback strategies using `Effect.catchTag`
- Cleanup and recovery patterns
- Handling different error scenarios

---

## Common Patterns

### Effect Composition

All examples use `Effect.gen` for composing effects:

```typescript
const program = Effect.gen(function* () {
  const config = yield* Config.string("MY_VAR")
  const result = yield* someEffect(config)
  yield* Console.log(`Result: ${result}`)
  return result
})
```

### Error Handling

Examples demonstrate different error handling approaches:

```typescript
// Catch specific error types
effect.pipe(
  Effect.catchTag("PingOneApiError", (error) => {
    // Handle API errors
  })
)

// Retry with backoff
effect.pipe(
  Effect.retry({
    times: 3,
    schedule: Schedule.exponential("100 millis")
  })
)

// Fallback value
effect.pipe(
  Effect.catchAll(() => Effect.succeed(defaultValue))
)
```

### Concurrency Control

Batch operations show concurrency patterns:

```typescript
// Run effects concurrently with limit
yield* Effect.all(
  items.map((item) => processItem(item)),
  { concurrency: 5 } // Max 5 concurrent operations
)
```

## Modifying Examples

Feel free to modify these examples for your use case:

1. **Change user data**: Update the user creation payloads
2. **Add logging**: Insert `Console.log` statements to trace execution
3. **Test error scenarios**: Intentionally trigger errors to see handling
4. **Adjust concurrency**: Change concurrency limits for batch operations

## Example Template

Use this template to create your own examples:

```typescript
/**
 * Example: [Your Example Name]
 *
 * Description of what this example demonstrates
 */

import { NodeContext, NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Config, Console, Effect, Layer } from "effect"
import { /* your imports */ } from "../src/..."

const program = Effect.gen(function* () {
  // Your code here
  yield* Console.log("Example running...")
})

const layers = Layer.merge(NodeHttpClient.layer, NodeContext.layer)

program.pipe(
  Effect.provide(layers),
  Effect.catchAll((error) =>
    Console.error(`Error: ${error}`)
  ),
  NodeRuntime.runMain
)
```

## Additional Resources

- [Effect Documentation](https://effect.website)
- [API Reference](../docs/API.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Main README](../README.md)

## Troubleshooting

### "Config error: Missing data"

**Problem**: Environment variables not set

**Solution**: Create a `.env` file with required variables (see Prerequisites above)

---

### "PingOneAuthError"

**Problem**: Invalid or expired token

**Solution**: Verify your `PINGONE_TOKEN` is valid and has not expired

---

### "PingOneApiError: 404"

**Problem**: Resource not found (environment, population, or user)

**Solution**: Check that your `PINGONE_ENV_ID` and `PINGONE_POPULATION_ID` are correct

---

### "UnknownException: fetch failed"

**Problem**: Network connectivity issue

**Solution**: Check internet connection and API endpoint availability

---

## Contributing Examples

Have a useful example to share? Please contribute!

1. Create a new `.ts` file in this directory
2. Follow the existing example structure
3. Add documentation at the top of the file
4. Update this README with a description
5. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

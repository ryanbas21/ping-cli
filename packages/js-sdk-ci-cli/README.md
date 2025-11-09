# @ping/js-sdk-ci-cli

Internal CLI tool for automating GitHub workflows related to the Ping JavaScript SDK development and release process.

## Features

- **Workflow Dispatching**: Trigger GitHub Actions workflows programmatically
- **CI Integration**: Automated test and build triggers
- **Publish Automation**: Streamline SDK release workflows
- **Type-Safe**: Built with Effect library for robust error handling
- **Token Management**: Secure GitHub token handling via environment variables

## Installation

```bash
# Install from the monorepo root
pnpm install

# Build the CLI
pnpm --filter '@ping/js-sdk-ci-cli' build
```

## Configuration

The CLI uses environment variables for configuration. Create a `.env` file in the project root:

```bash
# Required: GitHub Personal Access Token with workflow permissions
GITHUB_TOKEN=your-github-token

# Optional: GitHub Repository (default: organization/repository)
GITHUB_REPOSITORY=owner/repo
```

## Usage

### CI Workflow

Trigger continuous integration workflow:

```bash
js-sdk-ci ci [options]
```

### Publish Workflow

Trigger publish/release workflow:

```bash
js-sdk-ci publish [options]
```

## Architecture

This CLI is built using:

- **Effect-ts**: Functional effect system for type-safe error handling
- **@effect/cli**: Command-line argument parsing and validation
- **@effect/platform**: Platform abstractions for Node.js integration

### Command Structure

Commands are defined in `src/Commands/GitHub/` and follow the Effect-ts CLI pattern:

```typescript
export const ciCommand = Command.make(
  "ci",
  { /* options */ },
  (options) => Effect.gen(function*() {
    // Command implementation
  })
)
```

### Error Handling

The CLI uses structured error types:

- **`NoGithubToken`**: Missing GitHub authentication token
- **`WorkflowDispatchError`**: Workflow dispatch failures with status and details

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
```

## Internal Use Only

⚠️ **Note**: This tool is designed for internal use within the Ping JavaScript SDK development team. It is not intended for external distribution or use.

## License

ISC

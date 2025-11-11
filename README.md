# PingOne SDK CI CLI

[![npm version](https://img.shields.io/npm/v/p1-cli.svg)](https://www.npmjs.com/package/p1-cli)
[![Publish](https://github.com/ryanbas21/ping-cli/actions/workflows/publish.yml/badge.svg)](https://github.com/ryanbas21/ping-cli/actions/workflows/publish.yml)
[![CI](https://github.com/ryanbas21/ping-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/ryanbas21/ping-cli/actions/workflows/ci.yml)

A monorepo containing command-line tools built with [Effect](https://effect.website) for PingOne management and CI/CD automation.

## 📦 Packages

This monorepo contains two CLI packages:

### [`p1-cli`](./packages/ping-cli) - PingOne Management CLI

[![npm version](https://img.shields.io/npm/v/p1-cli.svg)](https://www.npmjs.com/package/p1-cli)

Command-line tool for managing PingOne resources via the PingOne Management API.

**Key Features:**
- OAuth 2.0 authentication with automatic token management
- User management (CRUD operations, status, passwords, MFA, sessions)
- Groups, populations, applications, and environments management
- Bulk operations with CSV/JSON support
- Cross-platform credential storage (system keychain + encrypted fallback)

**Documentation:**
- [Complete User Guide](./packages/ping-cli/README.md)
- [OAuth Setup Guide](./packages/ping-cli/OAUTH_SETUP.md)
- [Interactive Mode](./packages/ping-cli/INTERACTIVE_MODE.md)
- [Wizard Mode](./packages/ping-cli/WIZARD_MODE.md)
- [Manual Testing Guide](./packages/ping-cli/MANUAL_TESTING.md)
- [Changelog](./packages/ping-cli/CHANGELOG.md)

**Installation:**
```bash
npm install -g p1-cli
# or
npx p1-cli --help
```

---

### [`js-sdk-ci-cli`](./packages/js-sdk-ci-cli) - JavaScript SDK CI Automation

Internal CLI tool for automating GitHub workflows related to the Ping JavaScript SDK development and release process.

**Key Features:**
- GitHub Actions workflow dispatching
- CI integration and test automation
- Publish workflow automation
- Type-safe workflow management

**Documentation:**
- [Complete Guide](./packages/js-sdk-ci-cli/README.md)

**Installation:**
```bash
pnpm --filter 'js-sdk-ci-cli' build
```

## 🚀 Quick Start

### For PingOne Management (`p1-cli`)

```bash
# Install globally
npm install -g p1-cli

# Authenticate with OAuth
p1-cli auth login

# Manage users
p1-cli users list --environment-id="your-env-id"
p1-cli users create john.doe john@example.com

# Bulk operations
p1-cli users bulk_import users.csv
```

### For JavaScript SDK CI (`js-sdk-ci-cli`)

```bash
# From monorepo root
pnpm install
pnpm --filter 'js-sdk-ci-cli' build

# Trigger CI workflow
js-sdk-ci ci [options]

# Trigger publish workflow
js-sdk-ci publish [options]
```

## 📖 Documentation Guide

### Getting Started
1. **Installation**: Choose your package above and follow installation instructions
2. **Authentication** (for p1-cli): [OAuth Setup Guide](./packages/ping-cli/OAUTH_SETUP.md)
3. **Interactive Usage**: [Interactive Mode Guide](./packages/ping-cli/INTERACTIVE_MODE.md)
4. **Examples**: [Usage Examples](./examples/README.md)

### Package Documentation
- **p1-cli**: [Complete documentation](./packages/ping-cli/README.md) with all commands and options
- **js-sdk-ci-cli**: [Automation guide](./packages/js-sdk-ci-cli/README.md) for CI/CD workflows

### Advanced Topics
- [OAuth 2.0 Setup](./packages/ping-cli/OAUTH_SETUP.md) - Worker App configuration and authentication
- [Wizard Mode](./packages/ping-cli/WIZARD_MODE.md) - Interactive command building
- [Manual Testing](./packages/ping-cli/MANUAL_TESTING.md) - Testing strategies and scenarios
- [Changelog](./packages/ping-cli/CHANGELOG.md) - Release history and updates

### Examples
- [Usage Examples](./examples/README.md) - Practical examples for common workflows

## 🏗️ Monorepo Development

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: Package manager (recommended)
- **Git**: Version control

### Setup

```bash
# Clone the repository
git clone https://github.com/ryanbas21/ping-cli
cd ping-cli

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Workspace Commands

```bash
# Build specific package
pnpm --filter 'p1-cli' build
pnpm --filter 'js-sdk-ci-cli' build

# Test specific package
pnpm --filter 'p1-cli' test
pnpm --filter 'js-sdk-ci-cli' test

# Lint all packages
pnpm lint

# Type check
pnpm tsc
```

## 🛠️ Technology Stack

- **[Effect](https://effect.website)**: Functional effect system for type-safe error handling
- **TypeScript**: Type-safe development
- **@effect/cli**: Command-line argument parsing and validation
- **@effect/platform**: Platform abstractions for Node.js integration
- **@effect/schema**: Request/response validation
- **Vitest**: Fast unit testing framework

## 📁 Project Structure

```
ping-cli/
├── packages/
│   ├── ping-cli/              # PingOne Management CLI
│   │   ├── src/
│   │   │   ├── Commands/      # CLI command implementations
│   │   │   ├── HttpClient/    # API client functions
│   │   │   ├── Services/      # OAuth, credentials, cache, retry
│   │   │   └── main.ts
│   │   └── README.md
│   └── js-sdk-ci-cli/         # JavaScript SDK CI Automation
│       ├── src/
│       │   ├── Commands/      # GitHub workflow commands
│       │   └── main.ts
│       └── README.md
├── examples/                   # Usage examples
│   ├── create-and-verify-user.ts
│   ├── batch-user-operations.ts
│   └── error-handling.ts
├── docs/                       # Additional documentation
├── .github/                    # CI/CD workflows
└── package.json                # Monorepo configuration
```

## 🔑 Key Features by Package

### p1-cli

**Authentication:**
- OAuth 2.0 client credentials flow
- Cross-platform credential storage
- Automatic token refresh

**Resource Management:**
- Users (CRUD, status, passwords, MFA, sessions)
- Groups (CRUD, member management)
- Populations (CRUD operations)
- Applications (CRUD operations)
- Environments (discovery and management)

**Bulk Operations:**
- Import/export users (CSV/JSON)
- Bulk delete with parallel processing
- Progress tracking and error collection

**Developer Experience:**
- Shell completions (bash, zsh, fish, sh)
- Interactive wizard mode
- Type-safe with Effect
- Comprehensive error handling

[📖 View Complete Documentation →](./packages/ping-cli/README.md)

### js-sdk-ci-cli

**Workflow Automation:**
- GitHub Actions workflow dispatching
- CI test automation
- Publish workflow management

**Features:**
- Type-safe workflow configuration
- Secure token management
- Effect-based error handling

[📖 View Complete Documentation →](./packages/js-sdk-ci-cli/README.md)

## 💡 Usage Examples

### p1-cli Quick Examples

```bash
# Authenticate with OAuth
p1-cli auth login

# List users
p1-cli users list --environment-id="your-env-id"

# Create a user
p1-cli users create john.doe john@example.com \
  --given-name John \
  --family-name Doe

# Bulk import users
p1-cli users bulk_import users.csv

# Manage groups
p1-cli groups create "Engineering Team" \
  --description "All engineers"

# List environments
p1-cli environments list
```

### js-sdk-ci-cli Quick Examples

```bash
# Trigger CI workflow
js-sdk-ci ci --ref main

# Trigger publish workflow
js-sdk-ci publish --dist-tag latest
```

For detailed command documentation and all available options:
- **p1-cli**: See [complete command reference](./packages/ping-cli/README.md)
- **js-sdk-ci-cli**: See [workflow automation guide](./packages/js-sdk-ci-cli/README.md)
- **Examples**: See [practical examples](./examples/README.md)

## 🤝 Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, or improving documentation:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run quality checks: `pnpm lint && pnpm test && pnpm build`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed development guidelines.

## 📄 License

ISC

## ⚠️ Disclaimer

**IMPORTANT**: This is completely unsupported and is NOT an official release of a Ping product. These tools are provided as-is for development and testing purposes only. Use at your own risk.

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/ryanbas21/ping-cli/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ryanbas21/ping-cli/discussions)
- **Documentation**: See package-specific docs above

# PingOne SDK CI CLI

A command-line tool built with [Effect](https://effect.website) for managing PingOne user operations and triggering GitHub workflows for the Ping JavaScript SDK.

## Features

- **PingOne User Management**: Create, read, update, delete, and verify users via PingOne API
- **PingOne Groups Management**: Full CRUD operations for groups including member management
- **PingOne Populations Management**: Manage populations (user collections) with CRUD operations
- **PingOne Applications Management**: Create and manage OAuth/OIDC applications
- **GitHub Workflow Automation**: Trigger CI and publish workflows for the Ping JavaScript SDK
- **Type-Safe**: Built with Effect library for robust error handling and type safety
- **Schema Validation**: Request/response validation using Effect Schema
- **Functional Programming**: Leverages Effect's functional programming patterns for reliability

## Installation

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended)

### Install Dependencies

```bash
pnpm install
```

### Build

```bash
pnpm build
```

## Configuration

The CLI uses environment variables for configuration. Create a `.env` file in the project root:

```env
# PingOne Configuration
PINGONE_ENV_ID=your-environment-id
PINGONE_TOKEN=your-access-token
PINGONE_POPULATION_ID=your-default-population-id

# GitHub Configuration (for workflow triggers)
GH_TOKEN=your-github-personal-access-token
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PINGONE_ENV_ID` | PingOne environment identifier | Yes (or via `--environment-id` flag) |
| `PINGONE_TOKEN` | PingOne API access token | Yes (or via `--pingone-token` flag) |
| `PINGONE_POPULATION_ID` | Default population ID for user creation | Yes (or via `--population-id` flag) |
| `GH_TOKEN` | GitHub personal access token for workflow dispatch | Yes for workflow commands |

## Usage

### Running the CLI

```bash
# Development mode (using pnpm)
pnpm start <command> [arguments] [options]

# After building (using node directly)
node dist/main.js <command> [arguments] [options]

# Production (after global install)
pingid <command> [arguments] [options]
```

> **Note**: Throughout this documentation, examples use `pnpm start` for development usage. In production, replace `pnpm start` with `pingid` or `node dist/main.js`.

## Commands

### PingOne User Management

All PingOne commands are under the `p1` subcommand:

```bash
pnpm start p1 <subcommand> [arguments] [options]
```

#### Create User

Create a new user in PingOne.

```bash
pnpm start p1 create_user <username> <email> [options]
```

**Arguments:**
- `username` - Username for the new user
- `email` - Email address for the new user

**Options:**
- `-e, --environment-id <id>` - PingOne environment ID (or use `PINGONE_ENV_ID` env var)
- `-p, --population-id <id>` - Population ID (or use `PINGONE_POPULATION_ID` env var)
- `-t, --pingone-token <token>` - PingOne access token (or use `PINGONE_TOKEN` env var)
- `--given-name <name>` - User's given (first) name
- `--family-name <name>` - User's family (last) name
- `--department <dept>` - User's department
- `--locales <locales>` - Comma-separated list of locales (e.g., "en,es,fr")

**Example:**

```bash
pnpm start p1 create_user john.doe john@example.com \
  --environment-id env-123 \
  --population-id pop-456 \
  --given-name John \
  --family-name Doe \
  --department Engineering \
  --locales "en,es"
```

#### Read User

Retrieve user information by ID.

```bash
pnpm start p1 read_user <userId> [options]
```

**Arguments:**
- `userId` - The ID of the user to retrieve

**Options:**
- `-e, --environment-id <id>` - PingOne environment ID
- `-t, --pingone-token <token>` - PingOne access token

**Example:**

```bash
pnpm start p1 read_user user-123 --environment-id env-123
```

#### Update User

Update an existing user's information.

```bash
pnpm start p1 update_user <userId> <jsonData> [options]
```

**Arguments:**
- `userId` - The ID of the user to update
- `jsonData` - JSON string with fields to update

**Options:**
- `-e, --environment-id <id>` - PingOne environment ID
- `-t, --pingone-token <token>` - PingOne access token

**Example:**

```bash
pnpm start p1 update_user user-123 '{"email":"newemail@example.com","username":"new.username"}' \
  --environment-id env-123
```

**Supported Update Fields:**
- `username` - New username
- `email` - New email address
- `name` - Name object with `given`, `middle`, `family`, etc.
- `nickname` - User nickname
- `title` - Job title
- `preferredLanguage` - Preferred language code
- `locale` - Locale code
- `primaryPhone` - Primary phone number
- `mobilePhone` - Mobile phone number
- `address` - Address object
- `department` - Department name
- `timezone` - Timezone

#### Delete User

Delete a user from PingOne.

```bash
pnpm start p1 delete_user <userId> [options]
```

**Arguments:**
- `userId` - The ID of the user to delete

**Options:**
- `-e, --environment-id <id>` - PingOne environment ID
- `-t, --pingone-token <token>` - PingOne access token

**Example:**

```bash
pnpm start p1 delete_user user-123 --environment-id env-123
```

#### Verify User

Verify a user account with a verification code.

```bash
pnpm start p1 verify_user <userId> <verificationCode> [options]
```

**Arguments:**
- `userId` - The ID of the user to verify
- `verificationCode` - The verification code sent to the user

**Options:**
- `-e, --environment-id <id>` - PingOne environment ID
- `-t, --pingone-token <token>` - PingOne access token

**Example:**

```bash
pnpm start p1 verify_user user-123 123456 --environment-id env-123
```

### PingOne Groups Management

Manage PingOne groups with full CRUD operations and member management.

#### Create Group

```bash
pnpm start p1 groups create_group <name> [options]
```

**Arguments:**
- `name` - Name for the new group

**Options:**
- `-e, --environment-id <id>` - PingOne environment ID
- `-t, --pingone-token <token>` - PingOne access token
- `--description <desc>` - Group description
- `--population-id <id>` - Population ID to associate with the group

**Example:**
```bash
pnpm start p1 groups create_group "Engineering Team" \
  --environment-id env-123 \
  --description "All engineers" \
  --population-id pop-456
```

#### Read Group

```bash
pnpm start p1 groups read_group <groupId> [options]
```

**Example:**
```bash
pnpm start p1 groups read_group group-123 --environment-id env-123
```

#### List Groups

```bash
pnpm start p1 groups list_groups [options]
```

**Options:**
- `-l, --limit <number>` - Maximum number of groups to return
- `--filter <expression>` - SCIM filter expression

**Example:**
```bash
pnpm start p1 groups list_groups --environment-id env-123 --limit 10
```

#### Update Group

```bash
pnpm start p1 groups update_group <groupId> [options]
```

**Options:**
- `--name <name>` - New group name
- `--description <desc>` - New group description

**Example:**
```bash
pnpm start p1 groups update_group group-123 \
  --name "Updated Team Name" \
  --description "Updated description"
```

#### Delete Group

```bash
pnpm start p1 groups delete_group <groupId> [options]
```

#### Add Group Member

```bash
pnpm start p1 groups add_member <groupId> <userId> [options]
```

**Example:**
```bash
pnpm start p1 groups add_member group-123 user-456 --environment-id env-123
```

#### Remove Group Member

```bash
pnpm start p1 groups remove_member <groupId> <userId> [options]
```

#### List Group Members

```bash
pnpm start p1 groups list_members <groupId> [options]
```

### PingOne Populations Management

Manage PingOne populations (user groups) with CRUD operations.

#### Create Population

```bash
pnpm start p1 populations create_population <name> [options]
```

**Arguments:**
- `name` - Name for the new population

**Options:**
- `-e, --environment-id <id>` - PingOne environment ID
- `-t, --pingone-token <token>` - PingOne access token
- `--description <desc>` - Population description

**Example:**
```bash
pnpm start p1 populations create_population "Customer Population" \
  --environment-id env-123 \
  --description "All customer users"
```

#### Read Population

```bash
pnpm start p1 populations read_population <populationId> [options]
```

#### List Populations

```bash
pnpm start p1 populations list_populations [options]
```

**Options:**
- `-l, --limit <number>` - Maximum number of populations to return
- `--filter <expression>` - SCIM filter expression

#### Update Population

```bash
pnpm start p1 populations update_population <populationId> [options]
```

**Options:**
- `--name <name>` - New population name
- `--description <desc>` - New population description

#### Delete Population

```bash
pnpm start p1 populations delete_population <populationId> [options]
```

### PingOne Applications Management

Manage PingOne applications with CRUD operations.

#### Create Application

```bash
pnpm start p1 applications create_application <name> [options]
```

**Arguments:**
- `name` - Name for the new application

**Options:**
- `-e, --environment-id <id>` - PingOne environment ID
- `-t, --pingone-token <token>` - PingOne access token
- `--description <desc>` - Application description
- `--type <type>` - Application type (default: WEB_APP)
- `--protocol <protocol>` - Protocol type (default: OPENID_CONNECT)
- `--enabled` - Enable the application (default: true)

**Example:**
```bash
pnpm start p1 applications create_application "My Web App" \
  --environment-id env-123 \
  --description "Customer portal application" \
  --type WEB_APP \
  --protocol OPENID_CONNECT \
  --enabled
```

#### Read Application

```bash
pnpm start p1 applications read_application <applicationId> [options]
```

#### List Applications

```bash
pnpm start p1 applications list_applications [options]
```

**Options:**
- `-l, --limit <number>` - Maximum number of applications to return
- `--filter <expression>` - SCIM filter expression

#### Update Application

```bash
pnpm start p1 applications update_application <applicationId> [options]
```

**Options:**
- `--name <name>` - New application name
- `--description <desc>` - New application description
- `--enabled` - Enable/disable the application

#### Delete Application

```bash
pnpm start p1 applications delete_application <applicationId> [options]
```

### GitHub Workflow Commands

#### Run JS Tests

Trigger the CI workflow for the Ping JavaScript SDK.

```bash
pnpm start RunJSTests <tenantUrl> <GH_TOKEN> <ref> <workflowId>
```

**Arguments:**
- `tenantUrl` - The tenant URL for testing
- `GH_TOKEN` - GitHub personal access token (or use `GH_TOKEN` env var)
- `ref` - Git branch/tag/commit to test
- `workflowId` - Workflow file name (typically `CI.yml`)

**Example:**

```bash
pnpm start RunJSTests https://tenant.example.com $GH_TOKEN main CI.yml
```

#### Run Publish

Trigger the publish workflow for the Ping JavaScript SDK.

```bash
pnpm start RunPublish [options]
```

**Options:**
- `--gh-token <token>` - GitHub token (or use `GH_TOKEN` env var)
- `--dist-tag <tag>` - NPM distribution tag (e.g., "latest", "beta")
- `--git-ref <ref>` - Git reference to publish from
- `--branch <branch>` - Branch name
- `--prerelease <version>` - Prerelease version
- `--npm-access <access>` - NPM access level ("public" or "restricted")

**Example:**

```bash
pnpm start RunPublish \
  --dist-tag latest \
  --git-ref main \
  --npm-access public
```

## Development

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Linting

```bash
# Check for linting issues
pnpm lint

# Fix linting issues automatically
pnpm lint:fix
```

### Type Checking

```bash
# Build the project (runs TypeScript compiler)
pnpm build
```

## Project Structure

```bash
sdk-ci-cli/
├── src/
│   ├── Commands/           # CLI command implementations
│   │   ├── PingOne/       # PingOne user management commands
│   │   │   ├── CreateUser.ts
│   │   │   ├── ReadUser.ts
│   │   │   ├── UpdateUser.ts
│   │   │   ├── DeleteUser.ts
│   │   │   ├── VerifyUser.ts
│   │   │   ├── ConfigHelper.ts
│   │   │   └── index.ts
│   │   ├── RunJSTests.ts  # GitHub CI workflow trigger
│   │   └── RunPublish.ts  # GitHub publish workflow trigger
│   ├── HttpClient/        # HTTP client and API integrations
│   │   ├── PingOneClient.ts      # PingOne API client
│   │   ├── PingOneSchemas.ts     # PingOne request/response schemas
│   │   ├── PingOneTypes.ts       # PingOne TypeScript types
│   │   ├── HttpClient.ts         # GitHub API client
│   │   ├── schemas.ts            # GitHub workflow schemas
│   │   └── types.ts              # GitHub TypeScript types
│   ├── Errors.ts          # Custom error types
│   ├── PingCommand.ts     # Root command configuration
│   └── main.ts            # Application entry point
├── dist/                  # Compiled JavaScript output
├── coverage/              # Test coverage reports
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Error Handling

The CLI uses Effect's error handling system with custom error types:

- **NoGithubToken** - GitHub token not provided
- **WorkflowDispatchError** - GitHub workflow dispatch failed
- **PingOneAuthError** - PingOne authentication failed
- **PingOneApiError** - PingOne API request failed
- **PingOneValidationError** - Input validation failed

All errors include detailed messages to help diagnose issues.

## Examples

### Example: Create and Verify User Workflow

```bash
# 1. Create a new user
pnpm start p1 create_user test.user test@example.com \
  --environment-id env-123 \
  --population-id pop-456 \
  --given-name Test \
  --family-name User

# Output: User created successfully!
# ID: user-789
# Username: test.user
# Email: test@example.com

# 2. Verify the user with verification code
pnpm start p1 verify_user user-789 123456 \
  --environment-id env-123

# 3. Read user details
pnpm start p1 read_user user-789 \
  --environment-id env-123
```

### Example: Update User Information

```bash
# Update multiple fields at once
pnpm start p1 update_user user-789 '{
  "email": "updated@example.com",
  "name": {
    "given": "Updated",
    "family": "Name"
  },
  "department": "Engineering"
}' --environment-id env-123
```

### Example: Using Environment Variables

```bash
# Set environment variables
export PINGONE_ENV_ID=env-123
export PINGONE_TOKEN=your-token-here
export PINGONE_POPULATION_ID=pop-456

# Now you can omit the flags
pnpm start p1 create_user john.doe john@example.com \
  --given-name John \
  --family-name Doe
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

ISC

## Support

For issues, questions, or contributions, please open an issue in the repository.

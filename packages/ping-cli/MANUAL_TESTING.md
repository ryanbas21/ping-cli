# Manual Testing Guide for p1-cli

This guide provides manual test scenarios to verify the CLI works end-to-end with real configuration sources.

## Prerequisites

1. Build the CLI:
   ```bash
   pnpm --filter 'p1-cli' build
   ```

2. Set up test credentials (use non-production environment!)

## Test 1: CLI Arguments

Test that CLI arguments work correctly:

```bash
# Should show version
node packages/ping-cli/dist/main.js --version

# Should show help
node packages/ping-cli/dist/main.js --help

# Should show command help
node packages/ping-cli/dist/main.js create_user --help
```

**Expected**: Version displays as "0.1.0", help text displays correctly.

## Test 2: Environment Variables

Test that environment variables are read:

```bash
# Set environment variables
export PINGONE_ENV_ID="test-env-123"
export PINGONE_TOKEN="test-token-456"
export PINGONE_POPULATION_ID="test-pop-789"

# Try command without CLI arguments (should use env vars)
node packages/ping-cli/dist/main.js create_user testuser test@example.com \
  --given-name "Test" \
  --family-name "User"
```

**Expected**: Command attempts to connect using the environment variables (will fail with auth error since these are fake credentials, but should NOT complain about missing configuration).

## Test 3: .env File

Test that `.env` file is loaded:

```bash
# Create .env file in project root
cat > .env << 'EOF'
PINGONE_ENV_ID=test-env-from-dotenv
PINGONE_TOKEN=test-token-from-dotenv
PINGONE_POPULATION_ID=test-pop-from-dotenv
EOF

# Clear environment variables
unset PINGONE_ENV_ID
unset PINGONE_TOKEN
unset PINGONE_POPULATION_ID

# Run command (should use .env values)
node packages/ping-cli/dist/main.js create_user testuser test@example.com
```

**Expected**: Command loads configuration from `.env` file (will fail with auth error for fake credentials, but should NOT show "missing configuration" errors).

## Test 4: Priority Hierarchy

Test that CLI args override environment variables:

```bash
# Set environment variables
export PINGONE_ENV_ID="env-var-value"
export PINGONE_TOKEN="env-var-token"

# Pass different values via CLI args (should take precedence)
node packages/ping-cli/dist/main.js create_user testuser test@example.com \
  --environment-id "cli-arg-value" \
  --pingone-token "cli-arg-token" \
  --population-id "cli-pop-value"
```

**Expected**: CLI arguments take precedence over environment variables.

## Test 5: Help for All Commands

Verify all commands have proper help:

```bash
# User commands
node packages/ping-cli/dist/main.js create_user --help
node packages/ping-cli/dist/main.js read_user --help
node packages/ping-cli/dist/main.js update_user --help
node packages/ping-cli/dist/main.js delete_user --help
node packages/ping-cli/dist/main.js verify_user --help

# Group commands
node packages/ping-cli/dist/main.js groups --help
node packages/ping-cli/dist/main.js groups create_group --help
node packages/ping-cli/dist/main.js groups list_groups --help

# Population commands
node packages/ping-cli/dist/main.js populations --help
node packages/ping-cli/dist/main.js populations create_population --help

# Application commands
node packages/ping-cli/dist/main.js applications --help
node packages/ping-cli/dist/main.js applications create_application --help
```

**Expected**: Each command displays appropriate help text with arguments, options, and descriptions.

## Test 6: Error Messages

Test that error messages are clear:

```bash
# Missing required arguments
node packages/ping-cli/dist/main.js create_user

# Invalid email format (should show validation error)
node packages/ping-cli/dist/main.js create_user testuser "invalid-email" \
  --environment-id "test" \
  --population-id "test" \
  --pingone-token "test"

# Empty username (should show validation error)
node packages/ping-cli/dist/main.js create_user "" test@example.com \
  --environment-id "test" \
  --population-id "test" \
  --pingone-token "test"
```

**Expected**: Clear error messages about missing/invalid arguments.

## Test 7: Real API Call (Optional)

**⚠️ Only run with real credentials in a test environment!**

```bash
# Set real credentials
export PINGONE_ENV_ID="your-real-env-id"
export PINGONE_TOKEN="your-real-token"
export PINGONE_POPULATION_ID="your-real-population-id"

# Try reading a user (replace with real user ID)
node packages/ping-cli/dist/main.js read_user "real-user-id"
```

**Expected**: Command executes successfully and returns user data.

## Configuration Sources Summary

The CLI supports configuration from multiple sources with the following priority:

1. **CLI Arguments** (highest priority)
   - `--environment-id`, `--pingone-token`, `--population-id`, etc.

2. **Environment Variables** (fallback)
   - `PINGONE_ENV_ID`, `PINGONE_TOKEN`, `PINGONE_POPULATION_ID`

3. **`.env` File** (loaded into environment variables)
   - Automatically loaded from project root using `dotenv`

**Note**: JSON config files are NOT supported. Only CLI args, env vars, and .env files.

## Automated Tests

In addition to manual testing, run the automated test suite:

```bash
# Run all tests (113 tests including 14 smoke tests)
pnpm --filter 'p1-cli' test

# Run just smoke tests
pnpm --filter 'p1-cli' test PingCommand.test.ts

# Run with coverage
pnpm --filter 'p1-cli' test:coverage
```

## Cleanup

```bash
# Remove test .env file
rm .env

# Unset environment variables
unset PINGONE_ENV_ID
unset PINGONE_TOKEN
unset PINGONE_POPULATION_ID
```

# OAuth Setup Guide

This guide walks you through setting up OAuth authentication for the PingOne CLI using a Worker Application.

## Overview

The PingOne CLI uses OAuth 2.0 Client Credentials Grant flow for authentication. This provides secure, automatic token management without requiring manual access token handling.

## Prerequisites

- Access to a PingOne environment with administrative privileges
- PingOne region (North America, Europe, Asia Pacific, or Canada)

## Step 1: Create a Worker Application

1. Log in to the [PingOne Admin Console](https://console.pingone.com/)
2. Navigate to your environment
3. Go to **Connections** → **Applications**
4. Click **+ Application** (or **Add Application**)
5. Select **Worker** as the application type
6. Click **Configure**

## Step 2: Configure Application Settings

1. **Application Name**: Enter a descriptive name (e.g., "PingOne CLI")
2. **Description**: (Optional) Add a description like "CLI tool for managing PingOne resources"
3. Click **Save**

## Step 3: Grant Required Permissions

The Worker Application needs appropriate scopes to manage PingOne resources:

1. Go to the **Roles** tab of your Worker Application
2. Click **Grant Roles**
3. Select the roles needed for your use case:
   - **Environment Admin**: Full access to manage all resources
   - **Identity Data Admin**: Manage users, groups, and populations
   - **Client Application Developer**: Manage applications
   - **Configuration Read Only**: Read-only access to environment configuration

4. Click **Save**

### Recommended Minimum Permissions

For basic user management operations:
- `p1:read:user`
- `p1:create:user`
- `p1:update:user`
- `p1:delete:user`
- `p1:read:population`
- `p1:read:group`

## Step 4: Obtain Client Credentials

1. Go to the **Configuration** tab of your Worker Application
2. Note the **Client ID** (you'll need this for authentication)
3. Click **Show Secret** to reveal the **Client Secret**
4. **Important**: Copy and securely store both values - you'll need them to authenticate the CLI

## Step 5: Identify Your Environment Details

You'll also need:

1. **Environment ID**: Found in the URL when viewing your environment, or in the environment settings
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

2. **Region**: Your PingOne region determines the API endpoint
   - North America: `com` (default)
   - Europe: `eu`
   - Asia Pacific: `asia`
   - Canada: `ca`

## Step 6: Authenticate the CLI

Run the login command with your credentials:

```bash
p1-cli auth login \
  --client-id="<your-client-id>" \
  --client-secret="<your-client-secret>" \
  --environment-id="<your-environment-id>" \
  --region="com"
```

### Interactive Mode (Wizard)

For a guided setup experience, use wizard mode:

```bash
p1-cli auth login --wizard
```

The wizard will prompt you for each required value interactively.

## Step 7: Verify Authentication

Check your authentication status:

```bash
p1-cli auth status
```

You should see output similar to:

```text
✓ Authenticated

Client ID: 12345678****abcd
Environment: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

✓ Access token is valid
  Expires: 1/10/2025, 3:30:00 PM
```

## Credential Storage

The CLI stores credentials securely using:

1. **System Keychain** (Primary)
   - macOS: Keychain Access
   - Windows: Windows Credential Manager
   - Linux: Secret Service API (GNOME Keyring, KWallet, etc.)

2. **Encrypted File** (Fallback)
   - If system keychain is unavailable
   - Stored at: `~/.pingone/credentials.enc`
   - Encrypted with AES-256-GCM using machine-specific key

3. **Environment Variables** (CI/CD)
   - `PINGONE_CLIENT_ID`
   - `PINGONE_CLIENT_SECRET`
   - `PINGONE_ENV_ID`

## CI/CD Integration

For automated environments where keychain access isn't available:

```bash
export PINGONE_CLIENT_ID="your-client-id"
export PINGONE_CLIENT_SECRET="your-client-secret"
export PINGONE_ENV_ID="your-environment-id"

# CLI will automatically use these credentials
p1-cli users list
```

## Logout

To clear stored credentials and cached tokens:

```bash
p1-cli auth logout
```

This removes:
- Stored credentials from keychain/encrypted file
- Cached access tokens from memory

## Troubleshooting

### Authentication Fails

If you see "No PingOne authentication configured":

1. Verify you've run `p1-cli auth login` successfully
2. Check that credentials are stored: `p1-cli auth status`
3. Ensure your Worker Application has the required roles
4. Verify the region matches your PingOne environment

### Keychain Access Denied

On macOS, if you see keychain access prompts:

1. Click **Always Allow** to grant permanent access
2. Alternatively, use encrypted file storage (automatic fallback)

### Invalid Client Credentials

If authentication fails with 401/403 errors:

1. Verify Client ID and Secret are correct
2. Check that the Worker Application is enabled
3. Ensure the application has required roles/scopes
4. Confirm you're using the correct environment ID

### Region Mismatch

If you see connection errors:

1. Verify your region setting matches your PingOne environment
2. Check the PingOne console URL:
   - `console.pingone.com` → `com`
   - `console.pingone.eu` → `eu`
   - `console.pingone.asia` → `asia`
   - `console.pingone.ca` → `ca`

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** in CI/CD pipelines
3. **Rotate secrets regularly** through PingOne Admin Console
4. **Use separate Worker Applications** for different environments (dev, staging, production)
5. **Grant minimum required permissions** following principle of least privilege
6. **Monitor application usage** through PingOne audit logs

## Advanced Usage

### Multiple Environments

To switch between environments, run `auth login` again with different credentials:

```bash
# Authenticate to production
p1-cli auth login --environment-id="prod-env-id" --client-id="..." --client-secret="..."

# Later, switch to staging
p1-cli auth login --environment-id="staging-env-id" --client-id="..." --client-secret="..."
```

The CLI stores only one set of credentials at a time.

### Temporary Token Override

For one-off commands without changing stored credentials:

```bash
p1-cli users list --pingone-token="temporary-token-here"
```

Or using environment variable:

```bash
PINGONE_TOKEN="temporary-token-here" p1-cli users list
```

## Additional Resources

- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/)
- [PingOne Worker Applications](https://docs.pingidentity.com/r/en-us/pingone/p1_c_workers)
- [OAuth 2.0 Client Credentials Grant](https://oauth.net/2/grant-types/client-credentials/)

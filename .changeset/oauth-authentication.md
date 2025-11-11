---
"p1-cli": minor
---

Add OAuth 2.0 client credentials authentication with automatic token management.

## New Features

- **OAuth Authentication**: Secure OAuth 2.0 Client Credentials flow with automatic token refresh and 5-minute expiration buffer
- **Cross-Platform Credential Storage**: System keychain integration (macOS Keychain Access, Windows Credential Manager, Linux Secret Service) with AES-256-GCM encrypted file fallback
- **Three-Tier Authentication Priority**: CLI flag → environment variables → OAuth service with automatic fallback
- **Multi-Region Support**: North America, Europe, Asia Pacific, Canada

## New Commands

- `auth login`: Store OAuth client credentials securely (supports interactive prompts)
- `auth logout`: Clear stored credentials and cached tokens
- `auth status`: View authentication status and token validity

## New Services

- **OAuthService**: Token lifecycle management with automatic caching and refresh
- **CredentialService**: Cross-platform secure credential storage

## Documentation

- **OAUTH_SETUP.md**: Complete setup guide for PingOne Worker Application configuration
- **README.md**: Updated with OAuth quick start and authentication methods

## Backward Compatibility

- Existing token-based authentication (`--pingone-token`, `PINGONE_TOKEN`) continues to work
- No breaking changes to existing commands
- Automatic fallback ensures smooth migration path

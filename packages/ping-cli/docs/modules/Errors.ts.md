---
title: Errors.ts
nav_order: 1
parent: Modules
---

## Errors overview

Enhanced Error Types for PingOne CLI

Defines structured error types using Effect's Data.TaggedError with comprehensive context.
All errors follow these principles:

- Type-safe and structured for programmatic handling
- Include human-readable messages
- Provide context for debugging and logging
- Support error recovery strategies

Added in v0.0.1

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [CredentialStorageError (class)](#credentialstorageerror-class)
  - [NetworkError (class)](#networkerror-class)
  - [OAuthFlowError (class)](#oauthflowerror-class)
  - [PingOneApiError (class)](#pingoneapierror-class)
  - [PingOneAuthError (class)](#pingoneautherror-class)
  - [PingOneValidationError (class)](#pingonevalidationerror-class)
  - [RateLimitError (class)](#ratelimiterror-class)

---

# utils

## CredentialStorageError (class)

Credential storage error

Thrown when credential storage operations fail (read, write, delete).
Indicates which storage mechanism failed (keychain vs encrypted file).

**Signature**

```ts
export declare class CredentialStorageError
```

**Example**

```ts
new CredentialStorageError({
  message: "Failed to save credentials to system keychain",
  storage: "keychain",
  operation: "write",
  cause: "Access denied to macOS Keychain",
  fallbackAvailable: true
})
```

Added in v0.0.3

## NetworkError (class)

Network error for connection failures

Thrown when network connectivity issues occur.
Indicates whether the error is retryable.

**Signature**

```ts
export declare class NetworkError
```

**Example**

```ts
new NetworkError({
  message: "Connection timeout after 30 seconds",
  cause: timeoutError,
  retryable: true,
  context: {
    url: "https://api.pingone.com/v1/environments/env-123/users",
    timeout: 30000
  }
})
```

## OAuthFlowError (class)

OAuth flow error

Thrown when OAuth client credentials flow fails at any step.
Includes the specific step where failure occurred for debugging.

**Signature**

```ts
export declare class OAuthFlowError
```

**Example**

```ts
new OAuthFlowError({
  message: "Failed to exchange client credentials for access token",
  cause: "Invalid client_secret provided",
  step: "token_exchange",
  context: {
    clientId: "abc123",
    environmentId: "env-456"
  }
})
```

Added in v0.0.3

## PingOneApiError (class)

PingOne API error with full response details

Thrown when API requests fail. Includes the actual error response from PingOne API,
not just the HTTP status code.

**Signature**

```ts
export declare class PingOneApiError
```

**Example**

```ts
new PingOneApiError({
  message: "User email already exists",
  status: 422,
  errorCode: "CONSTRAINT_VIOLATION",
  errorDetails: { field: "email", reason: "duplicate" },
  requestId: "req-abc123",
  context: {
    method: "POST",
    url: "https://api.pingone.com/v1/environments/env-123/users",
    body: { username: "john", email: "john@example.com" }
  }
})
```

## PingOneAuthError (class)

PingOne authentication error

Thrown when authentication fails or credentials are missing.
Provides context about which credentials are missing or invalid.

Note: "PingOne Token" refers to an OAuth 2.0 Access Token from the PingOne Management API.

**Signature**

```ts
export declare class PingOneAuthError
```

**Example**

```ts
new PingOneAuthError({
  message: "No PingOne access token provided",
  cause: "Missing PINGONE_TOKEN environment variable. Set your OAuth 2.0 access token from PingOne Management API.",
  context: {
    environmentId: "env-123",
    accessTokenProvided: false
  }
})
```

## PingOneValidationError (class)

Input validation error

Thrown when user input fails validation before making API requests.
Includes the specific field, value, and validation constraints.

**Signature**

```ts
export declare class PingOneValidationError
```

**Example**

```ts
new PingOneValidationError({
  message: "Invalid email format",
  field: "email",
  value: "not-an-email",
  constraints: ["Must be valid email format", "Must not be empty"]
})
```

## RateLimitError (class)

Rate limit error

Thrown when API rate limits are exceeded.
Includes retry timing information.

**Signature**

```ts
export declare class RateLimitError
```

**Example**

```ts
new RateLimitError({
  message: "Rate limit exceeded. Retry after 60 seconds",
  retryAfter: 60,
  limit: 100,
  remaining: 0
})
```

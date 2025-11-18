/**
 * Enhanced Error Types for PingOne CLI
 *
 * Defines structured error types using Effect's Data.TaggedError with comprehensive context.
 * All errors follow these principles:
 * - Type-safe and structured for programmatic handling
 * - Include human-readable messages
 * - Provide context for debugging and logging
 * - Support error recovery strategies
 *
 * @since 0.0.1
 */
import * as Data from "effect/Data"

/**
 * PingOne authentication error
 *
 * Thrown when authentication fails or credentials are missing.
 * Provides context about which credentials are missing or invalid.
 *
 * Note: "PingOne Token" refers to an OAuth 2.0 Access Token from the PingOne Management API.
 *
 * @example
 * ```ts
 * new PingOneAuthError({
 *   message: "No PingOne access token provided",
 *   cause: "Missing PINGONE_TOKEN environment variable. Set your OAuth 2.0 access token from PingOne Management API.",
 *   context: {
 *     environmentId: "env-123",
 *     accessTokenProvided: false
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class PingOneAuthError extends Data.TaggedError("PingOneAuthError")<{
  readonly message: string
  readonly cause: string
  readonly context?: {
    readonly environmentId?: string
    readonly accessTokenProvided: boolean
  }
}> {}

/**
 * PingOne API error with full response details
 *
 * Thrown when API requests fail. Includes the actual error response from PingOne API,
 * not just the HTTP status code.
 *
 * @example
 * ```ts
 * new PingOneApiError({
 *   message: "User email already exists",
 *   status: 422,
 *   errorCode: "CONSTRAINT_VIOLATION",
 *   errorDetails: { field: "email", reason: "duplicate" },
 *   requestId: "req-abc123",
 *   context: {
 *     method: "POST",
 *     url: "https://api.pingone.com/v1/environments/env-123/users",
 *     body: { username: "john", email: "john@example.com" }
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class PingOneApiError extends Data.TaggedError("PingOneApiError")<{
  readonly message: string
  readonly status: number
  readonly errorCode?: string
  readonly errorDetails?: unknown
  readonly requestId?: string
  readonly context?: {
    readonly method: string
    readonly url: string
    readonly body?: unknown
  }
}> {}

/**
 * Input validation error
 *
 * Thrown when user input fails validation before making API requests.
 * Includes the specific field, value, and validation constraints.
 *
 * @example
 * ```ts
 * new PingOneValidationError({
 *   message: "Invalid email format",
 *   field: "email",
 *   value: "not-an-email",
 *   constraints: ["Must be valid email format", "Must not be empty"]
 * })
 * ```
 *
 * @since 0.0.1
 */
export class PingOneValidationError extends Data.TaggedError("PingOneValidationError")<{
  readonly message: string
  readonly field: string
  readonly value?: unknown
  readonly constraints?: ReadonlyArray<string>
}> {}

/**
 * Network error for connection failures
 *
 * Thrown when network connectivity issues occur.
 * Indicates whether the error is retryable.
 *
 * @example
 * ```ts
 * new NetworkError({
 *   message: "Connection timeout after 30 seconds",
 *   cause: timeoutError,
 *   retryable: true,
 *   context: {
 *     url: "https://api.pingone.com/v1/environments/env-123/users",
 *     timeout: 30000
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly message: string
  readonly cause: unknown
  readonly retryable: boolean
  readonly context?: {
    readonly url: string
    readonly timeout?: number
  }
}> {}

/**
 * Rate limit error
 *
 * Thrown when API rate limits are exceeded.
 * Includes retry timing information.
 *
 * @example
 * ```ts
 * new RateLimitError({
 *   message: "Rate limit exceeded. Retry after 60 seconds",
 *   retryAfter: 60,
 *   limit: 100,
 *   remaining: 0
 * })
 * ```
 *
 * @since 0.0.1
 */
export class RateLimitError extends Data.TaggedError("RateLimitError")<{
  readonly message: string
  readonly retryAfter: number
  readonly limit: number
  readonly remaining: number
}> {}

/**
 * OAuth flow error
 *
 * Thrown when OAuth client credentials flow fails at any step.
 * Includes the specific step where failure occurred for debugging.
 *
 * @example
 * ```ts
 * new OAuthFlowError({
 *   message: "Failed to exchange client credentials for access token",
 *   cause: "Invalid client_secret provided",
 *   step: "token_exchange",
 *   context: {
 *     clientId: "abc123",
 *     environmentId: "env-456"
 *   }
 * })
 * ```
 *
 * @since 0.0.3
 */
export class OAuthFlowError extends Data.TaggedError("OAuthFlowError")<{
  readonly message: string
  readonly cause: string
  readonly step:
    | "token_exchange"
    | "token_refresh"
    | "token_validation"
    | "credential_retrieval"
    | "credential_storage"
    | "credential_deletion"
  readonly context?: {
    readonly clientId?: string
    readonly environmentId?: string
    readonly tokenEndpoint?: string
  }
}> {}

/**
 * Credential storage error
 *
 * Thrown when credential storage operations fail (read, write, delete).
 * Indicates which storage mechanism failed (keychain vs encrypted file).
 *
 * @example
 * ```ts
 * new CredentialStorageError({
 *   message: "Failed to save credentials to system keychain",
 *   storage: "keychain",
 *   operation: "write",
 *   cause: "Access denied to macOS Keychain",
 *   fallbackAvailable: true
 * })
 * ```
 *
 * @since 0.0.3
 */
export class CredentialStorageError extends Data.TaggedError("CredentialStorageError")<{
  readonly message: string
  readonly storage: "keychain" | "encrypted_file" | "environment"
  readonly operation: "read" | "write" | "delete"
  readonly cause: string
  readonly fallbackAvailable?: boolean
}> {}

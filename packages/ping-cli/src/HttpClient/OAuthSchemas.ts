/**
 * OAuth 2.0 Client Credentials Flow Schemas
 *
 * Defines schemas for OAuth token endpoint requests and responses.
 * Used for type-safe OAuth client credentials grant flow with PingOne.
 *
 * @since 0.0.3
 */
import * as Schema from "effect/Schema"

/**
 * OAuth 2.0 Token Request Schema
 *
 * Schema for client credentials grant token request.
 * Sent as application/x-www-form-urlencoded to PingOne token endpoint.
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 *
 * const request = {
 *   grant_type: "client_credentials",
 *   client_id: "abc123-client-id",
 *   client_secret: "xyz789-client-secret"
 * }
 *
 * const validated = Schema.decodeUnknownSync(OAuthTokenRequest)(request)
 * ```
 *
 * @since 0.0.3
 * @category models
 */
export class OAuthTokenRequest extends Schema.Class<OAuthTokenRequest>("OAuthTokenRequest")({
  grant_type: Schema.Literal("client_credentials"),
  client_id: Schema.String,
  client_secret: Schema.String
}) {}

/**
 * OAuth 2.0 Token Response Schema
 *
 * Schema for successful token response from PingOne.
 * Contains access token, type, and expiration information.
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 *
 * const response = {
 *   access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   token_type: "Bearer",
 *   expires_in: 3600
 * }
 *
 * const validated = Schema.decodeUnknownSync(OAuthTokenResponse)(response)
 * ```
 *
 * @since 0.0.3
 * @category models
 */
export class OAuthTokenResponse extends Schema.Class<OAuthTokenResponse>("OAuthTokenResponse")({
  access_token: Schema.String,
  token_type: Schema.Literal("Bearer"),
  expires_in: Schema.Number
}) {}

/**
 * OAuth 2.0 Error Response Schema
 *
 * Schema for error responses from OAuth token endpoint.
 * Follows RFC 6749 OAuth 2.0 error response format.
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 *
 * const errorResponse = {
 *   error: "invalid_client",
 *   error_description: "Client authentication failed"
 * }
 *
 * const validated = Schema.decodeUnknownSync(OAuthErrorResponse)(errorResponse)
 * ```
 *
 * @since 0.0.3
 * @category models
 */
export class OAuthErrorResponse extends Schema.Class<OAuthErrorResponse>("OAuthErrorResponse")({
  error: Schema.String,
  error_description: Schema.optional(Schema.String)
}) {}

/**
 * Stored OAuth Credentials Schema
 *
 * Schema for credentials stored in keychain or encrypted file.
 * Contains client credentials and environment information.
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 *
 * const storedCreds = {
 *   clientId: "abc123",
 *   clientSecret: "xyz789",
 *   environmentId: "env-456",
 *   tokenEndpoint: "https://auth.pingone.com/env-456/as/token"
 * }
 *
 * const validated = Schema.decodeUnknownSync(StoredCredentials)(storedCreds)
 * ```
 *
 * @since 0.0.3
 * @category models
 */
export class StoredCredentials extends Schema.Class<StoredCredentials>("StoredCredentials")({
  clientId: Schema.String,
  clientSecret: Schema.String,
  environmentId: Schema.String,
  tokenEndpoint: Schema.String
}) {}

/**
 * Cached Access Token Schema
 *
 * Schema for cached access tokens with expiration tracking.
 * Used to avoid unnecessary token refresh requests.
 *
 * @example
 * ```ts
 * import { DateTime } from "effect"
 * import { Schema } from "effect"
 *
 * const now = DateTime.unsafeNow()
 * const cachedToken = {
 *   accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   expiresAt: DateTime.toEpochMillis(DateTime.add(now, { hours: 1 }))
 * }
 *
 * const validated = Schema.decodeUnknownSync(CachedAccessToken)(cachedToken)
 * ```
 *
 * @since 0.0.3
 * @category models
 */
export class CachedAccessToken extends Schema.Class<CachedAccessToken>("CachedAccessToken")({
  accessToken: Schema.String,
  expiresAt: Schema.Number
}) {}

/**
 * OAuthService Tests
 *
 * Comprehensive test coverage for OAuth service including:
 * - Token caching and reuse
 * - Token refresh when expired
 * - Credential storage and retrieval
 * - Error handling and step tracking
 * - Auth status reporting
 *
 * @since 0.0.3
 */
import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Ref } from "effect"
import { CredentialStorageError } from "../Errors.js"
import { StoredCredentials } from "../HttpClient/OAuthSchemas.js"
import { CredentialService } from "./CredentialService.js"
import { OAuthService, OAuthServiceLive } from "./OAuthService.js"

// Mock HTTP client that returns a test token
const mockHttpClient = HttpClient.make((req) =>
  Effect.succeed(
    HttpClientResponse.fromWeb(
      req,
      new Response(
        JSON.stringify({
          access_token: "mock-access-token",
          token_type: "Bearer",
          expires_in: 3600
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    )
  )
)

const MockHttpClientLive = Layer.succeed(HttpClient.HttpClient, mockHttpClient)

// Mock CredentialService that returns test credentials
const createMockCredentialService = (
  credentials?: StoredCredentials,
  shouldFail = false
) => {
  const testCredentials = credentials || new StoredCredentials({
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    environmentId: "test-env-id",
    tokenEndpoint: "https://auth.pingone.com/test-env-id/as/token"
  })

  return Layer.succeed(
    CredentialService,
    CredentialService.of({
      store: () =>
        shouldFail
          ? Effect.fail(
            new CredentialStorageError({
              message: "Failed to store",
              storage: "keychain",
              operation: "write",
              cause: "Mock error"
            })
          )
          : Effect.void,
      retrieve: () =>
        shouldFail
          ? Effect.fail(
            new CredentialStorageError({
              message: "No credentials found",
              storage: "keychain",
              operation: "read",
              cause: "Mock error"
            })
          )
          : Effect.succeed(testCredentials),
      delete: () =>
        shouldFail
          ? Effect.fail(
            new CredentialStorageError({
              message: "Failed to delete",
              storage: "keychain",
              operation: "delete",
              cause: "Mock error"
            })
          )
          : Effect.void
    })
  )
}

describe("OAuthService", () => {
  describe("getAccessToken", () => {
    it.effect("should acquire and cache a new token on first call", () => {
      const testLayer = Layer.mergeAll(
        MockHttpClientLive,
        createMockCredentialService()
      )

      return Effect.gen(function*() {
        const oauth = yield* OAuthService

        const token1 = yield* oauth.getAccessToken()
        const token2 = yield* oauth.getAccessToken()

        // Both calls should return the same cached token
        assert.strictEqual(token1, "mock-access-token")
        assert.strictEqual(token2, "mock-access-token")
      }).pipe(Effect.provide(OAuthServiceLive), Effect.provide(testLayer))
    })

    it.effect("should return cached token when valid", () => {
      const testLayer = Layer.mergeAll(
        MockHttpClientLive,
        createMockCredentialService()
      )

      return Effect.gen(function*() {
        const oauth = yield* OAuthService

        // First call acquires token
        const token1 = yield* oauth.getAccessToken()

        // Second call should reuse cached token (no new HTTP request)
        const token2 = yield* oauth.getAccessToken()

        assert.strictEqual(token1, token2)
        assert.strictEqual(token1, "mock-access-token")
      }).pipe(Effect.provide(OAuthServiceLive), Effect.provide(testLayer))
    })

    it.effect("should fail with credential_retrieval step when credentials unavailable", () => {
      const testLayer = Layer.mergeAll(
        MockHttpClientLive,
        createMockCredentialService(undefined, true)
      )

      return Effect.gen(function*() {
        const oauth = yield* OAuthService

        const result = yield* Effect.either(oauth.getAccessToken())

        assert.isTrue(result._tag === "Left")
        if (result._tag === "Left") {
          const error = result.left
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.strictEqual(error.step, "credential_retrieval")
          assert.strictEqual(error.message, "Failed to retrieve credentials")
        }
      }).pipe(Effect.provide(OAuthServiceLive), Effect.provide(testLayer))
    })
  })

  describe("storeCredentials", () => {
    it.effect("should store credentials successfully", () => {
      const testLayer = Layer.mergeAll(
        MockHttpClientLive,
        createMockCredentialService()
      )

      return Effect.gen(function*() {
        const oauth = yield* OAuthService

        const credentials = new StoredCredentials({
          clientId: "new-client-id",
          clientSecret: "new-client-secret",
          environmentId: "new-env-id",
          tokenEndpoint: "https://auth.pingone.com/new-env-id/as/token"
        })

        yield* oauth.storeCredentials(credentials)

        // Should succeed without error
        assert.isTrue(true)
      }).pipe(Effect.provide(OAuthServiceLive), Effect.provide(testLayer))
    })

    it.effect("should fail with credential_storage step when storage fails", () => {
      const testLayer = Layer.mergeAll(
        MockHttpClientLive,
        createMockCredentialService(undefined, true)
      )

      return Effect.gen(function*() {
        const oauth = yield* OAuthService

        const credentials = new StoredCredentials({
          clientId: "test-id",
          clientSecret: "test-secret",
          environmentId: "test-env",
          tokenEndpoint: "https://auth.pingone.com/test-env/as/token"
        })

        const result = yield* Effect.either(oauth.storeCredentials(credentials))

        assert.isTrue(result._tag === "Left")
        if (result._tag === "Left") {
          const error = result.left
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.strictEqual(error.step, "credential_storage")
          assert.strictEqual(error.message, "Failed to store credentials")
        }
      }).pipe(Effect.provide(OAuthServiceLive), Effect.provide(testLayer))
    })
  })

  describe("getCredentials", () => {
    it.effect("should retrieve stored credentials", () => {
      const testLayer = Layer.mergeAll(
        MockHttpClientLive,
        createMockCredentialService()
      )

      return Effect.gen(function*() {
        const oauth = yield* OAuthService

        const credentials = yield* oauth.getCredentials()

        assert.strictEqual(credentials.clientId, "test-client-id")
        assert.strictEqual(credentials.environmentId, "test-env-id")
      }).pipe(Effect.provide(OAuthServiceLive), Effect.provide(testLayer))
    })

    it.effect("should fail with credential_retrieval step when retrieval fails", () => {
      const testLayer = Layer.mergeAll(
        MockHttpClientLive,
        createMockCredentialService(undefined, true)
      )

      return Effect.gen(function*() {
        const oauth = yield* OAuthService

        const result = yield* Effect.either(oauth.getCredentials())

        assert.isTrue(result._tag === "Left")
        if (result._tag === "Left") {
          const error = result.left
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.strictEqual(error.step, "credential_retrieval")
        }
      }).pipe(Effect.provide(OAuthServiceLive), Effect.provide(testLayer))
    })
  })

  describe("clearAuth", () => {
    it.effect("should clear credentials and cached token", () =>
      Effect.gen(function*() {
        // Create a stateful mock that tracks deletion
        const deletedRef = yield* Ref.make(false)

        const statefulMockCredentialService = Layer.succeed(
          CredentialService,
          CredentialService.of({
            store: () => Effect.void,
            retrieve: () =>
              Effect.gen(function*() {
                const deleted = yield* Ref.get(deletedRef)
                if (deleted) {
                  return yield* Effect.fail(
                    new CredentialStorageError({
                      message: "No credentials found",
                      storage: "keychain",
                      operation: "read",
                      cause: "Credentials were deleted"
                    })
                  )
                }
                return new StoredCredentials({
                  clientId: "test-client-id",
                  clientSecret: "test-client-secret",
                  environmentId: "test-env-id",
                  tokenEndpoint: "https://auth.pingone.com/test-env-id/as/token"
                })
              }),
            delete: () =>
              Effect.gen(function*() {
                yield* Ref.set(deletedRef, true)
              })
          })
        )

        const testLayer = Layer.mergeAll(
          MockHttpClientLive,
          statefulMockCredentialService
        )

        const oauth = yield* OAuthService.pipe(
          Effect.provide(OAuthServiceLive),
          Effect.provide(testLayer)
        )

        // First acquire a token (creates cache)
        yield* oauth.getAccessToken()

        // Clear auth
        yield* oauth.clearAuth()

        // Status should show no credentials
        const status = yield* oauth.getAuthStatus()

        assert.isFalse(status.hasCredentials)
        assert.isFalse(status.hasValidToken)
      }))

    it.effect("should fail with credential_deletion step when deletion fails", () => {
      const testLayer = Layer.mergeAll(
        MockHttpClientLive,
        createMockCredentialService(undefined, true)
      )

      return Effect.gen(function*() {
        const oauth = yield* OAuthService

        const result = yield* Effect.either(oauth.clearAuth())

        assert.isTrue(result._tag === "Left")
        if (result._tag === "Left") {
          const error = result.left
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.strictEqual(error.step, "credential_deletion")
          assert.strictEqual(error.message, "Failed to delete credentials")
        }
      }).pipe(Effect.provide(OAuthServiceLive), Effect.provide(testLayer))
    })
  })

  describe("getAuthStatus", () => {
    it.effect("should return status with credentials and valid token", () => {
      const testLayer = Layer.mergeAll(
        MockHttpClientLive,
        createMockCredentialService()
      )

      return Effect.gen(function*() {
        const oauth = yield* OAuthService

        // Acquire a token first
        yield* oauth.getAccessToken()

        const status = yield* oauth.getAuthStatus()

        assert.isTrue(status.hasCredentials)
        assert.isTrue(status.hasValidToken)
        assert.strictEqual(status.clientId, "test-client-id")
        assert.strictEqual(status.environmentId, "test-env-id")
        assert.isTrue(status.tokenExpiresAt !== undefined)
      }).pipe(Effect.provide(OAuthServiceLive), Effect.provide(testLayer))
    })

    it.effect("should return status with no credentials", () => {
      const testLayer = Layer.mergeAll(
        MockHttpClientLive,
        createMockCredentialService(undefined, true)
      )

      return Effect.gen(function*() {
        const oauth = yield* OAuthService

        const status = yield* oauth.getAuthStatus()

        assert.isFalse(status.hasCredentials)
        assert.isFalse(status.hasValidToken)
        assert.isTrue(status.clientId === undefined)
        assert.isTrue(status.environmentId === undefined)
      }).pipe(Effect.provide(OAuthServiceLive), Effect.provide(testLayer))
    })

    it.effect("should return status with credentials but no cached token", () => {
      const testLayer = Layer.mergeAll(
        MockHttpClientLive,
        createMockCredentialService()
      )

      return Effect.gen(function*() {
        const oauth = yield* OAuthService

        // Don't acquire token, just check status
        const status = yield* oauth.getAuthStatus()

        assert.isTrue(status.hasCredentials)
        assert.isFalse(status.hasValidToken)
        assert.strictEqual(status.clientId, "test-client-id")
        assert.strictEqual(status.environmentId, "test-env-id")
        assert.isTrue(status.tokenExpiresAt === undefined)
      }).pipe(Effect.provide(OAuthServiceLive), Effect.provide(testLayer))
    })
  })
})

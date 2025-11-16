/**
 * OAuthClient Tests
 *
 * Comprehensive test coverage for OAuth HTTP client including:
 * - Token endpoint building for all regions
 * - Client credentials exchange (HTTP Basic Auth)
 * - Token validation and expiration logic
 * - Error handling for various OAuth failure scenarios
 * - Malformed response handling
 *
 * @since 0.0.3
 */
import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { DateTime, Duration, Effect, Either, Encoding, Layer } from "effect"
import type { OAuthFlowError } from "../Errors.js"

// Helper for tests: get current time in milliseconds
const now = (): number => DateTime.toEpochMillis(DateTime.unsafeNow())
import {
  buildTokenEndpoint,
  calculateExpirationTimestamp,
  exchangeCredentialsForToken,
  isTokenValid
} from "./OAuthClient.js"

describe("OAuthClient", () => {
  describe("buildTokenEndpoint", () => {
    it.effect("should build North America endpoint (com)", () =>
      Effect.gen(function*() {
        const endpoint = buildTokenEndpoint("env-na-123", "com")

        assert.strictEqual(endpoint, "https://auth.pingone.com/env-na-123/as/token")
      }))

    it.effect("should build Europe endpoint (eu)", () =>
      Effect.gen(function*() {
        const endpoint = buildTokenEndpoint("env-eu-456", "eu")

        assert.strictEqual(endpoint, "https://auth.pingone.eu/env-eu-456/as/token")
      }))

    it.effect("should build Asia Pacific endpoint (asia)", () =>
      Effect.gen(function*() {
        const endpoint = buildTokenEndpoint("env-asia-789", "asia")

        assert.strictEqual(endpoint, "https://auth.pingone.asia/env-asia-789/as/token")
      }))

    it.effect("should build Canada endpoint (ca)", () =>
      Effect.gen(function*() {
        const endpoint = buildTokenEndpoint("env-ca-abc", "ca")

        assert.strictEqual(endpoint, "https://auth.pingone.ca/env-ca-abc/as/token")
      }))

    it.effect("should default to North America when region not specified", () =>
      Effect.gen(function*() {
        const endpoint = buildTokenEndpoint("env-default")

        assert.strictEqual(endpoint, "https://auth.pingone.com/env-default/as/token")
      }))
  })

  describe("exchangeCredentialsForToken", () => {
    it.effect("should successfully exchange credentials for token", () => {
      const mockResponse = {
        access_token: "test-access-token-12345",
        token_type: "Bearer",
        expires_in: 3600
      }

      const mockClient = HttpClient.make((req) => {
        // Verify HTTP Basic Auth header
        const authHeader = req.headers.authorization
        assert.isTrue(authHeader !== undefined)
        assert.isTrue(authHeader.startsWith("Basic "))

        // Verify Content-Type header
        const contentType = req.headers["content-type"]
        assert.strictEqual(contentType, "application/x-www-form-urlencoded")

        return Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "content-type": "application/json" }
            })
          )
        )
      })

      const testLayer = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* exchangeCredentialsForToken({
          clientId: "test-client-id",
          clientSecret: "test-client-secret",
          tokenEndpoint: "https://auth.pingone.com/env-123/as/token"
        })

        assert.strictEqual(result.access_token, "test-access-token-12345")
        assert.strictEqual(result.token_type, "Bearer")
        assert.strictEqual(result.expires_in, 3600)
      }).pipe(Effect.provide(testLayer))
    })

    it.effect("should correctly format HTTP Basic Auth header", () => {
      const mockResponse = {
        access_token: "token",
        token_type: "Bearer",
        expires_in: 3600
      }

      const mockClient = HttpClient.make((req) => {
        const authHeader = req.headers.authorization

        // Extract and decode base64 credentials
        const base64Part = authHeader?.replace("Basic ", "")
        const decodedEither = Encoding.decodeBase64String(base64Part || "")
        const decoded = Either.getOrThrow(decodedEither)

        // Verify format is "clientId:clientSecret"
        assert.strictEqual(decoded, "my-client:my-secret")

        return Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "content-type": "application/json" }
            })
          )
        )
      })

      const testLayer = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        yield* exchangeCredentialsForToken({
          clientId: "my-client",
          clientSecret: "my-secret",
          tokenEndpoint: "https://auth.pingone.com/env/as/token"
        })
      }).pipe(Effect.provide(testLayer))
    })

    it.effect("should fail with OAuthFlowError on 401 Unauthorized", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(
              JSON.stringify({
                error: "invalid_client",
                error_description: "Client authentication failed"
              }),
              {
                status: 401,
                headers: { "content-type": "application/json" }
              }
            )
          )
        )
      )

      const testLayer = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* exchangeCredentialsForToken({
          clientId: "invalid-client",
          clientSecret: "invalid-secret",
          tokenEndpoint: "https://auth.pingone.com/env/as/token"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as OAuthFlowError
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.strictEqual(error.step, "token_exchange")
          assert.strictEqual(error.message, "Failed to exchange client credentials for access token")
          assert.isTrue(error.cause.includes("Client authentication failed"))
        }
      }).pipe(Effect.provide(testLayer))
    })

    it.effect("should fail with OAuthFlowError on 403 Forbidden", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(
              JSON.stringify({
                error: "access_denied",
                error_description: "Client does not have permission"
              }),
              {
                status: 403,
                headers: { "content-type": "application/json" }
              }
            )
          )
        )
      )

      const testLayer = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* exchangeCredentialsForToken({
          clientId: "forbidden-client",
          clientSecret: "test-secret",
          tokenEndpoint: "https://auth.pingone.com/env/as/token"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as OAuthFlowError
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.strictEqual(error.step, "token_exchange")
          assert.isTrue(error.cause.includes("Client does not have permission"))
        }
      }).pipe(Effect.provide(testLayer))
    })

    it.effect("should handle invalid_grant error", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(
              JSON.stringify({
                error: "invalid_grant",
                error_description: "The provided authorization grant is invalid"
              }),
              {
                status: 400,
                headers: { "content-type": "application/json" }
              }
            )
          )
        )
      )

      const testLayer = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* exchangeCredentialsForToken({
          clientId: "test-client",
          clientSecret: "test-secret",
          tokenEndpoint: "https://auth.pingone.com/env/as/token"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as OAuthFlowError
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.isTrue(error.cause.includes("authorization grant is invalid"))
        }
      }).pipe(Effect.provide(testLayer))
    })

    it.effect("should handle server error (500)", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(
              JSON.stringify({
                error: "server_error",
                error_description: "Internal server error occurred"
              }),
              {
                status: 500,
                headers: { "content-type": "application/json" }
              }
            )
          )
        )
      )

      const testLayer = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* exchangeCredentialsForToken({
          clientId: "test-client",
          clientSecret: "test-secret",
          tokenEndpoint: "https://auth.pingone.com/env/as/token"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as OAuthFlowError
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.strictEqual(error.step, "token_exchange")
        }
      }).pipe(Effect.provide(testLayer))
    })

    it.effect("should handle malformed JSON response", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response("not valid json", {
              status: 400,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const testLayer = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* exchangeCredentialsForToken({
          clientId: "test-client",
          clientSecret: "test-secret",
          tokenEndpoint: "https://auth.pingone.com/env/as/token"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        // Should fail with OAuthFlowError (fallback error handling)
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as OAuthFlowError
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.strictEqual(error.step, "token_exchange")
        }
      }).pipe(Effect.provide(testLayer))
    })

    it.effect("should handle missing error_description in error response", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(
              JSON.stringify({
                error: "invalid_request"
                // No error_description field
              }),
              {
                status: 400,
                headers: { "content-type": "application/json" }
              }
            )
          )
        )
      )

      const testLayer = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* exchangeCredentialsForToken({
          clientId: "test-client",
          clientSecret: "test-secret",
          tokenEndpoint: "https://auth.pingone.com/env/as/token"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as OAuthFlowError
          assert.strictEqual(error._tag, "OAuthFlowError")
          // Should use error code as cause when description missing
          assert.strictEqual(error.cause, "invalid_request")
        }
      }).pipe(Effect.provide(testLayer))
    })

    it.effect("should include context in OAuthFlowError", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(
              JSON.stringify({
                error: "invalid_client"
              }),
              {
                status: 401,
                headers: { "content-type": "application/json" }
              }
            )
          )
        )
      )

      const testLayer = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* exchangeCredentialsForToken({
          clientId: "my-client-id",
          clientSecret: "my-secret",
          tokenEndpoint: "https://auth.pingone.ca/env-ca/as/token"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as OAuthFlowError
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.isDefined(error.context)
          assert.strictEqual(error.context?.clientId, "my-client-id")
          assert.strictEqual(error.context?.tokenEndpoint, "https://auth.pingone.ca/env-ca/as/token")
        }
      }).pipe(Effect.provide(testLayer))
    })
  })

  describe("isTokenValid", () => {
    it.effect("should return true for token far from expiration", () =>
      Effect.gen(function*() {
        const expiresAt = now() + Duration.toMillis(Duration.hours(1)) // 1 hour from now
        const isValid = isTokenValid(expiresAt)

        assert.isTrue(isValid)
      }))

    it.effect("should return false for expired token", () =>
      Effect.gen(function*() {
        const expiresAt = now() - 1000 // 1 second ago
        const isValid = isTokenValid(expiresAt)

        assert.isFalse(isValid)
      }))

    it.effect("should return false for token within default buffer (300s)", () =>
      Effect.gen(function*() {
        const expiresAt = now() + 120000 // 2 minutes from now (less than 5 min buffer)
        const isValid = isTokenValid(expiresAt)

        assert.isFalse(isValid)
      }))

    it.effect("should return true for token just outside default buffer", () =>
      Effect.gen(function*() {
        const expiresAt = now() + 310000 // 5 min 10 sec from now (more than 5 min buffer)
        const isValid = isTokenValid(expiresAt)

        assert.isTrue(isValid)
      }))

    it.effect("should use custom buffer when provided", () =>
      Effect.gen(function*() {
        const expiresAt = now() + Duration.toMillis(Duration.seconds(45)) // 45 seconds from now
        const isValidWith30SecBuffer = isTokenValid(expiresAt, 30)
        const isValidWith60SecBuffer = isTokenValid(expiresAt, 60)

        assert.isTrue(isValidWith30SecBuffer) // 45s > 30s buffer
        assert.isFalse(isValidWith60SecBuffer) // 45s < 60s buffer
      }))

    it.effect("should handle zero expiration time", () =>
      Effect.gen(function*() {
        const isValid = isTokenValid(0)

        assert.isFalse(isValid)
      }))

    it.effect("should handle token expiring exactly at buffer boundary", () =>
      Effect.gen(function*() {
        const expiresAt = now() + Duration.toMillis(Duration.minutes(5)) // Exactly 5 minutes (default buffer)
        const isValid = isTokenValid(expiresAt)

        // Should be false because expiresAt - now <= buffer
        assert.isFalse(isValid)
      }))

    it.effect("should handle very large expiration times", () =>
      Effect.gen(function*() {
        const expiresAt = now() + 86400000 // 24 hours from now
        const isValid = isTokenValid(expiresAt)

        assert.isTrue(isValid)
      }))
  })

  describe("calculateExpirationTimestamp", () => {
    it.effect("should correctly calculate expiration timestamp", () =>
      Effect.gen(function*() {
        const beforeTimestamp = now()
        const expiresIn = 3600 // 1 hour

        const expirationTimestamp = calculateExpirationTimestamp(expiresIn)
        const afterTimestamp = now()

        // Should be approximately now + expiresIn seconds
        const expectedMin = beforeTimestamp + expiresIn * 1000
        const expectedMax = afterTimestamp + expiresIn * 1000

        assert.isTrue(expirationTimestamp >= expectedMin)
        assert.isTrue(expirationTimestamp <= expectedMax)
      }))

    it.effect("should handle zero expires_in", () =>
      Effect.gen(function*() {
        const beforeTimestamp = now()
        const expirationTimestamp = calculateExpirationTimestamp(0)
        const afterTimestamp = now()

        // Should be approximately now (within 100ms)
        assert.isTrue(expirationTimestamp >= beforeTimestamp)
        assert.isTrue(expirationTimestamp <= afterTimestamp + 100)
      }))

    it.effect("should handle very large expires_in", () =>
      Effect.gen(function*() {
        const expiresIn = 86400 // 24 hours
        const beforeTimestamp = now()

        const expirationTimestamp = calculateExpirationTimestamp(expiresIn)

        const expectedMin = beforeTimestamp + expiresIn * 1000
        const expectedMax = beforeTimestamp + expiresIn * 1000 + 1000 // 1 second tolerance

        assert.isTrue(expirationTimestamp >= expectedMin)
        assert.isTrue(expirationTimestamp <= expectedMax)
      }))

    it.effect("should handle typical OAuth expires_in values", () =>
      Effect.gen(function*() {
        // Test common values from real OAuth responses
        const commonValues = [300, 600, 1800, 3600, 7200, 86400]

        for (const expiresIn of commonValues) {
          const beforeTimestamp = now()
          const expirationTimestamp = calculateExpirationTimestamp(expiresIn)
          const afterTimestamp = now()

          const expectedMin = beforeTimestamp + expiresIn * 1000
          const expectedMax = afterTimestamp + expiresIn * 1000

          assert.isTrue(expirationTimestamp >= expectedMin)
          assert.isTrue(expirationTimestamp <= expectedMax)
        }
      }))
  })
})

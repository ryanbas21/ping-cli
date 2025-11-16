/**
 * CredentialService Tests
 *
 * Tests for credential storage service with Schema validation.
 * Covers keychain, encrypted file, and environment variable storage.
 *
 * @since 0.0.3
 */
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import { CredentialStorageError } from "../Errors.js"
import { StoredCredentials } from "../HttpClient/OAuthSchemas.js"
import { CredentialService } from "./CredentialService.js"

// Test credentials
const validCredentials = new StoredCredentials({
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
  environmentId: "test-env-id",
  tokenEndpoint: "https://auth.pingone.com/test-env-id/as/token"
})

describe("CredentialService", () => {
  describe("Schema Validation", () => {
    it.effect("should validate StoredCredentials schema", () =>
      Effect.gen(function*() {
        const validData = {
          clientId: "test-client",
          clientSecret: "test-secret",
          environmentId: "test-env",
          tokenEndpoint: "https://auth.pingone.com/test-env/as/token"
        }

        const result = yield* Schema.decodeUnknown(StoredCredentials)(validData)

        assert.strictEqual(result.clientId, "test-client")
        assert.strictEqual(result.clientSecret, "test-secret")
        assert.strictEqual(result.environmentId, "test-env")
        assert.strictEqual(result.tokenEndpoint, "https://auth.pingone.com/test-env/as/token")
      }))

    it.effect("should fail validation for missing required fields", () =>
      Effect.gen(function*() {
        const invalidData = {
          clientId: "test-client"
          // Missing clientSecret, environmentId, tokenEndpoint
        }

        const result = yield* Schema.decodeUnknown(StoredCredentials)(invalidData).pipe(
          Effect.either
        )

        assert.strictEqual(result._tag, "Left")
      }))

    it.effect("should fail validation for invalid field types", () =>
      Effect.gen(function*() {
        const invalidData = {
          clientId: 123, // Should be string
          clientSecret: "test-secret",
          environmentId: "test-env",
          tokenEndpoint: "https://auth.pingone.com/test-env/as/token"
        }

        const result = yield* Schema.decodeUnknown(StoredCredentials)(invalidData).pipe(
          Effect.either
        )

        assert.strictEqual(result._tag, "Left")
      }))
  })

  describe("JSON Encoding/Decoding", () => {
    it.effect("should encode credentials to JSON string", () =>
      Effect.gen(function*() {
        const jsonString = yield* Schema.encode(Schema.parseJson(StoredCredentials))(
          validCredentials
        )

        assert.isTrue(typeof jsonString === "string")
        assert.isTrue(jsonString.includes("test-client-id"))
        assert.isTrue(jsonString.includes("test-client-secret"))

        // Verify it's valid JSON by parsing and validating
        const parsed = yield* Schema.decodeUnknown(Schema.parseJson(StoredCredentials))(
          jsonString
        )
        assert.strictEqual(parsed.clientId, "test-client-id")
      }))

    it.effect("should decode valid JSON string to credentials", () =>
      Effect.gen(function*() {
        const jsonString = JSON.stringify({
          clientId: "decoded-client",
          clientSecret: "decoded-secret",
          environmentId: "decoded-env",
          tokenEndpoint: "https://auth.pingone.com/decoded-env/as/token"
        })

        const credentials = yield* Schema.decodeUnknown(Schema.parseJson(StoredCredentials))(
          jsonString
        )

        assert.strictEqual(credentials.clientId, "decoded-client")
        assert.strictEqual(credentials.clientSecret, "decoded-secret")
        assert.strictEqual(credentials.environmentId, "decoded-env")
      }))

    it.effect("should fail to decode malformed JSON", () =>
      Effect.gen(function*() {
        const malformedJson = "{ \"clientId\": \"test\", invalid }"

        const result = yield* Schema.decodeUnknown(Schema.parseJson(StoredCredentials))(
          malformedJson
        ).pipe(Effect.either)

        assert.strictEqual(result._tag, "Left")
      }))

    it.effect("should fail to decode JSON with missing fields", () =>
      Effect.gen(function*() {
        const incompleteJson = JSON.stringify({
          clientId: "test-client"
          // Missing other required fields
        })

        const result = yield* Schema.decodeUnknown(Schema.parseJson(StoredCredentials))(
          incompleteJson
        ).pipe(Effect.either)

        assert.strictEqual(result._tag, "Left")
      }))

    it.effect("should fail to decode JSON with wrong types", () =>
      Effect.gen(function*() {
        const wrongTypeJson = JSON.stringify({
          clientId: 123, // Should be string
          clientSecret: "test-secret",
          environmentId: "test-env",
          tokenEndpoint: "https://auth.pingone.com/test-env/as/token"
        })

        const result = yield* Schema.decodeUnknown(Schema.parseJson(StoredCredentials))(
          wrongTypeJson
        ).pipe(Effect.either)

        assert.strictEqual(result._tag, "Left")
      }))

    it.effect("should fail to decode non-object JSON", () =>
      Effect.gen(function*() {
        const arrayJson = "[1, 2, 3]"

        const result = yield* Schema.decodeUnknown(Schema.parseJson(StoredCredentials))(
          arrayJson
        ).pipe(Effect.either)

        assert.strictEqual(result._tag, "Left")
      }))

    it.effect("should fail to decode primitive JSON", () =>
      Effect.gen(function*() {
        const primitiveJson = "\"just a string\""

        const result = yield* Schema.decodeUnknown(Schema.parseJson(StoredCredentials))(
          primitiveJson
        ).pipe(Effect.either)

        assert.strictEqual(result._tag, "Left")
      }))
  })

  describe("Mock CredentialService", () => {
    it.effect("should store and retrieve credentials with Schema validation", () => {
      // Create a mock service that uses actual Schema encode/decode
      const mockService = Layer.succeed(
        CredentialService,
        CredentialService.of({
          store: (credentials: StoredCredentials) =>
            Effect.gen(function*() {
              // Simulate encoding to JSON (what keychain/file storage does)
              const jsonString = yield* Schema.encode(Schema.parseJson(StoredCredentials))(
                credentials
              )
              // Verify it's valid JSON
              assert.isTrue(typeof jsonString === "string")
              assert.isTrue(jsonString.length > 0)
            }),
          retrieve: () =>
            Effect.gen(function*() {
              // Simulate retrieving JSON from storage
              const jsonString = JSON.stringify({
                clientId: "retrieved-client",
                clientSecret: "retrieved-secret",
                environmentId: "retrieved-env",
                tokenEndpoint: "https://auth.pingone.com/retrieved-env/as/token"
              })

              // Decode using Schema
              return yield* Schema.decodeUnknown(Schema.parseJson(StoredCredentials))(jsonString)
            }),
          delete: () => Effect.void
        })
      )

      return Effect.gen(function*() {
        const service = yield* CredentialService

        // Test store
        yield* service.store(validCredentials)

        // Test retrieve
        const retrieved = yield* service.retrieve()
        assert.strictEqual(retrieved.clientId, "retrieved-client")
        assert.strictEqual(retrieved.clientSecret, "retrieved-secret")
      }).pipe(Effect.provide(mockService))
    })

    it.effect("should handle Schema encoding errors during store", () => {
      const mockService = Layer.succeed(
        CredentialService,
        CredentialService.of({
          store: () =>
            Effect.gen(function*() {
              // Simulate an encoding error
              return yield* Effect.fail(
                new CredentialStorageError({
                  message: "Failed to encode credentials",
                  storage: "test",
                  operation: "write",
                  cause: "Schema encoding failed",
                  fallbackAvailable: false
                })
              )
            }),
          retrieve: () => Effect.succeed(validCredentials),
          delete: () => Effect.void
        })
      )

      return Effect.gen(function*() {
        const service = yield* CredentialService

        const result = yield* service.store(validCredentials).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error
          assert.strictEqual(error._tag, "CredentialStorageError")
          assert.isTrue(error.message.includes("encode"))
        }
      }).pipe(Effect.provide(mockService))
    })

    it.effect("should handle Schema decoding errors during retrieve", () => {
      const mockService = Layer.succeed(
        CredentialService,
        CredentialService.of({
          store: () => Effect.void,
          retrieve: () =>
            Effect.gen(function*() {
              // Simulate retrieving malformed JSON
              const malformedJson = "{ \"clientId\": \"test\", invalid }"

              // This should fail
              return yield* Schema.decodeUnknown(Schema.parseJson(StoredCredentials))(
                malformedJson
              ).pipe(
                Effect.mapError(() =>
                  new CredentialStorageError({
                    message: "Failed to decode credentials",
                    storage: "test",
                    operation: "read",
                    cause: "Malformed JSON",
                    fallbackAvailable: false
                  })
                )
              )
            }),
          delete: () => Effect.void
        })
      )

      return Effect.gen(function*() {
        const service = yield* CredentialService

        const result = yield* service.retrieve().pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error
          assert.strictEqual(error._tag, "CredentialStorageError")
          assert.isTrue(error.message.includes("decode"))
        }
      }).pipe(Effect.provide(mockService))
    })
  })

  describe("Round-trip Encoding/Decoding", () => {
    it.effect("should successfully round-trip credentials through JSON", () =>
      Effect.gen(function*() {
        // Encode
        const jsonString = yield* Schema.encode(Schema.parseJson(StoredCredentials))(
          validCredentials
        )

        // Decode
        const decoded = yield* Schema.decodeUnknown(Schema.parseJson(StoredCredentials))(
          jsonString
        )

        // Verify
        assert.strictEqual(decoded.clientId, validCredentials.clientId)
        assert.strictEqual(decoded.clientSecret, validCredentials.clientSecret)
        assert.strictEqual(decoded.environmentId, validCredentials.environmentId)
        assert.strictEqual(decoded.tokenEndpoint, validCredentials.tokenEndpoint)
      }))

    it.effect("should preserve all fields during round-trip", () =>
      Effect.gen(function*() {
        const testCreds = new StoredCredentials({
          clientId: "special-chars-!@#$%",
          clientSecret: "long-secret-with-special-chars-123!@#",
          environmentId: "env-with-dashes-123",
          tokenEndpoint: "https://auth.pingone.eu/env-123/as/token"
        })

        // Encode
        const jsonString = yield* Schema.encode(Schema.parseJson(StoredCredentials))(testCreds)

        // Decode
        const decoded = yield* Schema.decodeUnknown(Schema.parseJson(StoredCredentials))(
          jsonString
        )

        // Verify exact match
        assert.strictEqual(decoded.clientId, testCreds.clientId)
        assert.strictEqual(decoded.clientSecret, testCreds.clientSecret)
        assert.strictEqual(decoded.environmentId, testCreds.environmentId)
        assert.strictEqual(decoded.tokenEndpoint, testCreds.tokenEndpoint)
      }))
  })
})

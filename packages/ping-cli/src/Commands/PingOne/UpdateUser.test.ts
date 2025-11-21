/**
 * Tests for PingOne user update command
 *
 * @since 0.0.1
 */
import { HttpClient, HttpClientError } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { ConfigProvider, Effect, Layer, Option, Redacted } from "effect"
import { MockServicesLive } from "../../test-helpers/TestLayers.js"
import { updateUser } from "./UpdateUser.js"

describe("UpdateUser Command", () => {
  // Mock HttpClient that fails to simulate HTTP-level errors
  // Tests expecting validation errors won't reach this mock
  // Tests expecting HTTP errors will encounter this failure
  const mockHttpClient = HttpClient.make((req) =>
    Effect.fail(
      new HttpClientError.RequestError({
        request: req,
        reason: "Transport",
        cause: new Error("Mock HTTP error - should not reach actual API in tests")
      })
    )
  )

  const httpClientLayer = Layer.succeed(HttpClient.HttpClient, mockHttpClient)

  describe("JSON Parsing", () => {
    it.effect("should parse valid JSON data successfully", () => {
      const configLayer = Layer.setConfigProvider(
        ConfigProvider.fromMap(
          new Map([
            ["PINGONE_ENV_ID", "test-env"],
            ["PINGONE_TOKEN", "test-token"]
          ])
        )
      )

      return Effect.gen(function*() {
        const jsonData = JSON.stringify({
          username: "updated-user",
          email: "updated@example.com"
        })

        const result = yield* Effect.exit(
          updateUser.handler({
            userId: "test-user-id",
            jsonData,
            environmentId: Option.some("test-env"),
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        // Validation passes, HTTP fails with transport error (not validation error)
        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          assert.notStrictEqual(result.cause.error._tag, "PingOneValidationError")
        }
      }).pipe(Effect.provide(Layer.mergeAll(configLayer, httpClientLayer, MockServicesLive)))
    })

    it.effect("should fail with PingOneValidationError for invalid JSON", () => {
      const configLayer = Layer.setConfigProvider(
        ConfigProvider.fromMap(
          new Map([
            ["PINGONE_ENV_ID", "test-env"],
            ["PINGONE_TOKEN", "test-token"]
          ])
        )
      )

      return Effect.gen(function*() {
        const invalidJson = "{ this is not valid JSON }"

        const result = yield* Effect.exit(
          updateUser.handler({
            userId: "test-user-id",
            jsonData: invalidJson,
            environmentId: Option.some("test-env"),
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as { _tag: string; message: string }
          assert.strictEqual(error._tag, "PingOneValidationError")
          assert.isTrue(error.message.includes("Invalid JSON format"))
        }
      }).pipe(Effect.provide(Layer.mergeAll(configLayer, httpClientLayer, MockServicesLive)))
    })

    it.effect("should fail with PingOneValidationError for empty JSON object", () => {
      const configLayer = Layer.setConfigProvider(
        ConfigProvider.fromMap(
          new Map([
            ["PINGONE_ENV_ID", "test-env"],
            ["PINGONE_TOKEN", "test-token"]
          ])
        )
      )

      return Effect.gen(function*() {
        const emptyJson = "{}"

        const result = yield* Effect.exit(
          updateUser.handler({
            userId: "test-user-id",
            jsonData: emptyJson,
            environmentId: Option.some("test-env"),
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as { _tag: string; message: string }
          assert.strictEqual(error._tag, "PingOneValidationError")
          assert.isTrue(error.message.includes("At least one field must be provided"))
        }
      }).pipe(Effect.provide(Layer.mergeAll(configLayer, httpClientLayer, MockServicesLive)))
    })

    it.effect("should parse complex nested JSON structures", () => {
      const configLayer = Layer.setConfigProvider(
        ConfigProvider.fromMap(
          new Map([
            ["PINGONE_ENV_ID", "test-env"],
            ["PINGONE_TOKEN", "test-token"]
          ])
        )
      )

      return Effect.gen(function*() {
        const complexJson = JSON.stringify({
          username: "updated-user",
          email: "updated@example.com",
          name: {
            given: "John",
            family: "Doe"
          },
          address: {
            streetAddress: "123 Main St",
            locality: "Anytown",
            region: "CA",
            postalCode: "12345",
            countryCode: "US"
          },
          mobilePhone: "+1234567890",
          enabled: true
        })

        const result = yield* Effect.exit(
          updateUser.handler({
            userId: "test-user-id",
            jsonData: complexJson,
            environmentId: Option.some("test-env"),
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        // Validation passes, HTTP fails with transport error (not validation error)
        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          assert.notStrictEqual(result.cause.error._tag, "PingOneValidationError")
        }
      }).pipe(Effect.provide(Layer.mergeAll(configLayer, httpClientLayer, MockServicesLive)))
    })

    it.effect("should fail with PingOneValidationError for JSON array instead of object", () => {
      const configLayer = Layer.setConfigProvider(
        ConfigProvider.fromMap(
          new Map([
            ["PINGONE_ENV_ID", "test-env"],
            ["PINGONE_TOKEN", "test-token"]
          ])
        )
      )

      return Effect.gen(function*() {
        const arrayJson = "[1, 2, 3]"

        const result = yield* Effect.exit(
          updateUser.handler({
            userId: "test-user-id",
            jsonData: arrayJson,
            environmentId: Option.some("test-env"),
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as { _tag: string; message: string }
          assert.strictEqual(error._tag, "PingOneValidationError")
          assert.isTrue(error.message.includes("Invalid JSON format"))
        }
      }).pipe(Effect.provide(Layer.mergeAll(configLayer, httpClientLayer, MockServicesLive)))
    })

    it.effect("should fail with PingOneValidationError for JSON primitive values", () => {
      const configLayer = Layer.setConfigProvider(
        ConfigProvider.fromMap(
          new Map([
            ["PINGONE_ENV_ID", "test-env"],
            ["PINGONE_TOKEN", "test-token"]
          ])
        )
      )

      return Effect.gen(function*() {
        const primitiveJson = "\"just a string\""

        const result = yield* Effect.exit(
          updateUser.handler({
            userId: "test-user-id",
            jsonData: primitiveJson,
            environmentId: Option.some("test-env"),
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as { _tag: string; message: string }
          assert.strictEqual(error._tag, "PingOneValidationError")
          assert.isTrue(error.message.includes("Invalid JSON format"))
        }
      }).pipe(Effect.provide(Layer.mergeAll(configLayer, httpClientLayer, MockServicesLive)))
    })

    it.effect("should fail with PingOneValidationError for JSON number", () => {
      const configLayer = Layer.setConfigProvider(
        ConfigProvider.fromMap(
          new Map([
            ["PINGONE_ENV_ID", "test-env"],
            ["PINGONE_TOKEN", "test-token"]
          ])
        )
      )

      return Effect.gen(function*() {
        const numberJson = "123"

        const result = yield* Effect.exit(
          updateUser.handler({
            userId: "test-user-id",
            jsonData: numberJson,
            environmentId: Option.some("test-env"),
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as { _tag: string; message: string }
          assert.strictEqual(error._tag, "PingOneValidationError")
          assert.isTrue(error.message.includes("Invalid JSON format"))
        }
      }).pipe(Effect.provide(Layer.mergeAll(configLayer, httpClientLayer, MockServicesLive)))
    })
  })

  describe("User ID Validation", () => {
    it.effect("should fail with PingOneAuthError for empty userId", () => {
      const configLayer = Layer.setConfigProvider(
        ConfigProvider.fromMap(
          new Map([
            ["PINGONE_ENV_ID", "test-env"],
            ["PINGONE_TOKEN", "test-token"]
          ])
        )
      )

      return Effect.gen(function*() {
        const jsonData = JSON.stringify({ username: "updated-user" })

        const result = yield* Effect.exit(
          updateUser.handler({
            userId: "   ",
            jsonData,
            environmentId: Option.some("test-env"),
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as { _tag: string; cause: string }
          assert.strictEqual(error._tag, "PingOneAuthError")
          assert.isTrue(error.cause.includes("User ID cannot be empty"))
        }
      }).pipe(Effect.provide(Layer.mergeAll(configLayer, httpClientLayer, MockServicesLive)))
    })
  })
})

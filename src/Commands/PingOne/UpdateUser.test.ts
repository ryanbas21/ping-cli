import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { ConfigProvider, Effect, Layer, Option, Redacted } from "effect"
import { updateUser } from "./UpdateUser.js"

describe("UpdateUser Command", () => {
  // Mock HttpClient that fails to simulate HTTP-level errors
  // Tests expecting validation errors won't reach this mock
  // Tests expecting HTTP errors will encounter this failure
  const mockHttpClient = HttpClient.make((_req) =>
    Effect.fail({
      _tag: "RequestError" as const,
      reason: "other",
      error: new Error("Mock HTTP error - should not reach actual API in tests")
    })
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
            environmentId: "test-env",
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        // Validation passes, HTTP fails but error is handled gracefully
        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(Layer.merge(configLayer, httpClientLayer)))
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
            environmentId: "test-env",
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as { _tag: string; message: string }
          assert.strictEqual(error._tag, "PingOneValidationError")
          assert.isTrue(error.message.includes("Invalid JSON format"))
        }
      }).pipe(Effect.provide(Layer.merge(configLayer, httpClientLayer)))
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
            environmentId: "test-env",
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as { _tag: string; message: string }
          assert.strictEqual(error._tag, "PingOneValidationError")
          assert.isTrue(error.message.includes("At least one field must be provided"))
        }
      }).pipe(Effect.provide(Layer.merge(configLayer, httpClientLayer)))
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
            environmentId: "test-env",
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        // Validation passes, HTTP fails but error is handled gracefully
        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(Layer.merge(configLayer, httpClientLayer)))
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
            environmentId: "test-env",
            pingoneToken: Option.some(Redacted.make("test-token"))
          })
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as { _tag: string; cause: string }
          assert.strictEqual(error._tag, "PingOneAuthError")
          assert.isTrue(error.cause.includes("User ID cannot be empty"))
        }
      }).pipe(Effect.provide(Layer.merge(configLayer, httpClientLayer)))
    })
  })
})

import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import type { PingOneApiError } from "../../Errors.js"
import {
  recoverPingOneUserPassword,
  resetPingOneUserPassword,
  setPingOneUserPassword
} from "../../HttpClient/PingOneClient.js"
import { MockServicesLive } from "../../test-helpers/TestLayers.js"

describe("Password Operations", () => {
  describe("setPingOneUserPassword", () => {
    it.effect("should successfully set a user password", () =>
      Effect.gen(function*() {
        const passwordData = {
          value: "SecurePassword123!",
          forceChange: false
        }

        const mockResponse = {
          id: "user-123",
          environment: { id: "env-123" },
          status: "SUCCESS"
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const result = yield* setPingOneUserPassword({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          passwordData
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "user-123")
        assert.strictEqual(result.status, "SUCCESS")
      }))

    it.effect("should set password with forceChange flag", () =>
      Effect.gen(function*() {
        const passwordData = {
          value: "TempPassword123!",
          forceChange: true
        }

        const mockResponse = {
          id: "user-456",
          environment: { id: "env-456" },
          status: "SUCCESS"
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const result = yield* setPingOneUserPassword({
          envId: "env-456",
          token: "test-token",
          userId: "user-456",
          passwordData
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "user-456")
        assert.strictEqual(result.status, "SUCCESS")
      }))

    it.effect("should fail with PingOneApiError on 400 bad request", () =>
      Effect.gen(function*() {
        const passwordData = {
          value: "weak"
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Password too weak" }), {
                status: 400,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const result = yield* setPingOneUserPassword({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          passwordData
        }).pipe(
          Effect.provide(testLayer),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 400)
        }
      }))
  })

  describe("resetPingOneUserPassword", () => {
    it.effect("should successfully initiate password reset", () =>
      Effect.gen(function*() {
        const resetData = {
          email: "user@example.com"
        }

        const mockResponse = {
          id: "reset-123",
          status: "PENDING"
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const result = yield* resetPingOneUserPassword({
          envId: "env-123",
          token: "test-token",
          resetData
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "reset-123")
        assert.strictEqual(result.status, "PENDING")
      }))

    it.effect("should fail with PingOneApiError on 404 not found", () =>
      Effect.gen(function*() {
        const resetData = {
          email: "notfound@example.com"
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const result = yield* resetPingOneUserPassword({
          envId: "env-123",
          token: "test-token",
          resetData
        }).pipe(
          Effect.provide(testLayer),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 404)
        }
      }))
  })

  describe("recoverPingOneUserPassword", () => {
    it.effect("should successfully initiate password recovery", () =>
      Effect.gen(function*() {
        const resetData = {
          email: "user@example.com"
        }

        const mockResponse = {
          id: "recover-789",
          status: "PENDING"
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const result = yield* recoverPingOneUserPassword({
          envId: "env-123",
          token: "test-token",
          resetData
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "recover-789")
        assert.strictEqual(result.status, "PENDING")
      }))

    it.effect("should handle 201 created response", () =>
      Effect.gen(function*() {
        const resetData = {
          email: "newuser@example.com"
        }

        const mockResponse = {
          id: "recover-999",
          status: "SENT"
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify(mockResponse), {
                status: 201,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const result = yield* recoverPingOneUserPassword({
          envId: "env-123",
          token: "test-token",
          resetData
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "recover-999")
        assert.strictEqual(result.status, "SENT")
      }))
  })
})

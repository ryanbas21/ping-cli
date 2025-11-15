import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { PingOneApiError } from "../Errors.js"
import { MockServicesLive } from "../test-helpers/TestLayers.js"
import { updatePingOneUserAccount, updatePingOneUserStatus } from "./PingOneClient.js"

describe("User Status Operations", () => {
  describe("updatePingOneUserStatus", () => {
    it.effect("should successfully enable a user", () =>
      Effect.gen(function*() {
        const mockResponse = {
          id: "user-123",
          environment: { id: "env-123" },
          enabled: true,
          lifecycle: { status: "ACCOUNT_OK" },
          updatedAt: "2024-01-01T00:00:00Z"
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

        const result = yield* updatePingOneUserStatus({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          enabled: true
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "user-123")
        assert.strictEqual(result.enabled, true)
        assert.strictEqual(result.lifecycle.status, "ACCOUNT_OK")
      }))

    it.effect("should successfully disable a user", () =>
      Effect.gen(function*() {
        const mockResponse = {
          id: "user-456",
          environment: { id: "env-456" },
          enabled: false,
          lifecycle: { status: "ACCOUNT_OK" },
          updatedAt: "2024-01-02T00:00:00Z"
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

        const result = yield* updatePingOneUserStatus({
          envId: "env-456",
          token: "test-token",
          userId: "user-456",
          enabled: false
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "user-456")
        assert.strictEqual(result.enabled, false)
      }))

    it.effect("should fail with PingOneApiError on 404 not found", () =>
      Effect.gen(function*() {
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

        const result = yield* updatePingOneUserStatus({
          envId: "env-123",
          token: "test-token",
          userId: "nonexistent-user",
          enabled: true
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

    it.effect("should fail with PingOneApiError on 401 unauthorized", () =>
      Effect.gen(function*() {
        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const result = yield* updatePingOneUserStatus({
          envId: "env-123",
          token: "invalid-token",
          userId: "user-123",
          enabled: true
        }).pipe(
          Effect.provide(testLayer),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 401)
        }
      }))
  })

  describe("updatePingOneUserAccount", () => {
    it.effect("should successfully lock a user", () =>
      Effect.gen(function*() {
        const mockResponse = {
          id: "user-789",
          environment: { id: "env-789" },
          enabled: true,
          lifecycle: { status: "ACCOUNT_OK" },
          updatedAt: "2024-01-03T00:00:00Z"
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

        const result = yield* updatePingOneUserAccount({
          envId: "env-789",
          token: "test-token",
          userId: "user-789",
          canAuthenticate: false
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "user-789")
        assert.strictEqual(result.lifecycle.status, "ACCOUNT_OK")
      }))

    it.effect("should successfully unlock a user", () =>
      Effect.gen(function*() {
        const mockResponse = {
          id: "user-999",
          environment: { id: "env-999" },
          enabled: true,
          lifecycle: { status: "ACCOUNT_OK" },
          updatedAt: "2024-01-04T00:00:00Z"
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

        const result = yield* updatePingOneUserAccount({
          envId: "env-999",
          token: "test-token",
          userId: "user-999",
          canAuthenticate: true
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "user-999")
        assert.strictEqual(result.lifecycle.status, "ACCOUNT_OK")
      }))

    it.effect("should fail with PingOneApiError on 403 forbidden", () =>
      Effect.gen(function*() {
        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const result = yield* updatePingOneUserAccount({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          canAuthenticate: false
        }).pipe(
          Effect.provide(testLayer),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 403)
        }
      }))

    it.effect("should fail with PingOneApiError on 400 bad request", () =>
      Effect.gen(function*() {
        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Invalid request" }), {
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

        const result = yield* updatePingOneUserAccount({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          canAuthenticate: true
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
})

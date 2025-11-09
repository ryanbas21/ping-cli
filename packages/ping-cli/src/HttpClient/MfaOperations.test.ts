import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import type { PingOneApiError } from "../Errors.js"
import { MockServicesLive } from "../test-helpers/TestLayers.js"
import { deletePingOneMfaDevice, listPingOneMfaDevices, updatePingOneUserMfa } from "./PingOneClient.js"

describe("MFA Operations", () => {
  describe("updatePingOneUserMfa", () => {
    it.effect("should successfully enable MFA for a user", () =>
      Effect.gen(function*() {
        const mockResponse = {
          id: "user-123",
          environment: { id: "env-123" },
          mfaEnabled: true,
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

        const result = yield* updatePingOneUserMfa({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          mfaEnabled: true
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "user-123")
        assert.strictEqual(result.mfaEnabled, true)
      }))

    it.effect("should successfully disable MFA for a user", () =>
      Effect.gen(function*() {
        const mockResponse = {
          id: "user-456",
          environment: { id: "env-456" },
          mfaEnabled: false,
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

        const result = yield* updatePingOneUserMfa({
          envId: "env-456",
          token: "test-token",
          userId: "user-456",
          mfaEnabled: false
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "user-456")
        assert.strictEqual(result.mfaEnabled, false)
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

        const result = yield* updatePingOneUserMfa({
          envId: "env-123",
          token: "test-token",
          userId: "nonexistent-user",
          mfaEnabled: true
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

  describe("listPingOneMfaDevices", () => {
    it.effect("should successfully list MFA devices", () =>
      Effect.gen(function*() {
        const mockResponse = {
          _embedded: {
            devices: [
              {
                id: "device-123",
                type: "TOTP",
                status: "ACTIVE",
                name: "Authenticator App",
                nickname: "My Phone",
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z"
              },
              {
                id: "device-456",
                type: "SMS",
                status: "ACTIVE",
                name: "Mobile Phone",
                createdAt: "2024-01-02T00:00:00Z",
                updatedAt: "2024-01-02T00:00:00Z"
              }
            ]
          },
          count: 2,
          size: 2
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

        const result = yield* listPingOneMfaDevices({
          envId: "env-123",
          token: "test-token",
          userId: "user-123"
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result._embedded.devices.length, 2)
        assert.strictEqual(result._embedded.devices[0].id, "device-123")
        assert.strictEqual(result._embedded.devices[0].type, "TOTP")
        assert.strictEqual(result._embedded.devices[1].id, "device-456")
        assert.strictEqual(result._embedded.devices[1].type, "SMS")
        assert.strictEqual(result.count, 2)
      }))

    it.effect("should successfully list devices with limit", () =>
      Effect.gen(function*() {
        const mockResponse = {
          _embedded: {
            devices: [
              {
                id: "device-789",
                type: "EMAIL",
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z"
              }
            ]
          },
          _links: {
            self: { href: "https://api.pingone.com/environments/env-123/users/user-123/devices?limit=1" },
            next: { href: "https://api.pingone.com/environments/env-123/users/user-123/devices?limit=1&cursor=abc" }
          },
          count: 5,
          size: 1
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

        const result = yield* listPingOneMfaDevices({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          limit: 1
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result._embedded.devices.length, 1)
        assert.strictEqual(result.size, 1)
        assert.strictEqual(result.count, 5)
        assert.isTrue(result._links?.next !== undefined)
      }))

    it.effect("should return empty list when no devices found", () =>
      Effect.gen(function*() {
        const mockResponse = {
          _embedded: {
            devices: []
          },
          count: 0,
          size: 0
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

        const result = yield* listPingOneMfaDevices({
          envId: "env-123",
          token: "test-token",
          userId: "user-123"
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result._embedded.devices.length, 0)
        assert.strictEqual(result.count, 0)
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

        const result = yield* listPingOneMfaDevices({
          envId: "env-123",
          token: "invalid-token",
          userId: "user-123"
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

  describe("deletePingOneMfaDevice", () => {
    it.effect("should successfully delete an MFA device", () =>
      Effect.gen(function*() {
        const mockResponse = {
          id: "device-123",
          status: "DELETED"
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

        const result = yield* deletePingOneMfaDevice({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          deviceId: "device-123"
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "device-123")
        assert.strictEqual(result.status, "DELETED")
      }))

    it.effect("should fail with PingOneApiError on 404 not found", () =>
      Effect.gen(function*() {
        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Device not found" }), {
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

        const result = yield* deletePingOneMfaDevice({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          deviceId: "nonexistent-device"
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

        const result = yield* deletePingOneMfaDevice({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          deviceId: "device-123"
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
  })
})

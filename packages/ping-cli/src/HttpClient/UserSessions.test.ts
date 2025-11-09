import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import type { PingOneApiError } from "../Errors.js"
import { MockServicesLive } from "../test-helpers/TestLayers.js"
import { listPingOneUserSessions, revokePingOneUserSession } from "./PingOneClient.js"

describe("User Sessions Operations", () => {
  describe("listPingOneUserSessions", () => {
    it.effect("should successfully list user sessions", () =>
      Effect.gen(function*() {
        const mockResponse = {
          _embedded: {
            sessions: [
              {
                id: "session-123",
                createdAt: "2024-01-01T00:00:00Z",
                expiresAt: "2024-01-02T00:00:00Z",
                lastUsedAt: "2024-01-01T12:00:00Z",
                application: {
                  id: "app-123",
                  name: "My Application"
                }
              },
              {
                id: "session-456",
                createdAt: "2024-01-01T06:00:00Z",
                expiresAt: "2024-01-02T06:00:00Z",
                lastUsedAt: "2024-01-01T18:00:00Z",
                application: {
                  id: "app-456",
                  name: "Another Application"
                }
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

        const result = yield* listPingOneUserSessions({
          envId: "env-123",
          token: "test-token",
          userId: "user-123"
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result._embedded.sessions.length, 2)
        assert.strictEqual(result._embedded.sessions[0].id, "session-123")
        assert.strictEqual(result._embedded.sessions[0].application?.name, "My Application")
        assert.strictEqual(result._embedded.sessions[1].id, "session-456")
        assert.strictEqual(result.count, 2)
      }))

    it.effect("should successfully list sessions with limit", () =>
      Effect.gen(function*() {
        const mockResponse = {
          _embedded: {
            sessions: [
              {
                id: "session-789",
                createdAt: "2024-01-01T00:00:00Z",
                expiresAt: "2024-01-02T00:00:00Z"
              }
            ]
          },
          _links: {
            self: { href: "https://api.pingone.com/environments/env-123/users/user-123/sessions?limit=1" },
            next: { href: "https://api.pingone.com/environments/env-123/users/user-123/sessions?limit=1&cursor=abc" }
          },
          count: 10,
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

        const result = yield* listPingOneUserSessions({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          limit: 1
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result._embedded.sessions.length, 1)
        assert.strictEqual(result.size, 1)
        assert.strictEqual(result.count, 10)
        assert.isTrue(result._links?.next !== undefined)
      }))

    it.effect("should return empty list when no sessions found", () =>
      Effect.gen(function*() {
        const mockResponse = {
          _embedded: {
            sessions: []
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

        const result = yield* listPingOneUserSessions({
          envId: "env-123",
          token: "test-token",
          userId: "user-123"
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result._embedded.sessions.length, 0)
        assert.strictEqual(result.count, 0)
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

        const result = yield* listPingOneUserSessions({
          envId: "env-123",
          token: "test-token",
          userId: "nonexistent-user"
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

        const result = yield* listPingOneUserSessions({
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

  describe("revokePingOneUserSession", () => {
    it.effect("should successfully revoke a user session", () =>
      Effect.gen(function*() {
        const mockResponse = {
          id: "session-123",
          status: "REVOKED"
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

        const result = yield* revokePingOneUserSession({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          sessionId: "session-123"
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "session-123")
        assert.strictEqual(result.status, "REVOKED")
      }))

    it.effect("should fail with PingOneApiError on 404 not found", () =>
      Effect.gen(function*() {
        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Session not found" }), {
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

        const result = yield* revokePingOneUserSession({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          sessionId: "nonexistent-session"
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

        const result = yield* revokePingOneUserSession({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          sessionId: "session-123"
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

        const result = yield* revokePingOneUserSession({
          envId: "env-123",
          token: "invalid-token",
          userId: "user-123",
          sessionId: "session-123"
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
})

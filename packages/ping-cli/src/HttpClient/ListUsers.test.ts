import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import type { PingOneApiError } from "../Errors.js"
import { MockServicesLive } from "../test-helpers/TestLayers.js"
import { listPingOneUsers } from "./PingOneClient.js"

describe("listPingOneUsers", () => {
  it.effect("should successfully list users without filters", () =>
    Effect.gen(function*() {
      const mockResponse = {
        _embedded: {
          users: [
            {
              id: "user-123",
              environment: { id: "env-123" },
              population: { id: "pop-123" },
              createdAt: "2024-01-01T00:00:00Z",
              email: "user1@example.com",
              enabled: true,
              lifecycle: { status: "ACCOUNT_OK" },
              mfaEnabled: false,
              updatedAt: "2024-01-01T00:00:00Z",
              username: "user1"
            },
            {
              id: "user-456",
              environment: { id: "env-123" },
              population: { id: "pop-123" },
              createdAt: "2024-01-02T00:00:00Z",
              email: "user2@example.com",
              enabled: true,
              lifecycle: { status: "ACCOUNT_OK" },
              mfaEnabled: false,
              updatedAt: "2024-01-02T00:00:00Z",
              username: "user2"
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

      const result = yield* listPingOneUsers({
        envId: "env-123",
        token: "test-token"
      }).pipe(Effect.provide(testLayer))

      assert.strictEqual(result._embedded.users.length, 2)
      assert.strictEqual(result._embedded.users[0].id, "user-123")
      assert.strictEqual(result._embedded.users[0].username, "user1")
      assert.strictEqual(result._embedded.users[1].id, "user-456")
      assert.strictEqual(result.count, 2)
    }))

  it.effect("should successfully list users with limit", () =>
    Effect.gen(function*() {
      const mockResponse = {
        _embedded: {
          users: [
            {
              id: "user-123",
              environment: { id: "env-123" },
              population: { id: "pop-123" },
              createdAt: "2024-01-01T00:00:00Z",
              email: "user1@example.com",
              enabled: true,
              lifecycle: { status: "ACCOUNT_OK" },
              mfaEnabled: false,
              updatedAt: "2024-01-01T00:00:00Z",
              username: "user1"
            }
          ]
        },
        _links: {
          self: { href: "https://api.pingone.com/environments/env-123/users?limit=1" },
          next: { href: "https://api.pingone.com/environments/env-123/users?limit=1&cursor=abc" }
        },
        count: 100,
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

      const result = yield* listPingOneUsers({
        envId: "env-123",
        token: "test-token",
        limit: 1
      }).pipe(Effect.provide(testLayer))

      assert.strictEqual(result._embedded.users.length, 1)
      assert.strictEqual(result.size, 1)
      assert.strictEqual(result.count, 100)
      assert.isTrue(result._links?.next !== undefined)
    }))

  it.effect("should successfully list users with filter", () =>
    Effect.gen(function*() {
      const mockResponse = {
        _embedded: {
          users: [
            {
              id: "user-123",
              environment: { id: "env-123" },
              population: { id: "pop-123" },
              createdAt: "2024-01-01T00:00:00Z",
              email: "john@example.com",
              enabled: true,
              lifecycle: { status: "ACCOUNT_OK" },
              mfaEnabled: false,
              name: {
                given: "John",
                family: "Doe"
              },
              updatedAt: "2024-01-01T00:00:00Z",
              username: "john.doe"
            }
          ]
        },
        count: 1,
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

      const result = yield* listPingOneUsers({
        envId: "env-123",
        token: "test-token",
        filter: "email eq \"john@example.com\""
      }).pipe(Effect.provide(testLayer))

      assert.strictEqual(result._embedded.users.length, 1)
      assert.strictEqual(result._embedded.users[0].email, "john@example.com")
      assert.strictEqual(result._embedded.users[0].username, "john.doe")
    }))

  it.effect("should return empty list when no users found", () =>
    Effect.gen(function*() {
      const mockResponse = {
        _embedded: {
          users: []
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

      const result = yield* listPingOneUsers({
        envId: "env-123",
        token: "test-token",
        filter: "email eq \"nonexistent@example.com\""
      }).pipe(Effect.provide(testLayer))

      assert.strictEqual(result._embedded.users.length, 0)
      assert.strictEqual(result.count, 0)
    }))

  it.effect("should fail with PingOneApiError on 400 bad request", () =>
    Effect.gen(function*() {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify({ error: "Invalid filter syntax" }), {
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

      const result = yield* listPingOneUsers({
        envId: "env-123",
        token: "test-token",
        filter: "invalid filter syntax"
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

      const result = yield* listPingOneUsers({
        envId: "env-123",
        token: "invalid-token"
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

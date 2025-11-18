/**
 * Tests for HTTP client helpers
 *
 * @since 0.0.1
 */
import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Schema } from "effect"
import type { PingOneApiError } from "../Errors.js"
import { MockServicesLive } from "../test-helpers/TestLayers.js"
import { executeCachedRequest, executeRequest, executeVoidRequest } from "./helpers.js"

describe("HTTP Helpers", () => {
  describe("executeRequest", () => {
    it.effect("should successfully execute request with 200 status", () =>
      Effect.gen(function*() {
        const mockResponse = { id: "123", name: "test" }
        const ResponseSchema = Schema.Struct({
          id: Schema.String,
          name: Schema.String
        })

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

        const request = HttpClientRequest.get("https://api.example.com/test").pipe(
          HttpClientRequest.bearerToken("test-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeRequest(request, ResponseSchema).pipe(
          Effect.provide(testLayer)
        )

        assert.strictEqual(result.id, "123")
        assert.strictEqual(result.name, "test")
      }))

    it.effect("should successfully execute request with 201 status", () =>
      Effect.gen(function*() {
        const mockResponse = { id: "456", created: true }
        const ResponseSchema = Schema.Struct({
          id: Schema.String,
          created: Schema.Boolean
        })

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

        const request = HttpClientRequest.post("https://api.example.com/test").pipe(
          HttpClientRequest.bearerToken("test-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeRequest(request, ResponseSchema).pipe(
          Effect.provide(testLayer)
        )

        assert.strictEqual(result.id, "456")
        assert.strictEqual(result.created, true)
      }))

    it.effect("should fail with PingOneApiError on 401 status", () =>
      Effect.gen(function*() {
        const ResponseSchema = Schema.Struct({
          id: Schema.String
        })

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

        const request = HttpClientRequest.get("https://api.example.com/test").pipe(
          HttpClientRequest.bearerToken("invalid-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeRequest(request, ResponseSchema).pipe(
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

    it.effect("should fail with PingOneApiError on 404 status", () =>
      Effect.gen(function*() {
        const ResponseSchema = Schema.Struct({
          id: Schema.String
        })

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Not Found" }), {
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

        const request = HttpClientRequest.get("https://api.example.com/test/999").pipe(
          HttpClientRequest.bearerToken("test-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeRequest(request, ResponseSchema).pipe(
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

    it.effect("should fail with PingOneApiError on 500 status", () =>
      Effect.gen(function*() {
        const ResponseSchema = Schema.Struct({
          id: Schema.String
        })

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Internal Server Error" }), {
                status: 500,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const request = HttpClientRequest.get("https://api.example.com/test").pipe(
          HttpClientRequest.bearerToken("test-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeRequest(request, ResponseSchema).pipe(
          Effect.provide(testLayer),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 500)
        }
      }))
  })

  describe("executeCachedRequest", () => {
    it.effect("should successfully execute cached request with 200 status", () =>
      Effect.gen(function*() {
        const mockResponse = { id: "789", cached: true }
        const ResponseSchema = Schema.Struct({
          id: Schema.String,
          cached: Schema.Boolean
        })

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

        const request = HttpClientRequest.get("https://api.example.com/cached").pipe(
          HttpClientRequest.bearerToken("test-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeCachedRequest(request, ResponseSchema).pipe(
          Effect.provide(testLayer)
        )

        assert.strictEqual(result.id, "789")
        assert.strictEqual(result.cached, true)
      }))

    it.effect("should fail with PingOneApiError on error status", () =>
      Effect.gen(function*() {
        const ResponseSchema = Schema.Struct({
          id: Schema.String
        })

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

        const request = HttpClientRequest.get("https://api.example.com/cached").pipe(
          HttpClientRequest.bearerToken("test-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeCachedRequest(request, ResponseSchema).pipe(
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

  describe("executeVoidRequest", () => {
    it.effect("should successfully execute void request with 200 status", () =>
      Effect.gen(function*() {
        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(null, {
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

        const request = HttpClientRequest.post("https://api.example.com/action").pipe(
          HttpClientRequest.bearerToken("test-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeVoidRequest(request).pipe(
          Effect.provide(testLayer)
        )

        assert.strictEqual(result.status, 200)
      }))

    it.effect("should successfully execute void request with 201 status", () =>
      Effect.gen(function*() {
        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(null, {
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

        const request = HttpClientRequest.post("https://api.example.com/action").pipe(
          HttpClientRequest.bearerToken("test-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeVoidRequest(request).pipe(
          Effect.provide(testLayer)
        )

        assert.strictEqual(result.status, 201)
      }))

    it.effect("should successfully execute void request with 204 status", () =>
      Effect.gen(function*() {
        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(null, {
                status: 204,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const request = HttpClientRequest.del("https://api.example.com/resource/123").pipe(
          HttpClientRequest.bearerToken("test-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeVoidRequest(request).pipe(
          Effect.provide(testLayer)
        )

        assert.strictEqual(result.status, 204)
      }))

    it.effect("should fail with PingOneApiError on 404 status", () =>
      Effect.gen(function*() {
        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Not Found" }), {
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

        const request = HttpClientRequest.del("https://api.example.com/resource/999").pipe(
          HttpClientRequest.bearerToken("test-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeVoidRequest(request).pipe(
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

    it.effect("should fail with PingOneApiError on 500 status", () =>
      Effect.gen(function*() {
        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Server Error" }), {
                status: 500,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const request = HttpClientRequest.del("https://api.example.com/resource/123").pipe(
          HttpClientRequest.bearerToken("test-token"),
          HttpClientRequest.accept("application/json")
        )

        const result = yield* executeVoidRequest(request).pipe(
          Effect.provide(testLayer),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 500)
        }
      }))
  })
})

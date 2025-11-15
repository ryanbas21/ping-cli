import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { PingOneApiError } from "../Errors.js"
import { MockServicesLive } from "../test-helpers/TestLayers.js"
import {
  createApplication,
  deleteApplication,
  listApplications,
  readApplication,
  updateApplication
} from "./ApplicationClient.js"

describe("ApplicationClient", () => {
  describe("createApplication", () => {
    it.effect("should create an application successfully", () => {
      const mockResponse = {
        id: "app-123",
        name: "Test Application",
        description: "Test description",
        enabled: true,
        type: "WEB_APP",
        protocol: "OPENID_CONNECT"
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

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* createApplication({
          envId: "env-123",
          token: "test-token",
          applicationData: {
            name: "Test Application",
            description: "Test description",
            type: "WEB_APP",
            protocol: "OPENID_CONNECT",
            enabled: true
          }
        })

        assert.strictEqual(result.id, "app-123")
        assert.strictEqual(result.name, "Test Application")
        assert.strictEqual(result.description, "Test description")
        assert.strictEqual(result.enabled, true)
        assert.strictEqual(result.type, "WEB_APP")
        assert.strictEqual(result.protocol, "OPENID_CONNECT")
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should fail with PingOneApiError on non-2xx status", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify({ error: "Bad Request" }), {
              status: 400,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* createApplication({
          envId: "env-123",
          token: "test-token",
          applicationData: {
            name: "Test Application",
            type: "WEB_APP",
            protocol: "OPENID_CONNECT"
          }
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 400)
        }
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("readApplication", () => {
    it.effect("should read an application successfully", () => {
      const mockResponse = {
        id: "app-123",
        name: "Test Application",
        description: "Test description",
        enabled: true,
        type: "WEB_APP",
        protocol: "OPENID_CONNECT"
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

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* readApplication({
          envId: "env-123",
          token: "test-token",
          applicationId: "app-123"
        })

        assert.strictEqual(result.id, "app-123")
        assert.strictEqual(result.name, "Test Application")
        assert.strictEqual(result.enabled, true)
        assert.strictEqual(result.type, "WEB_APP")
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("listApplications", () => {
    it.effect("should list applications successfully", () => {
      const mockResponse = {
        _embedded: {
          applications: [
            {
              id: "app-123",
              name: "Application 1",
              enabled: true,
              type: "WEB_APP",
              protocol: "OPENID_CONNECT"
            },
            {
              id: "app-456",
              name: "Application 2",
              description: "Test",
              enabled: false,
              type: "NATIVE_APP",
              protocol: "OPENID_CONNECT"
            }
          ]
        },
        count: 2
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

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* listApplications({
          envId: "env-123",
          token: "test-token"
        })

        assert.strictEqual(result.count, 2)
        assert.strictEqual(result._embedded.applications.length, 2)
        assert.strictEqual(result._embedded.applications[0].id, "app-123")
        assert.strictEqual(result._embedded.applications[1].name, "Application 2")
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should list applications with pagination", () => {
      const mockResponse = {
        _embedded: {
          applications: [
            {
              id: "app-123",
              name: "Application 1",
              enabled: true,
              type: "WEB_APP",
              protocol: "OPENID_CONNECT"
            }
          ]
        },
        count: 1,
        size: 10
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

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* listApplications({
          envId: "env-123",
          token: "test-token",
          limit: 10,
          filter: "name eq \"Test\""
        })

        assert.strictEqual(result.count, 1)
        assert.strictEqual(result.size, 10)
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("updateApplication", () => {
    it.effect("should update an application successfully", () => {
      const mockResponse = {
        id: "app-123",
        name: "Updated Application",
        description: "Updated description",
        enabled: false,
        type: "WEB_APP",
        protocol: "OPENID_CONNECT"
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

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* updateApplication({
          envId: "env-123",
          token: "test-token",
          applicationId: "app-123",
          applicationData: {
            name: "Updated Application",
            description: "Updated description",
            enabled: false
          }
        })

        assert.strictEqual(result.id, "app-123")
        assert.strictEqual(result.name, "Updated Application")
        assert.strictEqual(result.description, "Updated description")
        assert.strictEqual(result.enabled, false)
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("deleteApplication", () => {
    it.effect("should delete an application successfully", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(HttpClientResponse.fromWeb(req, new Response(null, { status: 204 })))
      )

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* deleteApplication({
          envId: "env-123",
          token: "test-token",
          applicationId: "app-123"
        })

        assert.strictEqual(result, undefined)
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should fail with PingOneApiError on non-2xx status", () => {
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

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* deleteApplication({
          envId: "env-123",
          token: "test-token",
          applicationId: "app-123"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 404)
        }
      }).pipe(Effect.provide(dependencies))
    })
  })
})

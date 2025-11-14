import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import type { PingOneApiError } from "../Errors.js"
import { MockServicesLive } from "../test-helpers/TestLayers.js"
import { listEnvironments, readEnvironment } from "./EnvironmentClient.js"

describe("EnvironmentClient", () => {
  describe("readEnvironment", () => {
    it.effect("should read an environment successfully", () => {
      const mockResponse = {
        id: "env-123",
        name: "Production",
        description: "Production environment",
        type: "PRODUCTION",
        region: "NA",
        license: {
          id: "lic-123",
          name: "Test License"
        },
        createdAt: "2024-01-01T00:00:00Z",
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

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* readEnvironment({
          token: "test-token",
          environmentId: "env-123"
        })

        assert.strictEqual(result.id, "env-123")
        assert.strictEqual(result.name, "Production")
        assert.strictEqual(result.type, "PRODUCTION")
        assert.strictEqual(result.region, "NA")
        assert.strictEqual(result.license.id, "lic-123")
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
        const result = yield* readEnvironment({
          token: "test-token",
          environmentId: "env-999"
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

  describe("listEnvironments", () => {
    it.effect("should list environments successfully", () => {
      const mockResponse = {
        _embedded: {
          environments: [
            {
              id: "env-123",
              name: "Production",
              type: "PRODUCTION",
              region: "NA",
              license: {
                id: "lic-123",
                name: "Test License"
              },
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z"
            },
            {
              id: "env-456",
              name: "Sandbox",
              description: "Test environment",
              type: "SANDBOX",
              region: "EU",
              license: {
                id: "lic-456",
                name: "Test License"
              },
              createdAt: "2024-01-02T00:00:00Z",
              updatedAt: "2024-01-02T00:00:00Z"
            }
          ]
        }
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
        const result = yield* listEnvironments({
          token: "test-token"
        })

        const environments = result._embedded.environments
        assert.strictEqual(environments.length, 2)
        assert.strictEqual(environments[0].id, "env-123")
        assert.strictEqual(environments[0].name, "Production")
        assert.strictEqual(environments[1].id, "env-456")
        assert.strictEqual(environments[1].name, "Sandbox")
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should support limit parameter", () => {
      const mockResponse = {
        _embedded: {
          environments: [
            {
              id: "env-123",
              name: "Production",
              type: "PRODUCTION",
              region: "NA",
              license: {
                id: "lic-123",
                name: "Test License"
              },
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z"
            }
          ]
        }
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
        const result = yield* listEnvironments({
          token: "test-token",
          limit: 1
        })

        const environments = result._embedded.environments
        assert.strictEqual(environments.length, 1)
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should fail with PingOneApiError on non-2xx status", () => {
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

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* listEnvironments({
          token: "invalid-token"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 401)
        }
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should handle empty environments list", () => {
      const mockResponse = {
        _embedded: {
          environments: []
        }
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
        const result = yield* listEnvironments({
          token: "test-token"
        })

        const environments = result._embedded.environments
        assert.strictEqual(environments.length, 0)
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should support filter parameter", () => {
      const mockResponse = {
        _embedded: {
          environments: [
            {
              id: "env-prod-123",
              name: "Production Environment",
              type: "PRODUCTION",
              region: "NA",
              license: {
                id: "lic-123",
                name: "Production License"
              },
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z"
            }
          ]
        }
      }

      const mockClient = HttpClient.make((req) => {
        // Verify that the filter parameter is properly encoded in the URL
        const url = new URL(req.url)
        const filterParam = url.searchParams.get("filter")
        assert.strictEqual(filterParam, "type eq \"PRODUCTION\"")

        return Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "content-type": "application/json" }
            })
          )
        )
      })

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* listEnvironments({
          token: "test-token",
          filter: "type eq \"PRODUCTION\""
        })

        const environments = result._embedded.environments
        assert.strictEqual(environments.length, 1)
        assert.strictEqual(environments[0].type, "PRODUCTION")
        assert.strictEqual(environments[0].name, "Production Environment")
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should handle environments with license missing name field", () => {
      const mockResponse = {
        _embedded: {
          environments: [
            {
              id: "env-canada-123",
              name: "Canada Environment",
              description: "Environment in Canada region",
              type: "PRODUCTION",
              region: "CA",
              license: {
                id: "lic-canada-123"
                // name is intentionally missing (Canada region doesn't return it)
              },
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z"
            }
          ]
        }
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
        const result = yield* listEnvironments({
          token: "test-token"
        })

        const environments = result._embedded.environments
        assert.strictEqual(environments.length, 1)
        assert.strictEqual(environments[0].id, "env-canada-123")
        assert.strictEqual(environments[0].region, "CA")
        assert.strictEqual(environments[0].license.id, "lic-canada-123")
        // Verify license.name is undefined (not present in response)
        assert.strictEqual(environments[0].license.name, undefined)
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should handle environment without license name in readEnvironment", () => {
      const mockResponse = {
        id: "env-canada-456",
        name: "Canada Sandbox",
        description: "Sandbox in Canada",
        type: "SANDBOX",
        region: "CA",
        license: {
          id: "lic-canada-456"
          // name is intentionally missing
        },
        createdAt: "2024-01-01T00:00:00Z",
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

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* readEnvironment({
          token: "test-token",
          environmentId: "env-canada-456"
        })

        assert.strictEqual(result.id, "env-canada-456")
        assert.strictEqual(result.region, "CA")
        assert.strictEqual(result.license.id, "lic-canada-456")
        // Verify license.name is undefined (not present in response)
        assert.strictEqual(result.license.name, undefined)
      }).pipe(Effect.provide(dependencies))
    })
  })
})

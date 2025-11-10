import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import type { PingOneApiError } from "../Errors.js"
import { MockServicesLive } from "../test-helpers/TestLayers.js"
import {
  createPopulation,
  deletePopulation,
  listPopulations,
  readPopulation,
  updatePopulation
} from "./PopulationClient.js"

describe("PopulationClient", () => {
  describe("createPopulation", () => {
    it.effect("should create a population successfully", () => {
      const mockResponse = {
        id: "pop-123",
        name: "Test Population",
        description: "Test description",
        default: false
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
        const result = yield* createPopulation({
          envId: "env-123",
          token: "test-token",
          populationData: {
            name: "Test Population",
            description: "Test description"
          }
        })

        assert.strictEqual(result.id, "pop-123")
        assert.strictEqual(result.name, "Test Population")
        assert.strictEqual(result.description, "Test description")
        assert.strictEqual(result.default, false)
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
        const result = yield* createPopulation({
          envId: "env-123",
          token: "test-token",
          populationData: {
            name: "Test Population"
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

  describe("readPopulation", () => {
    it.effect("should read a population successfully", () => {
      const mockResponse = {
        id: "pop-123",
        name: "Test Population",
        description: "Test description",
        default: true,
        passwordPolicy: {
          id: "policy-123"
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
        const result = yield* readPopulation({
          envId: "env-123",
          token: "test-token",
          populationId: "pop-123"
        })

        assert.strictEqual(result.id, "pop-123")
        assert.strictEqual(result.name, "Test Population")
        assert.strictEqual(result.default, true)
        assert.deepStrictEqual(result.passwordPolicy, { id: "policy-123" })
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("listPopulations", () => {
    it.effect("should list populations successfully", () => {
      const mockResponse = {
        _embedded: {
          populations: [
            {
              id: "pop-123",
              name: "Population 1",
              default: true
            },
            {
              id: "pop-456",
              name: "Population 2",
              description: "Test",
              default: false
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
        const result = yield* listPopulations({
          envId: "env-123",
          token: "test-token"
        })

        assert.strictEqual(result.count, 2)
        assert.strictEqual(result._embedded.populations.length, 2)
        assert.strictEqual(result._embedded.populations[0].id, "pop-123")
        assert.strictEqual(result._embedded.populations[1].name, "Population 2")
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should list populations with pagination", () => {
      const mockResponse = {
        _embedded: {
          populations: [
            {
              id: "pop-123",
              name: "Population 1",
              default: false
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
        const result = yield* listPopulations({
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

  describe("updatePopulation", () => {
    it.effect("should update a population successfully", () => {
      const mockResponse = {
        id: "pop-123",
        name: "Updated Population",
        description: "Updated description",
        default: false
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
        const result = yield* updatePopulation({
          envId: "env-123",
          token: "test-token",
          populationId: "pop-123",
          populationData: {
            name: "Updated Population",
            description: "Updated description"
          }
        })

        assert.strictEqual(result.id, "pop-123")
        assert.strictEqual(result.name, "Updated Population")
        assert.strictEqual(result.description, "Updated description")
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("deletePopulation", () => {
    it.effect("should delete a population successfully", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(HttpClientResponse.fromWeb(req, new Response(null, { status: 204 })))
      )

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* deletePopulation({
          envId: "env-123",
          token: "test-token",
          populationId: "pop-123"
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
        const result = yield* deletePopulation({
          envId: "env-123",
          token: "test-token",
          populationId: "pop-123"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 404)
        }
      }).pipe(Effect.provide(dependencies))
    })
  })
})

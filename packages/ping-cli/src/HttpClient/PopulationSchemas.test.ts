import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import * as Schema from "effect/Schema"
import { ListPopulationsResponseSchema, PopulationSchema } from "./PopulationSchemas.js"

describe("PopulationSchemas", () => {
  describe("PopulationSchema", () => {
    it.effect("should validate minimal population", () =>
      Effect.gen(function*() {
        const minimalPopulation = {
          id: "pop-123",
          name: "Test Population",
          default: false
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(minimalPopulation)

        assert.deepStrictEqual(result, minimalPopulation)
      }))

    it.effect("should validate population with description", () =>
      Effect.gen(function*() {
        const populationWithDesc = {
          id: "pop-456",
          name: "Default Population",
          description: "Automatically created population",
          default: true
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(populationWithDesc)

        assert.deepStrictEqual(result, populationWithDesc)
      }))

    it.effect("should validate population with passwordPolicy", () =>
      Effect.gen(function*() {
        const populationWithPolicy = {
          id: "pop-789",
          name: "Secure Population",
          default: false,
          passwordPolicy: {
            id: "policy-123"
          }
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(populationWithPolicy)

        assert.deepStrictEqual(result.passwordPolicy, { id: "policy-123" })
      }))

    it.effect("should validate population with environment", () =>
      Effect.gen(function*() {
        const populationWithEnv = {
          id: "pop-abc",
          name: "Env Population",
          default: false,
          environment: {
            id: "env-xyz"
          }
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(populationWithEnv)

        assert.deepStrictEqual(result.environment, { id: "env-xyz" })
      }))

    it.effect("should validate population with userCount", () =>
      Effect.gen(function*() {
        const populationWithCount = {
          id: "pop-count",
          name: "Counted Population",
          default: false,
          userCount: 1978
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(populationWithCount)

        assert.strictEqual(result.userCount, 1978)
      }))

    it.effect("should validate population with preferredLanguage", () =>
      Effect.gen(function*() {
        const populationWithLang = {
          id: "pop-lang",
          name: "Language Population",
          default: false,
          preferredLanguage: "en"
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(populationWithLang)

        assert.strictEqual(result.preferredLanguage, "en")
      }))

    it.effect("should validate population with theme", () =>
      Effect.gen(function*() {
        const populationWithTheme = {
          id: "pop-theme",
          name: "Themed Population",
          default: false,
          theme: {
            id: "theme-123"
          }
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(populationWithTheme)

        assert.deepStrictEqual(result.theme, { id: "theme-123" })
      }))

    it.effect("should validate population with timestamps", () =>
      Effect.gen(function*() {
        const populationWithTimestamps = {
          id: "pop-timestamps",
          name: "Timestamp Population",
          default: false,
          createdAt: "2024-01-03T19:50:40.119Z",
          updatedAt: "2024-01-03T19:50:40.119Z"
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(populationWithTimestamps)

        assert.strictEqual(result.createdAt, "2024-01-03T19:50:40.119Z")
        assert.strictEqual(result.updatedAt, "2024-01-03T19:50:40.119Z")
      }))

    it.effect("should validate population with _links", () =>
      Effect.gen(function*() {
        const populationWithLinks = {
          id: "pop-links",
          name: "Linked Population",
          default: false,
          _links: {
            self: { href: "https://api.pingone.ca/v1/populations/pop-links" },
            environment: { href: "https://api.pingone.ca/v1/environments/env-123" }
          }
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(populationWithLinks)

        assert.isTrue(result._links !== undefined)
        assert.isTrue(typeof result._links === "object")
      }))

    it.effect("should validate full population with all fields", () =>
      Effect.gen(function*() {
        const fullPopulation = {
          id: "80cc604c-79c9-4e1d-9d35-c11ebaace5b8",
          name: "Default",
          description: "Automatically created population.",
          default: true,
          passwordPolicy: {
            id: "policy-123"
          },
          environment: {
            id: "02fb4743-189a-4bc7-9d6c-a919edfe6447"
          },
          userCount: 1978,
          preferredLanguage: "en",
          theme: {
            id: "c60c7ba6-024b-46b5-bb0f-586383d6fc33"
          },
          createdAt: "2024-01-03T19:50:40.119Z",
          updatedAt: "2024-01-03T19:50:40.119Z",
          _links: {
            self: { href: "https://api.pingone.ca/v1/populations/80cc604c-79c9-4e1d-9d35-c11ebaace5b8" },
            environment: { href: "https://api.pingone.ca/v1/environments/02fb4743-189a-4bc7-9d6c-a919edfe6447" },
            theme: { href: "https://api.pingone.ca/v1/themes/c60c7ba6-024b-46b5-bb0f-586383d6fc33" }
          }
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(fullPopulation)

        assert.strictEqual(result.id, "80cc604c-79c9-4e1d-9d35-c11ebaace5b8")
        assert.strictEqual(result.name, "Default")
        assert.strictEqual(result.description, "Automatically created population.")
        assert.isTrue(result.default)
        assert.strictEqual(result.userCount, 1978)
        assert.strictEqual(result.preferredLanguage, "en")
        assert.deepStrictEqual(result.environment, { id: "02fb4743-189a-4bc7-9d6c-a919edfe6447" })
        assert.deepStrictEqual(result.theme, { id: "c60c7ba6-024b-46b5-bb0f-586383d6fc33" })
      }))

    it.effect("should reject population without id", () =>
      Effect.gen(function*() {
        const invalidPopulation = {
          name: "Invalid",
          default: false
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(invalidPopulation).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject population without name", () =>
      Effect.gen(function*() {
        const invalidPopulation = {
          id: "pop-invalid",
          default: false
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(invalidPopulation).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject population without default flag", () =>
      Effect.gen(function*() {
        const invalidPopulation = {
          id: "pop-invalid",
          name: "Invalid"
        }

        const result = yield* Schema.decodeUnknown(PopulationSchema)(invalidPopulation).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))
  })

  describe("ListPopulationsResponseSchema", () => {
    it.effect("should validate empty populations list", () =>
      Effect.gen(function*() {
        const emptyResponse = {
          _embedded: {
            populations: []
          }
        }

        const result = yield* Schema.decodeUnknown(ListPopulationsResponseSchema)(emptyResponse)

        assert.deepStrictEqual(result._embedded.populations, [])
      }))

    it.effect("should validate populations list with count and size", () =>
      Effect.gen(function*() {
        const responseWithMetadata = {
          _embedded: {
            populations: [
              { id: "pop-1", name: "Pop 1", default: false },
              { id: "pop-2", name: "Pop 2", default: true }
            ]
          },
          count: 2,
          size: 2
        }

        const result = yield* Schema.decodeUnknown(ListPopulationsResponseSchema)(responseWithMetadata)

        assert.strictEqual(result.count, 2)
        assert.strictEqual(result.size, 2)
        assert.strictEqual(result._embedded.populations.length, 2)
      }))

    it.effect("should validate populations list with full population objects", () =>
      Effect.gen(function*() {
        const fullResponse = {
          _embedded: {
            populations: [
              {
                id: "pop-full-1",
                name: "Full Pop 1",
                description: "Test description",
                default: false,
                userCount: 100,
                preferredLanguage: "en",
                environment: { id: "env-123" },
                theme: { id: "theme-123" },
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z"
              },
              {
                id: "pop-full-2",
                name: "Full Pop 2",
                default: true,
                userCount: 50,
                passwordPolicy: { id: "policy-123" }
              }
            ]
          },
          count: 2,
          size: 2
        }

        const result = yield* Schema.decodeUnknown(ListPopulationsResponseSchema)(fullResponse)

        assert.strictEqual(result._embedded.populations.length, 2)
        assert.strictEqual(result._embedded.populations[0].userCount, 100)
        assert.strictEqual(result._embedded.populations[1].userCount, 50)
      }))

    it.effect("should reject response without _embedded", () =>
      Effect.gen(function*() {
        const invalidResponse = {
          count: 0,
          size: 0
        }

        const result = yield* Schema.decodeUnknown(ListPopulationsResponseSchema)(invalidResponse).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject response without populations array", () =>
      Effect.gen(function*() {
        const invalidResponse = {
          _embedded: {}
        }

        const result = yield* Schema.decodeUnknown(ListPopulationsResponseSchema)(invalidResponse).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))
  })
})

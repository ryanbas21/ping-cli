import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import * as Schema from "effect/Schema"
import {
  PingOneCreateUserRequest,
  PingOneCreateUserResponse,
  PingOnePopulationSchema,
  PingOneUserNameSchema
} from "./PingOneSchemas"

describe("PingOneSchemas", () => {
  describe("PingOneUserNameSchema", () => {
    it.effect("should validate name with both given and family", () =>
      Effect.gen(function*() {
        const validName = {
          given: "John",
          family: "Doe"
        }

        const result = yield* Schema.decodeUnknown(PingOneUserNameSchema)(validName)

        assert.deepStrictEqual(result, validName)
      }))

    it.effect("should validate name with only given", () =>
      Effect.gen(function*() {
        const validName = {
          given: "John"
        }

        const result = yield* Schema.decodeUnknown(PingOneUserNameSchema)(validName)

        assert.deepStrictEqual(result, validName)
      }))

    it.effect("should validate empty name object", () =>
      Effect.gen(function*() {
        const emptyName = {}

        const result = yield* Schema.decodeUnknown(PingOneUserNameSchema)(emptyName)

        assert.deepStrictEqual(result, emptyName)
      }))
  })

  describe("PingOnePopulationSchema", () => {
    it.effect("should validate population with id", () =>
      Effect.gen(function*() {
        const validPopulation = {
          id: "pop-123"
        }

        const result = yield* Schema.decodeUnknown(PingOnePopulationSchema)(validPopulation)

        assert.deepStrictEqual(result, validPopulation)
      }))

    it.effect("should reject population without id", () =>
      Effect.gen(function*() {
        const invalidPopulation = {}

        const result = yield* Schema.decodeUnknown(PingOnePopulationSchema)(invalidPopulation).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))
  })

  describe("PingOneCreateUserRequest", () => {
    it.effect("should validate minimal user request", () =>
      Effect.gen(function*() {
        const minimalUser = {
          username: "john.doe",
          email: "john@example.com",
          population: {
            id: "pop-123"
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateUserRequest)(minimalUser)

        assert.deepStrictEqual(result, minimalUser)
      }))

    it.effect("should validate full user request with all fields", () =>
      Effect.gen(function*() {
        const fullUser = {
          username: "mary.smith",
          email: "mary@example.com",
          name: {
            given: "Mary",
            family: "Smith"
          },
          population: {
            id: "pop-456"
          },
          department: "Engineering",
          locales: ["Sydney", "London"]
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateUserRequest)(fullUser)

        assert.deepStrictEqual(result, fullUser)
      }))

    it.effect("should reject user without username", () =>
      Effect.gen(function*() {
        const invalidUser = {
          email: "john@example.com",
          population: {
            id: "pop-123"
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateUserRequest)(invalidUser).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject user without email", () =>
      Effect.gen(function*() {
        const invalidUser = {
          username: "john.doe",
          population: {
            id: "pop-123"
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateUserRequest)(invalidUser).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject user without population", () =>
      Effect.gen(function*() {
        const invalidUser = {
          username: "john.doe",
          email: "john@example.com"
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateUserRequest)(invalidUser).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))
  })

  describe("PingOneCreateUserResponse", () => {
    it.effect("should validate valid user response", () =>
      Effect.gen(function*() {
        const validResponse = {
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

        const result = yield* Schema.decodeUnknown(PingOneCreateUserResponse)(validResponse)

        assert.deepStrictEqual(result, validResponse)
      }))

    it.effect("should validate response with optional fields", () =>
      Effect.gen(function*() {
        const responseWithOptionals = {
          id: "user-456",
          environment: { id: "env-456" },
          population: { id: "pop-456" },
          createdAt: "2024-01-01T00:00:00Z",
          email: "mary@example.com",
          enabled: true,
          lifecycle: { status: "ACCOUNT_OK" },
          mfaEnabled: true,
          updatedAt: "2024-01-01T00:00:00Z",
          username: "mary.smith",
          department: "Engineering",
          locales: ["Sydney", "London"]
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateUserResponse)(responseWithOptionals)

        assert.deepStrictEqual(result, responseWithOptionals)
      }))

    it.effect("should reject response missing required id", () =>
      Effect.gen(function*() {
        const invalidResponse = {
          environment: { id: "env-123" },
          population: { id: "pop-123" },
          createdAt: "2024-01-01T00:00:00Z",
          email: "john@example.com",
          enabled: true,
          lifecycle: { status: "ACCOUNT_OK" },
          mfaEnabled: false,
          updatedAt: "2024-01-01T00:00:00Z",
          username: "john.doe"
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateUserResponse)(invalidResponse).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))
  })
})

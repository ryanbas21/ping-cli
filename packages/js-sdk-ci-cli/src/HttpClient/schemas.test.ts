import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import * as Schema from "effect/Schema"
import { GitHubDispatchSchema, PingCIWorkflow, PingPublishWorkflow } from "./schemas.js"

describe("Schemas", () => {
  describe("PingCIWorkflow", () => {
    it.effect("should validate valid CI workflow payload", () =>
      Effect.gen(function*() {
        const validPayload = {
          ref: "main",
          inputs: {
            baseUrl: "https://example.com"
          }
        }

        const result = yield* Schema.decodeUnknown(PingCIWorkflow)(validPayload)

        assert.deepStrictEqual(result, validPayload)
      }))

    it.effect("should validate CI workflow with branch ref", () =>
      Effect.gen(function*() {
        const payload = {
          ref: "feature/new-feature",
          inputs: {
            baseUrl: "http://localhost:8080"
          }
        }

        const result = yield* Schema.decodeUnknown(PingCIWorkflow)(payload)

        assert.deepStrictEqual(result, payload)
      }))

    it.effect("should validate CI workflow with commit SHA", () =>
      Effect.gen(function*() {
        const payload = {
          ref: "abc123def456789",
          inputs: {
            baseUrl: "https://api.example.com/v1"
          }
        }

        const result = yield* Schema.decodeUnknown(PingCIWorkflow)(payload)

        assert.deepStrictEqual(result, payload)
      }))

    it.effect("should reject CI workflow without ref", () =>
      Effect.gen(function*() {
        const invalidPayload = {
          inputs: {
            baseUrl: "https://example.com"
          }
        }

        const result = yield* Schema.decodeUnknown(PingCIWorkflow)(invalidPayload).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject CI workflow without baseUrl", () =>
      Effect.gen(function*() {
        const invalidPayload = {
          ref: "main",
          inputs: {}
        }

        const result = yield* Schema.decodeUnknown(PingCIWorkflow)(invalidPayload).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject CI workflow without inputs", () =>
      Effect.gen(function*() {
        const invalidPayload = {
          ref: "main"
        }

        const result = yield* Schema.decodeUnknown(PingCIWorkflow)(invalidPayload).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject CI workflow with wrong types", () =>
      Effect.gen(function*() {
        const invalidPayload = {
          ref: 123,
          inputs: {
            baseUrl: true
          }
        }

        const result = yield* Schema.decodeUnknown(PingCIWorkflow)(invalidPayload).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))
  })

  describe("PingPublishWorkflow", () => {
    it.effect("should validate empty publish workflow", () =>
      Effect.gen(function*() {
        const payload = {
          inputs: {}
        }

        const result = yield* Schema.decodeUnknown(PingPublishWorkflow)(payload)

        assert.deepStrictEqual(result, payload)
      }))

    it.effect("should validate publish workflow with ref", () =>
      Effect.gen(function*() {
        const payload = {
          inputs: {
            ref: "v1.0.0"
          }
        }

        const result = yield* Schema.decodeUnknown(PingPublishWorkflow)(payload)

        assert.deepStrictEqual(result, payload)
      }))

    it.effect("should validate publish workflow with tag", () =>
      Effect.gen(function*() {
        const payload = {
          inputs: {
            tag: "latest"
          }
        }

        const result = yield* Schema.decodeUnknown(PingPublishWorkflow)(payload)

        assert.deepStrictEqual(result, payload)
      }))

    it.effect("should validate publish workflow with branch", () =>
      Effect.gen(function*() {
        const payload = {
          inputs: {
            branch: "main"
          }
        }

        const result = yield* Schema.decodeUnknown(PingPublishWorkflow)(payload)

        assert.deepStrictEqual(result, payload)
      }))

    it.effect("should validate publish workflow with prerelease", () =>
      Effect.gen(function*() {
        const payload = {
          inputs: {
            prerelease: "beta.1"
          }
        }

        const result = yield* Schema.decodeUnknown(PingPublishWorkflow)(payload)

        assert.deepStrictEqual(result, payload)
      }))

    it.effect("should validate publish workflow with access", () =>
      Effect.gen(function*() {
        const payload = {
          inputs: {
            access: "public"
          }
        }

        const result = yield* Schema.decodeUnknown(PingPublishWorkflow)(payload)

        assert.deepStrictEqual(result, payload)
      }))

    it.effect("should validate publish workflow with all fields", () =>
      Effect.gen(function*() {
        const payload = {
          inputs: {
            ref: "v1.0.0",
            tag: "latest",
            branch: "main",
            prerelease: "beta.1",
            access: "public"
          }
        }

        const result = yield* Schema.decodeUnknown(PingPublishWorkflow)(payload)

        assert.deepStrictEqual(result, payload)
      }))

    it.effect("should reject publish workflow without inputs", () =>
      Effect.gen(function*() {
        const invalidPayload = {}

        const result = yield* Schema.decodeUnknown(PingPublishWorkflow)(invalidPayload).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject publish workflow with wrong types", () =>
      Effect.gen(function*() {
        const invalidPayload = {
          inputs: {
            ref: 123,
            tag: true,
            branch: [],
            prerelease: {},
            access: null
          }
        }

        const result = yield* Schema.decodeUnknown(PingPublishWorkflow)(invalidPayload).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))
  })

  describe("GitHubDispatchSchema (Union)", () => {
    it.effect("should validate CI workflow variant", () =>
      Effect.gen(function*() {
        const ciPayload = {
          ref: "main",
          inputs: {
            baseUrl: "https://example.com"
          }
        }

        const result = yield* Schema.decodeUnknown(GitHubDispatchSchema)(ciPayload)

        assert.deepStrictEqual(result, ciPayload)
      }))

    it.effect("should validate Publish workflow variant", () =>
      Effect.gen(function*() {
        const publishPayload = {
          inputs: {
            tag: "latest"
          }
        }

        const result = yield* Schema.decodeUnknown(GitHubDispatchSchema)(publishPayload)

        assert.deepStrictEqual(result, publishPayload)
      }))

    it.effect("should validate CI workflow with full structure", () =>
      Effect.gen(function*() {
        const payload = {
          ref: "develop",
          inputs: {
            baseUrl: "http://localhost:3000/api"
          }
        }

        const result = yield* Schema.decodeUnknown(GitHubDispatchSchema)(payload)

        assert.deepStrictEqual(result, payload)
      }))

    it.effect("should validate Publish workflow with multiple fields", () =>
      Effect.gen(function*() {
        const payload = {
          inputs: {
            ref: "v2.0.0",
            tag: "next",
            access: "restricted"
          }
        }

        const result = yield* Schema.decodeUnknown(GitHubDispatchSchema)(payload)

        assert.deepStrictEqual(result, payload)
      }))

    it.effect("should reject completely invalid payloads", () =>
      Effect.gen(function*() {
        const invalidPayload = {
          invalid: "field"
        }

        const result = yield* Schema.decodeUnknown(GitHubDispatchSchema)(invalidPayload).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject null values", () =>
      Effect.gen(function*() {
        const result = yield* Schema.decodeUnknown(GitHubDispatchSchema)(null).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject undefined values", () =>
      Effect.gen(function*() {
        const result = yield* Schema.decodeUnknown(GitHubDispatchSchema)(undefined).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject arrays", () =>
      Effect.gen(function*() {
        const result = yield* Schema.decodeUnknown(GitHubDispatchSchema)([]).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should reject primitives", () =>
      Effect.gen(function*() {
        const result = yield* Schema.decodeUnknown(GitHubDispatchSchema)("string").pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
      }))
  })
})

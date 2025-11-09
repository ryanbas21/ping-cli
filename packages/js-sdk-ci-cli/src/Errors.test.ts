import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import { NoGithubToken, WorkflowDispatchError } from "./Errors.js"

describe("Errors", () => {
  describe("NoGithubToken", () => {
    it.effect("should create error with cause", () =>
      Effect.gen(function*() {
        const error = new NoGithubToken({
          cause: "No Github token provided"
        })

        assert.strictEqual(error._tag, "NoGithubToken")
        assert.strictEqual(error.cause, "No Github token provided")
      }))

    it.effect("should be throwable as Effect", () =>
      Effect.gen(function*() {
        const result = yield* Effect.fail(
          new NoGithubToken({ cause: "Token missing" })
        ).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          assert.isTrue(result.cause.error instanceof NoGithubToken)
          if (result.cause.error instanceof NoGithubToken) {
            assert.strictEqual(result.cause.error.cause, "Token missing")
          }
        }
      }))

    it.effect("should be catchable", () =>
      Effect.gen(function*() {
        const program = Effect.fail(
          new NoGithubToken({ cause: "Missing token" })
        ).pipe(
          Effect.catchTag("NoGithubToken", (error) => Effect.succeed(`Caught: ${error.cause}`))
        )

        const result = yield* program

        assert.strictEqual(result, "Caught: Missing token")
      }))
  })

  describe("WorkflowDispatchError", () => {
    it.effect("should create error with status and message", () =>
      Effect.gen(function*() {
        const error = new WorkflowDispatchError({
          status: 401,
          message: "Unauthorized"
        })

        assert.strictEqual(error._tag, "WorkflowDispatchError")
        assert.strictEqual(error.status, 401)
        assert.strictEqual(error.message, "Unauthorized")
      }))

    it.effect("should support various HTTP status codes", () =>
      Effect.gen(function*() {
        const statusCodes = [400, 401, 403, 404, 422, 500, 502, 503]

        for (const status of statusCodes) {
          const error = new WorkflowDispatchError({
            status,
            message: `Error ${status}`
          })

          assert.strictEqual(error.status, status)
          assert.strictEqual(error.message, `Error ${status}`)
        }
      }))

    it.effect("should be throwable as Effect", () =>
      Effect.gen(function*() {
        const result = yield* Effect.fail(
          new WorkflowDispatchError({
            status: 403,
            message: "Forbidden"
          })
        ).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          assert.isTrue(result.cause.error instanceof WorkflowDispatchError)
          if (result.cause.error instanceof WorkflowDispatchError) {
            assert.strictEqual(result.cause.error.status, 403)
            assert.strictEqual(result.cause.error.message, "Forbidden")
          }
        }
      }))

    it.effect("should be catchable by tag", () =>
      Effect.gen(function*() {
        const program = Effect.fail(
          new WorkflowDispatchError({
            status: 404,
            message: "Not Found"
          })
        ).pipe(
          Effect.catchTag("WorkflowDispatchError", (error) => Effect.succeed(`Status: ${error.status}`))
        )

        const result = yield* program

        assert.strictEqual(result, "Status: 404")
      }))

    it.effect("should preserve error details through pipe operations", () =>
      Effect.gen(function*() {
        const program = Effect.fail(
          new WorkflowDispatchError({
            status: 500,
            message: "Internal Server Error"
          })
        ).pipe(
          Effect.catchTag("WorkflowDispatchError", (error) =>
            Effect.succeed({
              status: error.status,
              message: error.message,
              tag: error._tag
            }))
        )

        const result = yield* program

        assert.deepStrictEqual(result, {
          status: 500,
          message: "Internal Server Error",
          tag: "WorkflowDispatchError"
        })
      }))

    it.effect("should work with Effect.match for error handling", () =>
      Effect.gen(function*() {
        const program = Effect.fail(
          new WorkflowDispatchError({
            status: 401,
            message: "GitHub API request failed with status 401"
          })
        ).pipe(
          Effect.match({
            onFailure: (error) => {
              if (error instanceof WorkflowDispatchError) {
                return `Failed with ${error.status}: ${error.message}`
              }
              return "Unknown error"
            },
            onSuccess: (_value) => "Success"
          })
        )

        const result = yield* program

        assert.strictEqual(result, "Failed with 401: GitHub API request failed with status 401")
      }))
  })
})

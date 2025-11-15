import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import { PingOneApiError, PingOneAuthError, PingOneValidationError } from "./Errors.js"

describe("Errors", () => {
  describe("PingOneAuthError", () => {
    it.effect("should create error with cause", () =>
      Effect.gen(function*() {
        const error = new PingOneAuthError({
          message: "Authentication failed",
          cause: "No PingOne token provided"
        })

        assert.strictEqual(error._tag, "PingOneAuthError")
        assert.strictEqual(error.cause, "No PingOne token provided")
      }))

    it.effect("should be throwable as Effect", () =>
      Effect.gen(function*() {
        const result = yield* Effect.fail(
          new PingOneAuthError({ message: "Authentication failed", cause: "Invalid credentials" })
        ).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error
          assert.strictEqual(error._tag, "PingOneAuthError")
          assert.strictEqual(error.cause, "Invalid credentials")
        }
      }))

    it.effect("should be catchable by tag", () =>
      Effect.gen(function*() {
        const program = Effect.fail(
          new PingOneAuthError({ message: "Authentication failed", cause: "Missing environment ID" })
        ).pipe(
          Effect.catchTag("PingOneAuthError", (error) => Effect.succeed(`Caught: ${error.cause}`))
        )

        const result = yield* program

        assert.strictEqual(result, "Caught: Missing environment ID")
      }))
  })

  describe("PingOneApiError", () => {
    it.effect("should create error with status and message", () =>
      Effect.gen(function*() {
        const error = new PingOneApiError({
          status: 401,
          message: "Unauthorized"
        })

        assert.strictEqual(error._tag, "PingOneApiError")
        assert.strictEqual(error.status, 401)
        assert.strictEqual(error.message, "Unauthorized")
      }))

    it.effect("should support optional error code", () =>
      Effect.gen(function*() {
        const error = new PingOneApiError({
          status: 400,
          message: "Bad Request",
          errorCode: "INVALID_VALUE"
        })

        assert.strictEqual(error._tag, "PingOneApiError")
        assert.strictEqual(error.status, 400)
        assert.strictEqual(error.message, "Bad Request")
        assert.strictEqual(error.errorCode, "INVALID_VALUE")
      }))

    it.effect("should support various HTTP status codes", () =>
      Effect.gen(function*() {
        const statusCodes = [400, 401, 403, 404, 422, 500, 502, 503]

        for (const status of statusCodes) {
          const error = new PingOneApiError({
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
          new PingOneApiError({
            status: 403,
            message: "Forbidden",
            errorCode: "INSUFFICIENT_PERMISSIONS"
          })
        ).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 403)
          assert.strictEqual(error.errorCode, "INSUFFICIENT_PERMISSIONS")
        }
      }))

    it.effect("should be catchable by tag", () =>
      Effect.gen(function*() {
        const program = Effect.fail(
          new PingOneApiError({
            status: 404,
            message: "Not Found"
          })
        ).pipe(
          Effect.catchTag("PingOneApiError", (error) => Effect.succeed(`Status: ${error.status}`))
        )

        const result = yield* program

        assert.strictEqual(result, "Status: 404")
      }))
  })

  describe("PingOneValidationError", () => {
    it.effect("should create error with field and message", () =>
      Effect.gen(function*() {
        const error = new PingOneValidationError({
          field: "email",
          message: "Invalid email format"
        })

        assert.strictEqual(error._tag, "PingOneValidationError")
        assert.strictEqual(error.field, "email")
        assert.strictEqual(error.message, "Invalid email format")
      }))

    it.effect("should support various field validations", () =>
      Effect.gen(function*() {
        const validations = [
          { field: "username", message: "Username cannot be empty" },
          { field: "email", message: "Invalid email format" },
          { field: "password", message: "Password too short" },
          { field: "population", message: "Population ID required" }
        ]

        for (const validation of validations) {
          const error = new PingOneValidationError(validation)

          assert.strictEqual(error.field, validation.field)
          assert.strictEqual(error.message, validation.message)
        }
      }))

    it.effect("should be throwable as Effect", () =>
      Effect.gen(function*() {
        const result = yield* Effect.fail(
          new PingOneValidationError({
            field: "username",
            message: "Username cannot be empty"
          })
        ).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error
          assert.strictEqual(error._tag, "PingOneValidationError")
          assert.strictEqual(error.field, "username")
        }
      }))

    it.effect("should be catchable by tag", () =>
      Effect.gen(function*() {
        const program = Effect.fail(
          new PingOneValidationError({
            field: "email",
            message: "Invalid email format"
          })
        ).pipe(
          Effect.catchTag(
            "PingOneValidationError",
            (error) => Effect.succeed(`Invalid ${error.field}: ${error.message}`)
          )
        )

        const result = yield* program

        assert.strictEqual(result, "Invalid email: Invalid email format")
      }))
  })

  describe("Error composition", () => {
    it.effect("should differentiate between different error types", () =>
      Effect.gen(function*() {
        const authError = new PingOneAuthError({ message: "Auth failed", cause: "No token" })
        const apiError = new PingOneApiError({ status: 404, message: "Not Found" })
        const validationError = new PingOneValidationError({ field: "email", message: "Invalid" })

        assert.strictEqual(authError._tag, "PingOneAuthError")
        assert.strictEqual(apiError._tag, "PingOneApiError")
        assert.strictEqual(validationError._tag, "PingOneValidationError")
      }))

    it.effect("should support selective error handling for PingOne errors", () =>
      Effect.gen(function*() {
        const authProgram = Effect.fail(
          new PingOneAuthError({ message: "Auth error", cause: "No token" })
        ).pipe(
          Effect.catchTag("PingOneAuthError", () => Effect.succeed("Handled Auth"))
        )

        const apiProgram = Effect.fail(
          new PingOneApiError({ status: 500, message: "Server Error" })
        ).pipe(
          Effect.catchTag("PingOneApiError", () => Effect.succeed("Handled API"))
        )

        const validationProgram = Effect.fail(
          new PingOneValidationError({ field: "email", message: "Invalid" })
        ).pipe(
          Effect.catchTag("PingOneValidationError", () => Effect.succeed("Handled Validation"))
        )

        const authResult = yield* authProgram
        const apiResult = yield* apiProgram
        const validationResult = yield* validationProgram

        assert.strictEqual(authResult, "Handled Auth")
        assert.strictEqual(apiResult, "Handled API")
        assert.strictEqual(validationResult, "Handled Validation")
      }))
  })
})

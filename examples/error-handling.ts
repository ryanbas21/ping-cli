/**
 * Example: Error Handling Patterns
 *
 * This example demonstrates various error handling strategies:
 * 1. Catching specific error types
 * 2. Retry with exponential backoff
 * 3. Fallback strategies
 * 4. Error recovery
 */

import { NodeContext, NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Config, Console, Effect, Layer, Schedule } from "effect"
import { PingOneValidationError } from "../src/Errors.js"
import { createPingOneUser, readPingOneUser } from "../src/HttpClient/PingOneClient.js"

/**
 * Example 1: Catching specific error types
 */
const handleSpecificErrors = Effect.gen(function*() {
  const envId = yield* Config.string("PINGONE_ENV_ID")
  const token = yield* Config.string("PINGONE_TOKEN")

  yield* Console.log("=== Example 1: Specific Error Handling ===\n")

  const result = yield* readPingOneUser({
    envId,
    token,
    userId: "nonexistent-user-id"
  }).pipe(
    Effect.catchTag("PingOneApiError", (error) =>
      Effect.gen(function*() {
        if (error.status === 404) {
          yield* Console.log("User not found - this is expected for this example")
          return null
        }
        if (error.status === 401 || error.status === 403) {
          yield* Console.error(`Authentication Error: ${error.status} - ${error.message}`)
          yield* Console.log("Please check your PINGONE_TOKEN environment variable")
          return yield* Effect.fail(error)
        }
        yield* Console.error(`API Error: ${error.status} - ${error.message}`)
        return yield* Effect.fail(error)
      }))
  )

  yield* Console.log(`Result: ${result === null ? "Handled 404 error gracefully" : "User found"}\n`)
})

/**
 * Example 2: Retry with exponential backoff
 */
const retryWithBackoff = Effect.gen(function*() {
  const envId = yield* Config.string("PINGONE_ENV_ID")
  const token = yield* Config.string("PINGONE_TOKEN")
  const populationId = yield* Config.string("PINGONE_POPULATION_ID")

  yield* Console.log("=== Example 2: Retry with Exponential Backoff ===\n")

  let attemptCount = 0

  const createUserWithRetry = createPingOneUser({
    envId,
    token,
    userData: {
      username: "retry.test",
      email: "retry@example.com",
      population: { id: populationId }
    }
  }).pipe(
    Effect.tap(() =>
      Effect.gen(function*() {
        attemptCount++
        yield* Console.log(`Attempt ${attemptCount}...`)
      })
    ),
    Effect.retry({
      times: 3,
      schedule: Schedule.exponential("100 millis")
    }),
    Effect.catchAll((error) =>
      Effect.gen(function*() {
        yield* Console.error(`Failed after ${attemptCount} attempts: ${error._tag}`)
        return yield* Effect.fail(error)
      })
    )
  )

  const user = yield* createUserWithRetry
  yield* Console.log(`✓ User created after ${attemptCount} attempt(s): ${user.id}\n`)

  return user
})

/**
 * Example 3: Fallback strategy
 */
const fallbackStrategy = Effect.gen(function*() {
  const envId = yield* Config.string("PINGONE_ENV_ID")
  const token = yield* Config.string("PINGONE_TOKEN")

  yield* Console.log("=== Example 3: Fallback Strategy ===\n")

  // Try to read a user, fall back to creating if not found
  const userId = "maybe-exists-user-id"

  const user = yield* readPingOneUser({
    envId,
    token,
    userId
  }).pipe(
    Effect.catchTag("PingOneApiError", (error) =>
      Effect.gen(function*() {
        if (error.status === 404) {
          yield* Console.log("User not found, using fallback data...")

          // Return fallback user data
          return {
            id: userId,
            username: "fallback.user",
            email: "fallback@example.com",
            enabled: true,
            mfaEnabled: false,
            environment: { id: envId },
            population: { id: "unknown" },
            lifecycle: { status: "UNKNOWN" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }

        return yield* Effect.fail(error)
      }))
  )

  yield* Console.log(`✓ User retrieved: ${user.username}\n`)
})

/**
 * Example 4: Error recovery with cleanup
 */
const errorRecoveryWithCleanup = Effect.gen(function*() {
  const envId = yield* Config.string("PINGONE_ENV_ID")
  const token = yield* Config.string("PINGONE_TOKEN")
  const populationId = yield* Config.string("PINGONE_POPULATION_ID")

  yield* Console.log("=== Example 4: Error Recovery with Cleanup ===\n")

  const result = yield* Effect.gen(function*() {
    // Simulate a workflow that might fail
    yield* Console.log("Starting workflow...")

    const user = yield* createPingOneUser({
      envId,
      token,
      userData: {
        username: "cleanup.test",
        email: "cleanup@example.com",
        population: { id: populationId }
      }
    })

    yield* Console.log(`User created: ${user.id}`)

    // Simulate validation error
    const emailValid = user.email.includes("@")
    if (!emailValid) {
      yield* Console.log("Validation failed - cleaning up...")
      // In real scenario, you might delete the user here
      return yield* Effect.fail(
        new PingOneValidationError({
          field: "email",
          message: "Invalid email format"
        })
      )
    }

    return user
  }).pipe(
    Effect.catchAll((error) =>
      Effect.gen(function*() {
        const errorTag = "_tag" in error ? String(error._tag) : "Unknown"
        yield* Console.error(`Workflow failed: ${errorTag}`)
        yield* Console.log("Performing cleanup...")

        // Cleanup logic here
        yield* Console.log("Cleanup completed")

        // Decide whether to re-throw or return default value
        return null
      })
    )
  )

  yield* Console.log(`Workflow result: ${result ? "Success" : "Failed but cleaned up"}\n`)
})

/**
 * Example 5: Validation error handling
 */
const validationErrorHandling = Effect.gen(function*() {
  const envId = yield* Config.string("PINGONE_ENV_ID")
  const token = yield* Config.string("PINGONE_TOKEN")
  const populationId = yield* Config.string("PINGONE_POPULATION_ID")

  yield* Console.log("=== Example 5: Validation Error Handling ===\n")

  // Attempt to create user with invalid email
  const result = yield* createPingOneUser({
    envId,
    token,
    userData: {
      username: "invalid.email.user",
      email: "not-an-email", // Invalid email
      population: { id: populationId }
    }
  }).pipe(
    Effect.catchTag("PingOneApiError", (error) =>
      Effect.gen(function*() {
        if (error.status === 422) {
          yield* Console.error("Server-side validation failed:")
          yield* Console.error(`  Status: ${error.status}`)
          yield* Console.error(`  Message: ${error.message}`)
          if (error.errorCode) {
            yield* Console.error(`  Error Code: ${error.errorCode}`)
          }
          yield* Console.log("\nSuggested fix: Ensure email follows format: user@domain.com")
        } else {
          yield* Console.error(`API Error: ${error.status} - ${error.message}`)
        }
        return null
      }))
  )

  yield* Console.log(`Result: ${result ? "User created" : "Validation failed (expected)"}\n`)
})

/**
 * Main program - run all examples
 */
const program = Effect.gen(function*() {
  yield* Console.log("Effect Error Handling Examples\n")
  yield* Console.log("=".repeat(50) + "\n")

  yield* handleSpecificErrors
  yield* retryWithBackoff
  yield* fallbackStrategy
  yield* errorRecoveryWithCleanup
  yield* validationErrorHandling

  yield* Console.log("=".repeat(50))
  yield* Console.log("\nAll examples completed!")
}).pipe(
  Effect.catchAll((error) =>
    Console.error(`\nFatal error: ${"_tag" in error ? error._tag : String(error)}`).pipe(
      Effect.flatMap(() => Effect.fail(error))
    )
  )
)

/**
 * Set up layers and run
 */
const MainLive = Layer.merge(NodeHttpClient.layer, NodeContext.layer)

program.pipe(Effect.provide(MainLive), NodeRuntime.runMain)

/**
 * Example: Create and Verify User Workflow
 *
 * This example demonstrates how to:
 * 1. Create a new user in PingOne
 * 2. Verify the user with a verification code
 * 3. Read the verified user details
 *
 * This workflow is common for user registration flows.
 */

import { NodeContext, NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Config, Console, Effect, Layer } from "effect"
import { createPingOneUser, readPingOneUser, verifyPingOneUser } from "../src/HttpClient/PingOneClient.js"

/**
 * Complete user creation and verification workflow
 */
const createAndVerifyUserWorkflow = Effect.gen(function*() {
  // Get configuration from environment
  const envId = yield* Config.string("PINGONE_ENV_ID")
  const token = yield* Config.string("PINGONE_TOKEN")
  const populationId = yield* Config.string("PINGONE_POPULATION_ID")

  // Step 1: Create the user
  yield* Console.log("Step 1: Creating user...")

  const newUser = yield* createPingOneUser({
    envId,
    token,
    userData: {
      username: "example.user",
      email: "example@test.com",
      population: {
        id: populationId
      },
      name: {
        given: "Example",
        family: "User"
      },
      department: "Engineering"
    }
  })

  yield* Console.log(`✓ User created successfully!`)
  yield* Console.log(`  ID: ${newUser.id}`)
  yield* Console.log(`  Username: ${newUser.username}`)
  yield* Console.log(`  Email: ${newUser.email}`)
  yield* Console.log(`  Status: ${newUser.lifecycle.status}`)

  // Step 2: Simulate receiving verification code
  // In a real application, this would be sent to the user's email
  yield* Console.log("\nStep 2: Verifying user account...")
  yield* Console.log("  (In production, verification code would be sent to user's email)")

  // Example verification code (would be dynamic in production)
  const verificationCode = "123456"

  const verifiedUser = yield* verifyPingOneUser({
    envId,
    token,
    userId: newUser.id,
    verificationData: {
      verificationCode
    }
  })

  yield* Console.log(`✓ User verified successfully!`)
  yield* Console.log(`  Lifecycle Status: ${verifiedUser.lifecycle.status}`)

  // Step 3: Read final user details
  yield* Console.log("\nStep 3: Reading verified user details...")

  const userDetails = yield* readPingOneUser({
    envId,
    token,
    userId: newUser.id
  })

  yield* Console.log(`✓ User details retrieved:`)
  yield* Console.log(`  ID: ${userDetails.id}`)
  yield* Console.log(`  Username: ${userDetails.username}`)
  yield* Console.log(`  Email: ${userDetails.email}`)
  yield* Console.log(`  Enabled: ${userDetails.enabled}`)
  yield* Console.log(`  MFA Enabled: ${userDetails.mfaEnabled}`)
  yield* Console.log(`  Status: ${userDetails.lifecycle.status}`)

  return userDetails
})

/**
 * Main program with error handling
 */
const program = createAndVerifyUserWorkflow.pipe(
  Effect.catchAll((error) =>
    Console.error(`Error in workflow: ${error._tag}`).pipe(
      Effect.flatMap(() => Effect.fail(error))
    )
  )
)

/**
 * Set up layers and run
 */
const layers = Layer.merge(NodeHttpClient.layer, NodeContext.layer)

program.pipe(Effect.provide(layers), NodeRuntime.runMain)

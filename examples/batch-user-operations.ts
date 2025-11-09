/**
 * Example: Batch User Operations
 *
 * This example demonstrates how to:
 * 1. Create multiple users concurrently
 * 2. Update multiple users in batch
 * 3. Handle errors for individual operations
 *
 * This is useful for bulk user provisioning scenarios.
 */

import { NodeContext, NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Config, Console, Effect, Layer } from "effect"
import { createPingOneUser, updatePingOneUser } from "../src/HttpClient/PingOneClient.js"

/**
 * User data for batch creation
 */
const usersToCreate = [
  {
    username: "john.doe",
    email: "john.doe@example.com",
    name: { given: "John", family: "Doe" },
    department: "Engineering"
  },
  {
    username: "jane.smith",
    email: "jane.smith@example.com",
    name: { given: "Jane", family: "Smith" },
    department: "Product"
  },
  {
    username: "bob.wilson",
    email: "bob.wilson@example.com",
    name: { given: "Bob", family: "Wilson" },
    department: "Design"
  }
]

/**
 * Create a single user with error handling
 */
const createUserSafely = (
  envId: string,
  token: string,
  populationId: string,
  userData: typeof usersToCreate[0]
) =>
  Effect.gen(function*() {
    yield* Console.log(`Creating user: ${userData.username}...`)

    const user = yield* createPingOneUser({
      envId,
      token,
      userData: {
        ...userData,
        population: { id: populationId }
      }
    })

    yield* Console.log(`✓ Created: ${user.username} (${user.id})`)

    return user
  }).pipe(
    Effect.catchAll((error) =>
      Console.error(`✗ Failed to create ${userData.username}: ${error}`).pipe(
        Effect.flatMap(() => Effect.succeed(null))
      )
    )
  )

/**
 * Batch create users with concurrency control
 */
const batchCreateUsers = Effect.gen(function*() {
  const envId = yield* Config.string("PINGONE_ENV_ID")
  const token = yield* Config.string("PINGONE_TOKEN")
  const populationId = yield* Config.string("PINGONE_POPULATION_ID")

  yield* Console.log("=== Batch User Creation ===\n")

  // Create users concurrently with concurrency limit
  const results = yield* Effect.all(
    usersToCreate.map((userData) => createUserSafely(envId, token, populationId, userData)),
    { concurrency: 3 } // Limit to 3 concurrent requests
  )

  // Filter out failed creations
  const successfulUsers = results.filter((user) => user !== null)

  yield* Console.log(`\n✓ Successfully created ${successfulUsers.length} out of ${usersToCreate.length} users`)

  return successfulUsers
})

/**
 * Update multiple users with new department
 */
const batchUpdateUsers = (userIds: Array<string>) =>
  Effect.gen(function*() {
    const envId = yield* Config.string("PINGONE_ENV_ID")
    const token = yield* Config.string("PINGONE_TOKEN")

    yield* Console.log("\n=== Batch User Updates ===\n")

    const updateUser = (userId: string) =>
      Effect.gen(function*() {
        yield* Console.log(`Updating user: ${userId}...`)

        const updatedUser = yield* updatePingOneUser({
          envId,
          token,
          userId,
          userData: {
            department: "Updated Department",
            title: "Senior Engineer"
          }
        })

        yield* Console.log(`✓ Updated: ${updatedUser.username} (${updatedUser.id})`)

        return updatedUser
      }).pipe(
        Effect.catchAll((error) =>
          Console.error(`✗ Failed to update ${userId}: ${error}`).pipe(
            Effect.flatMap(() => Effect.succeed(null))
          )
        )
      )

    const results = yield* Effect.all(
      userIds.map((userId) => updateUser(userId)),
      { concurrency: 3 }
    )

    const successfulUpdates = results.filter((user) => user !== null)

    yield* Console.log(`\n✓ Successfully updated ${successfulUpdates.length} out of ${userIds.length} users`)

    return successfulUpdates
  })

/**
 * Main program
 */
const program = Effect.gen(function*() {
  // Create users in batch
  const createdUsers = yield* batchCreateUsers

  if (createdUsers.length === 0) {
    yield* Console.log("\nNo users were created successfully. Exiting.")
    return
  }

  // Extract user IDs
  const userIds = createdUsers.map((user) => user.id)

  // Update users in batch
  yield* batchUpdateUsers(userIds)

  yield* Console.log("\n=== Batch Operations Complete ===")
}).pipe(
  Effect.catchAll((error) =>
    Console.error(`\nFatal error in batch operations: ${error}`).pipe(
      Effect.flatMap(() => Effect.fail(error))
    )
  )
)

/**
 * Set up layers and run
 */
const layers = Layer.merge(NodeHttpClient.layer, NodeContext.layer)

program.pipe(Effect.provide(layers), NodeRuntime.runMain)

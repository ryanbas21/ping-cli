import { Effect } from "effect"
import * as Console from "effect/Console"
import {
  createApplication,
  deleteApplication,
  listApplications,
  readApplication,
  updateApplication
} from "../src/HttpClient/ApplicationClient.js"
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  listGroupMembers,
  listGroups,
  readGroup,
  removeGroupMember,
  updateGroup
} from "../src/HttpClient/GroupClient.js"
import {
  createPopulation,
  deletePopulation,
  listPopulations,
  readPopulation,
  updatePopulation
} from "../src/HttpClient/PopulationClient.js"

const envId = process.env.PINGONE_ENV_ID || ""
const token = process.env.PINGONE_TOKEN || ""

const exampleGroupsWorkflow = Effect.gen(function*() {
  yield* Console.log("=== Groups Management Example ===\n")

  yield* Console.log("1. Creating a new group...")
  const group = yield* createGroup({
    envId,
    token,
    groupData: {
      name: "Engineering Team",
      description: "All engineering team members"
    }
  })
  yield* Console.log(`Created group: ${group.name} (${group.id})\n`)

  yield* Console.log("2. Reading the group...")
  const readGroupResult = yield* readGroup({
    envId,
    token,
    groupId: group.id
  })
  yield* Console.log(`Group name: ${readGroupResult.name}\n`)

  yield* Console.log("3. Listing all groups...")
  const groups = yield* listGroups({
    envId,
    token,
    limit: 10
  })
  yield* Console.log(`Found ${groups._embedded.groups.length} groups\n`)

  yield* Console.log("4. Updating the group...")
  const updatedGroup = yield* updateGroup({
    envId,
    token,
    groupId: group.id,
    groupData: {
      description: "Updated: All engineering team members"
    }
  })
  yield* Console.log(`Updated description: ${updatedGroup.description}\n`)

  yield* Console.log("5. Deleting the group...")
  yield* deleteGroup({
    envId,
    token,
    groupId: group.id
  })
  yield* Console.log("Group deleted successfully\n")
})

const examplePopulationsWorkflow = Effect.gen(function*() {
  yield* Console.log("=== Populations Management Example ===\n")

  yield* Console.log("1. Creating a new population...")
  const population = yield* createPopulation({
    envId,
    token,
    populationData: {
      name: "Customer Users",
      description: "All customer accounts"
    }
  })
  yield* Console.log(`Created population: ${population.name} (${population.id})\n`)

  yield* Console.log("2. Reading the population...")
  const readPopResult = yield* readPopulation({
    envId,
    token,
    populationId: population.id
  })
  yield* Console.log(`Population: ${readPopResult.name}, Default: ${readPopResult.default}\n`)

  yield* Console.log("3. Listing all populations...")
  const populations = yield* listPopulations({
    envId,
    token,
    limit: 10
  })
  yield* Console.log(`Found ${populations.count || populations._embedded.populations.length} populations\n`)

  yield* Console.log("4. Updating the population...")
  const updatedPop = yield* updatePopulation({
    envId,
    token,
    populationId: population.id,
    populationData: {
      name: "Premium Customer Users"
    }
  })
  yield* Console.log(`Updated name: ${updatedPop.name}\n`)

  yield* Console.log("5. Deleting the population...")
  yield* deletePopulation({
    envId,
    token,
    populationId: population.id
  })
  yield* Console.log("Population deleted successfully\n")
})

const exampleApplicationsWorkflow = Effect.gen(function*() {
  yield* Console.log("=== Applications Management Example ===\n")

  yield* Console.log("1. Creating a new application...")
  const app = yield* createApplication({
    envId,
    token,
    applicationData: {
      name: "Customer Portal",
      description: "Main customer-facing application",
      type: "WEB_APP",
      protocol: "OPENID_CONNECT",
      enabled: true
    }
  })
  yield* Console.log(`Created application: ${app.name} (${app.id})\n`)

  yield* Console.log("2. Reading the application...")
  const readAppResult = yield* readApplication({
    envId,
    token,
    applicationId: app.id
  })
  yield* Console.log(
    `Application: ${readAppResult.name}, Type: ${readAppResult.type}, Enabled: ${readAppResult.enabled}\n`
  )

  yield* Console.log("3. Listing all applications...")
  const applications = yield* listApplications({
    envId,
    token,
    limit: 10
  })
  yield* Console.log(`Found ${applications.count || applications._embedded.applications.length} applications\n`)

  yield* Console.log("4. Updating the application...")
  const updatedApp = yield* updateApplication({
    envId,
    token,
    applicationId: app.id,
    applicationData: {
      description: "Updated: Main customer-facing application",
      enabled: false
    }
  })
  yield* Console.log(`Updated enabled status: ${updatedApp.enabled}\n`)

  yield* Console.log("5. Deleting the application...")
  yield* deleteApplication({
    envId,
    token,
    applicationId: app.id
  })
  yield* Console.log("Application deleted successfully\n")
})

// Example of group membership workflow (requires a valid user ID)
// Uncomment and provide a real user ID to test group membership operations
/*
const exampleGroupMembershipWorkflow = Effect.gen(function*() {
  yield* Console.log("=== Group Membership Example ===\n")

  yield* Console.log("Note: This example requires a valid user ID to add to the group.")
  yield* Console.log(
    "For a complete example, first create a user, then use its ID for group membership.\n"
  )

  const userId = "user-example-123"

  yield* Console.log("1. Creating a group...")
  const group = yield* createGroup({
    envId,
    token,
    groupData: {
      name: "Test Group for Membership"
    }
  })

  yield* Console.log(`2. Adding user ${userId} to group...`)
  yield* addGroupMember({
    envId,
    token,
    groupId: group.id,
    userId
  })
  yield* Console.log("User added to group\n")

  yield* Console.log("3. Listing group members...")
  const members = yield* listGroupMembers({
    envId,
    token,
    groupId: group.id,
    limit: 50
  })
  yield* Console.log(`Group has ${members.count || members._embedded.users.length} members\n`)

  yield* Console.log(`4. Removing user ${userId} from group...`)
  yield* removeGroupMember({
    envId,
    token,
    groupId: group.id,
    userId
  })
  yield* Console.log("User removed from group\n")

  yield* Console.log("5. Cleaning up - deleting group...")
  yield* deleteGroup({
    envId,
    token,
    groupId: group.id
  })
  yield* Console.log("Group deleted\n")
})
*/

const main = Effect.gen(function*() {
  if (!envId || !token) {
    return yield* Effect.fail(
      new Error("Please set PINGONE_ENV_ID and PINGONE_TOKEN environment variables")
    )
  }

  yield* exampleGroupsWorkflow
  yield* examplePopulationsWorkflow
  yield* exampleApplicationsWorkflow

  yield* Console.log("\n=== All Examples Completed Successfully! ===")
})

Effect.runPromise(main).catch((error) => {
  console.error("Example failed:", error)
  process.exit(1)
})

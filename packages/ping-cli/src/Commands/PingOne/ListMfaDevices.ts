import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Function from "effect/Function"
import * as EffectString from "effect/String"
import { PingOneValidationError } from "../../Errors.js"
import { listPingOneMfaDevices } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required argument
const userId = Args.text({ name: "userId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional limit
const limit = Options.integer("limit").pipe(Options.withAlias("l"), Options.optional)

/**
 * Command to list MFA devices for a user in PingOne.
 *
 * @since 0.0.1
 */
export const listMfaDevices = Command.make(
  "list_mfa_devices",
  {
    userId,
    environmentId,
    pingoneToken,
    limit
  },
  ({ userId, environmentId, pingoneToken, limit }) =>
    Effect.gen(function*() {
      // Validate userId is not empty
      if (Function.pipe(userId, EffectString.trim, EffectString.isEmpty)) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "userId",
            message: "User ID cannot be empty"
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build optional parameters
      const limitParam = limit._tag === "Some" ? limit.value : undefined

      // Make API call to list MFA devices
      const response = yield* listPingOneMfaDevices({
        envId,
        token,
        userId,
        limit: limitParam
      })

      // Display results
      const devices = response._embedded.devices
      const count = response.count ?? devices.length

      yield* Console.log(`Found ${count} MFA device(s) for user ${userId}`)
      yield* Console.log("")

      for (const device of devices) {
        yield* Console.log(`Device ID: ${device.id}`)
        yield* Console.log(`  Type: ${device.type}`)
        if (device.status) {
          yield* Console.log(`  Status: ${device.status}`)
        }
        if (device.name) {
          yield* Console.log(`  Name: ${device.name}`)
        }
        if (device.nickname) {
          yield* Console.log(`  Nickname: ${device.nickname}`)
        }
        yield* Console.log(`  Created At: ${device.createdAt}`)
        yield* Console.log(`  Updated At: ${device.updatedAt}`)
        yield* Console.log("")
      }

      // Show pagination info if available
      if (response._links?.next) {
        yield* Console.log("More results available. Use --limit to adjust page size.")
      }

      if (count === 0) {
        yield* Console.log("No MFA devices found for this user.")
      }
    })
)

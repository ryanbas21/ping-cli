import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Function from "effect/Function"
import * as EffectString from "effect/String"
import { PingOneValidationError } from "../../Errors.js"
import { deletePingOneMfaDevice } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required arguments
const userId = Args.text({ name: "userId" })
const deviceId = Args.text({ name: "deviceId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to delete an MFA device for a user in PingOne.
 *
 * @since 0.0.1
 */
export const deleteMfaDevice = Command.make(
  "delete_mfa_device",
  {
    userId,
    deviceId,
    environmentId,
    pingoneToken
  },
  ({ userId, deviceId, environmentId, pingoneToken }) =>
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

      // Validate deviceId is not empty
      if (Function.pipe(deviceId, EffectString.trim, EffectString.isEmpty)) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "deviceId",
            message: "Device ID cannot be empty"
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Make API call to delete MFA device
      const response = yield* deletePingOneMfaDevice({
        envId,
        token,
        userId,
        deviceId
      })

      // Display success message
      yield* Console.log("MFA device deleted successfully!")
      yield* Console.log(`Device ID: ${response.id}`)
      yield* Console.log(`Status: ${response.status}`)
    })
)

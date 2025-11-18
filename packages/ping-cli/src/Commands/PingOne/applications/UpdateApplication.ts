/**
 * Command to update an existing PingOne application.
 *
 * @since 0.0.1
 */
import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { PingOneValidationError } from "../../../Errors.js"
import { updateApplication } from "../../../HttpClient/ApplicationClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

const applicationId = Args.text({ name: "applicationId" })

const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)
const name = Options.text("name").pipe(Options.optional)
const description = Options.text("description").pipe(Options.optional)
const enabled = Options.boolean("enabled").pipe(Options.optional)

/**
 * Command to update a PingOne application.
 *
 * @since 0.0.1
 */
export const updateApplicationCommand = Command.make(
  "update_application",
  {
    applicationId,
    environmentId,
    pingoneToken,
    name,
    description,
    enabled
  },
  ({ applicationId, environmentId, pingoneToken, name, description, enabled }) =>
    Effect.gen(function*() {
      if (
        name._tag === "None" &&
        description._tag === "None" &&
        enabled._tag === "None"
      ) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "update",
            message: "At least one field must be provided for update (name, description, or enabled)"
          })
        )
      }

      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      const applicationData: {
        name?: string
        description?: string
        enabled?: boolean
      } = {}

      if (name._tag === "Some") {
        applicationData.name = name.value
      }
      if (description._tag === "Some") {
        applicationData.description = description.value
      }
      if (enabled._tag === "Some") {
        applicationData.enabled = enabled.value
      }

      return yield* updateApplication({ envId, token, applicationId, applicationData }).pipe(
        Effect.flatMap((application) =>
          Console.log(
            `Application updated successfully!\nID: ${application.id}\nName: ${application.name}${
              application.description ? `\nDescription: ${application.description}` : ""
            }\nType: ${application.type}\nProtocol: ${application.protocol}\nEnabled: ${application.enabled}`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to update application: ${error._tag}`))
      )
    })
)

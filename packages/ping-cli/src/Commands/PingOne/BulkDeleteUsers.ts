import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { PingOneValidationError } from "../../Errors.js"
import { bulkDeleteUsers } from "../../HttpClient/BulkOperations.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required arguments
const filePath = Args.file({ name: "filePath", exists: "yes" })

// Required options
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Format option
const format = Options.choice("format", ["csv", "json"]).pipe(
  Options.withAlias("f"),
  Options.withDefault("csv" as "csv" | "json")
)

// Confirm option
const confirm = Options.boolean("confirm").pipe(Options.withDefault(false))

// Dry-run option
const dryRun = Options.boolean("dry-run").pipe(Options.withDefault(false))

// Concurrency option
const concurrency = Options.integer("concurrency").pipe(
  Options.withAlias("c"),
  Options.withDefault(5)
)

/**
 * Command to bulk delete users from a CSV or JSON file containing user IDs.
 *
 * @since 0.0.1
 */
export const bulkDeleteUsersCommand = Command.make(
  "bulk_delete_users",
  {
    filePath,
    environmentId,
    pingoneToken,
    format,
    confirm,
    dryRun,
    concurrency
  },
  ({ filePath, environmentId, pingoneToken, format, confirm, dryRun, concurrency }) =>
    Effect.gen(function*() {
      // Validate file path is not empty
      if (filePath.trim().length === 0) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "filePath",
            message: "File path cannot be empty"
          })
        )
      }

      // Require confirmation unless in dry-run mode
      if (!confirm && !dryRun) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "confirm",
            message:
              "Bulk delete requires --confirm flag to proceed. This operation cannot be undone! (Use --dry-run to preview without deleting)"
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Make API call to bulk delete users
      yield* Console.log(`Deleting users from ${filePath} (format: ${format})...`)
      yield* Console.log("")

      const response = yield* bulkDeleteUsers({
        envId,
        token,
        filePath,
        format,
        dryRun,
        concurrency
      })

      // Display results
      yield* Console.log("Bulk delete completed!")
      yield* Console.log(`Total users: ${response.total}`)
      yield* Console.log(`Successful: ${response.successful}`)
      yield* Console.log(`Failed: ${response.failed}`)
      yield* Console.log("")

      if (response.errors.length > 0) {
        yield* Console.log("Errors:")
        for (const error of response.errors) {
          yield* Console.log(`  User ID ${error.userId}: ${error.error}`)
        }
      }
    })
)

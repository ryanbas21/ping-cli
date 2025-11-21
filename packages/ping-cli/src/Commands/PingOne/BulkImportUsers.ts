/**
 * Command for bulk importing users from CSV or JSON files into PingOne.
 *
 * @since 0.0.1
 */

import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { PingOneValidationError } from "../../Errors.js"
import { bulkImportUsers } from "../../HttpClient/BulkOperations.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required arguments
const filePath = Args.file({ name: "filePath", exists: "yes" })

// Required options
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"), Options.optional)
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Format option
const format = Options.choice("format", ["csv", "json"]).pipe(
  Options.withAlias("f"),
  Options.withDefault("csv" as "csv" | "json")
)

// Dry-run option
const dryRun = Options.boolean("dry-run").pipe(Options.withDefault(false))

// Concurrency option
const concurrency = Options.integer("concurrency").pipe(
  Options.withAlias("c"),
  Options.withDefault(5)
)

/**
 * Command to bulk import users from a CSV or JSON file.
 *
 * @since 0.0.1
 */
export const bulkImportUsersCommand = Command.make(
  "bulk_import_users",
  {
    filePath,
    environmentId,
    pingoneToken,
    format,
    dryRun,
    concurrency
  },
  ({ filePath, environmentId, pingoneToken, format, dryRun, concurrency }) =>
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

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Make API call to bulk import users
      yield* Console.log(`Importing users from ${filePath} (format: ${format})...`)
      yield* Console.log("")

      const response = yield* bulkImportUsers({
        envId,
        token,
        filePath,
        format,
        dryRun,
        concurrency
      })

      // Display results
      yield* Console.log("Bulk import completed!")
      yield* Console.log(`Total users: ${response.total}`)
      yield* Console.log(`Successful: ${response.successful}`)
      yield* Console.log(`Failed: ${response.failed}`)
      yield* Console.log("")

      if (response.errors.length > 0) {
        yield* Console.log("Errors:")
        for (const error of response.errors) {
          yield* Console.log(`  Row ${error.row} (${error.username}): ${error.error}`)
        }
      }
    })
)

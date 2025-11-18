/**
 * Command for bulk exporting PingOne users to CSV or JSON files.
 *
 * @since 0.0.1
 */

import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { PingOneValidationError } from "../../Errors.js"
import { bulkExportUsers } from "../../HttpClient/BulkOperations.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required arguments
const filePath = Args.text({ name: "filePath" })

// Required options
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Format option
const format = Options.choice("format", ["csv", "json"]).pipe(
  Options.withAlias("f"),
  Options.withDefault("csv" as "csv" | "json")
)

// Optional filter
const filter = Options.text("filter").pipe(Options.optional)

// Optional limit
const limit = Options.integer("limit").pipe(Options.withAlias("l"), Options.optional)

/**
 * Command to bulk export users to a CSV or JSON file.
 *
 * @since 0.0.1
 */
export const bulkExportUsersCommand = Command.make(
  "bulk_export_users",
  {
    filePath,
    environmentId,
    pingoneToken,
    format,
    filter,
    limit
  },
  ({ filePath, environmentId, pingoneToken, format, filter, limit }) =>
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

      // Build optional parameters
      const filterParam = filter._tag === "Some" ? filter.value : undefined
      const limitParam = limit._tag === "Some" ? limit.value : undefined

      // Make API call to bulk export users
      yield* Console.log(`Exporting users to ${filePath} (format: ${format})...`)
      yield* Console.log("")

      const response = yield* bulkExportUsers({
        envId,
        token,
        filePath,
        format,
        filter: filterParam,
        limit: limitParam
      })

      // Display success message
      yield* Console.log("Bulk export completed!")
      yield* Console.log(`Exported ${response.exported} users to ${response.filePath}`)
    })
)

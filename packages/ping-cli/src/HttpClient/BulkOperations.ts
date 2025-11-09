/**
 * Bulk Operations for PingOne Users
 *
 * Provides functions for bulk import, export, and delete operations.
 * Uses Effect concurrency for efficient parallel processing.
 *
 * @since 0.0.1
 */
import { FileSystem } from "@effect/platform"
import { Array, Ref, Schema } from "effect"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { createPingOneUser, deletePingOneUser, listPingOneUsers } from "./PingOneClient.js"
import {
  PingOneBulkDeleteResultSchema,
  PingOneBulkDeleteUserSchema,
  PingOneBulkImportResultSchema,
  PingOneBulkImportUserSchema
} from "./PingOneSchemas.js"
import type { BulkDeleteUsersPayload, BulkExportUsersPayload, BulkImportUsersPayload } from "./PingOneTypes.js"

/**
 * TypeScript interface for bulk import user data
 */
interface BulkImportUser {
  readonly username: string
  readonly email: string
  readonly givenName?: string
  readonly familyName?: string
  readonly department?: string
  readonly populationId: string
}

/**
 * TypeScript interface for bulk delete user data
 */
interface BulkDeleteUser {
  readonly userId: string
}

/**
 * Parse CSV line into array of values
 */
const parseCsvLine = (line: string): ReadonlyArray<string> => {
  const values: Array<string> = []
  let currentValue = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === "\"") {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      values.push(currentValue.trim())
      currentValue = ""
    } else {
      currentValue += char
    }
  }

  values.push(currentValue.trim())
  return values
}

/**
 * Parse CSV file content into structured data
 */
const parseCsv = (content: string) =>
  Effect.gen(function*() {
    const lines = content.split("\n").filter((line) => line.trim().length > 0)

    if (lines.length === 0) {
      return yield* Effect.fail(new Error("CSV file is empty"))
    }

    const headerLine = lines[0]
    const headers = parseCsvLine(headerLine)

    const rows = lines.slice(1).map((line, index) => {
      const values = parseCsvLine(line)
      const obj: Record<string, string> = {}

      headers.forEach((header, i) => {
        obj[header] = values[i] || ""
      })

      return { row: index + 2, data: obj }
    })

    return rows
  })

/**
 * Bulk import users from CSV or JSON file
 *
 * @since 0.0.1
 */
export const bulkImportUsers = ({
  envId,
  token,
  filePath,
  format,
  dryRun = false,
  concurrency = 5
}: BulkImportUsersPayload) =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // Read file content
    const content = yield* fs.readFileString(filePath)

    // Parse based on format
    const rawData = format === "json"
      ? yield* Effect.try({
        try: () => JSON.parse(content) as Array<unknown>,
        catch: (error) => new Error(`Failed to parse JSON: ${String(error)}`)
      })
      : yield* parseCsv(content).pipe(
        Effect.map((rows) => rows.map((r) => r.data))
      )

    // Display dry-run mode notification
    if (dryRun) {
      yield* Console.log("🔍 DRY-RUN MODE: No users will be created")
      yield* Console.log("")
    }

    const total = rawData.length
    yield* Console.log(`📊 Processing ${total} users with concurrency ${concurrency}...`)
    yield* Console.log("")

    // Create refs for tracking progress
    const successfulRef = yield* Ref.make(0)
    const failedRef = yield* Ref.make(0)
    const errorsRef = yield* Ref.make<Array<{ row: number; username: string; error: string }>>([])
    const processedRef = yield* Ref.make(0)

    // Process users with controlled concurrency
    yield* Effect.forEach(
      rawData.map((item, index) => ({ item, index })),
      ({ item: rawUser, index }) =>
        Effect.gen(function*() {
          const row = index + 1

          // Validate and decode user data
          const parseResult = yield* Schema.decodeUnknown(PingOneBulkImportUserSchema)(rawUser).pipe(
            Effect.either
          )

          if (parseResult._tag === "Left") {
            yield* Ref.update(failedRef, (n) => n + 1)
            const usernameValue = typeof rawUser === "object" && rawUser !== null && "username" in rawUser
              ? String(rawUser.username)
              : "unknown"
            yield* Ref.update(errorsRef, (errors) =>
              Array.append(errors, {
                row,
                username: usernameValue,
                error: `Validation failed: ${String(parseResult.left)}`
              }))
            yield* Console.log(`❌ Row ${row}: Validation failed for ${usernameValue}`)
            return yield* Effect.void
          }

          // Cast to proper TypeScript interface
          const user = parseResult.right as BulkImportUser

          // Build user data object
          const userData: {
            username: string
            email: string
            population: { id: string }
            name?: { given?: string; family?: string }
            department?: string
          } = {
            username: user.username,
            email: user.email,
            population: { id: user.populationId }
          }

          // Add optional name fields
          if (user.givenName !== undefined) {
            if (!userData.name) {
              userData.name = {}
            }
            userData.name.given = user.givenName
          }

          if (user.familyName !== undefined) {
            if (!userData.name) {
              userData.name = {}
            }
            userData.name.family = user.familyName
          }

          // Add optional department
          if (user.department !== undefined) {
            userData.department = user.department
          }

          // In dry-run mode, skip actual API call
          if (dryRun) {
            yield* Ref.update(successfulRef, (n) => n + 1)
            yield* Console.log(`✓ Row ${row}: Would create user ${user.username} (${user.email})`)
            return yield* Effect.void
          }

          // Create user
          const createResult = yield* createPingOneUser({
            envId,
            token,
            userData
          }).pipe(Effect.either)

          if (createResult._tag === "Left") {
            yield* Ref.update(failedRef, (n) => n + 1)
            const errorMessage = createResult.left instanceof Error
              ? createResult.left.message
              : JSON.stringify(createResult.left)
            yield* Ref.update(errorsRef, (errors) =>
              Array.append(errors, {
                row,
                username: user.username,
                error: errorMessage
              }))
            yield* Console.log(`❌ Row ${row}: Failed to create user ${user.username}`)
          } else {
            yield* Ref.update(successfulRef, (n) => n + 1)
            yield* Console.log(`✅ Row ${row}: Created user ${user.username}`)
          }

          // Update progress counter and show progress
          const processed = yield* Ref.updateAndGet(processedRef, (n) => n + 1)
          if (processed % 10 === 0 || processed === total) {
            const successful = yield* Ref.get(successfulRef)
            const failed = yield* Ref.get(failedRef)
            const percentage = Math.round((processed / total) * 100)
            yield* Console.log(
              `⏳ Progress: ${processed}/${total} (${percentage}%) - ✅ ${successful} succeeded, ❌ ${failed} failed`
            )
          }
        }),
      { concurrency }
    )

    // Get final results
    const successful = yield* Ref.get(successfulRef)
    const failed = yield* Ref.get(failedRef)
    const errors = yield* Ref.get(errorsRef)

    const result = {
      total: rawData.length,
      successful,
      failed,
      errors
    }

    return yield* Schema.decodeUnknown(PingOneBulkImportResultSchema)(result)
  })

/**
 * Bulk export users to CSV or JSON file
 *
 * @since 0.0.1
 */
export const bulkExportUsers = ({ envId, token, filePath, format, filter, limit }: BulkExportUsersPayload) =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // Fetch all users (with pagination if needed)
    const response = yield* listPingOneUsers({
      envId,
      token,
      filter,
      limit
    })

    const users = response._embedded.users

    if (format === "json") {
      // Export as JSON
      const jsonContent = JSON.stringify(users, null, 2)
      yield* fs.writeFileString(filePath, jsonContent)
    } else {
      // Export as CSV
      const headers = ["id", "username", "email", "givenName", "familyName", "department", "enabled", "mfaEnabled"]
      const csvLines = [headers.join(",")]

      for (const user of users) {
        const row = [
          user.id,
          user.username,
          user.email,
          user.name?.given || "",
          user.name?.family || "",
          user.department || "",
          String(user.enabled),
          String(user.mfaEnabled)
        ]
        csvLines.push(row.map((v) => `"${v}"`).join(","))
      }

      const csvContent = csvLines.join("\n")
      yield* fs.writeFileString(filePath, csvContent)
    }

    yield* Console.log(`Exported ${users.length} users to ${filePath}`)

    return {
      exported: users.length,
      filePath,
      format
    }
  })

/**
 * Bulk delete users from CSV or JSON file containing user IDs
 *
 * @since 0.0.1
 */
export const bulkDeleteUsers = ({
  envId,
  token,
  filePath,
  format,
  dryRun = false,
  concurrency = 5
}: BulkDeleteUsersPayload) =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // Read file content
    const content = yield* fs.readFileString(filePath)

    // Parse based on format
    const rawData = format === "json"
      ? yield* Effect.try({
        try: () => JSON.parse(content) as Array<unknown>,
        catch: (error) => new Error(`Failed to parse JSON: ${String(error)}`)
      })
      : yield* parseCsv(content).pipe(
        Effect.map((rows) => rows.map((r) => r.data))
      )

    // Display dry-run mode notification
    if (dryRun) {
      yield* Console.log("🔍 DRY-RUN MODE: No users will be deleted")
      yield* Console.log("")
    }

    const total = rawData.length
    yield* Console.log(`📊 Processing ${total} users for deletion with concurrency ${concurrency}...`)
    yield* Console.log("")

    // Create refs for tracking progress
    const successfulRef = yield* Ref.make(0)
    const failedRef = yield* Ref.make(0)
    const errorsRef = yield* Ref.make<Array<{ userId: string; error: string }>>([])
    const processedRef = yield* Ref.make(0)

    // Process users with controlled concurrency
    yield* Effect.forEach(
      rawData,
      (rawUser) =>
        Effect.gen(function*() {
          // Validate and decode user ID data
          const parseResult = yield* Schema.decodeUnknown(PingOneBulkDeleteUserSchema)(rawUser).pipe(
            Effect.either
          )

          if (parseResult._tag === "Left") {
            yield* Ref.update(failedRef, (n) => n + 1)
            const userIdValue = typeof rawUser === "object" && rawUser !== null && "userId" in rawUser
              ? String(rawUser.userId)
              : "unknown"
            yield* Ref.update(errorsRef, (errors) =>
              Array.append(errors, {
                userId: userIdValue,
                error: `Validation failed: ${String(parseResult.left)}`
              }))
            yield* Console.log(`❌ Validation failed for user ID: ${userIdValue}`)
            return yield* Effect.void
          }

          // Cast to proper TypeScript interface
          const user = parseResult.right as BulkDeleteUser
          const userId = user.userId

          // In dry-run mode, skip actual API call
          if (dryRun) {
            yield* Ref.update(successfulRef, (n) => n + 1)
            yield* Console.log(`✓ Would delete user ${userId}`)
            return yield* Effect.void
          }

          // Delete user
          const deleteResult = yield* deletePingOneUser({
            envId,
            token,
            userId
          }).pipe(Effect.either)

          if (deleteResult._tag === "Left") {
            yield* Ref.update(failedRef, (n) => n + 1)
            const errorMessage = deleteResult.left instanceof Error
              ? deleteResult.left.message
              : JSON.stringify(deleteResult.left)
            yield* Ref.update(errorsRef, (errors) =>
              Array.append(errors, {
                userId,
                error: errorMessage
              }))
            yield* Console.log(`❌ Failed to delete user ${userId}`)
          } else {
            yield* Ref.update(successfulRef, (n) => n + 1)
            yield* Console.log(`✅ Deleted user ${userId}`)
          }

          // Update progress counter and show progress
          const processed = yield* Ref.updateAndGet(processedRef, (n) => n + 1)
          if (processed % 10 === 0 || processed === total) {
            const successful = yield* Ref.get(successfulRef)
            const failed = yield* Ref.get(failedRef)
            const percentage = Math.round((processed / total) * 100)
            yield* Console.log(
              `⏳ Progress: ${processed}/${total} (${percentage}%) - ✅ ${successful} succeeded, ❌ ${failed} failed`
            )
          }
        }),
      { concurrency }
    )

    // Get final results
    const successful = yield* Ref.get(successfulRef)
    const failed = yield* Ref.get(failedRef)
    const errors = yield* Ref.get(errorsRef)

    const result = {
      total: rawData.length,
      successful,
      failed,
      errors
    }

    return yield* Schema.decodeUnknown(PingOneBulkDeleteResultSchema)(result)
  })

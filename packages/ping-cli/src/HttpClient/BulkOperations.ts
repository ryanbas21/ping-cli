/**
 * Bulk Operations for PingOne Users
 *
 * Provides functions for bulk import, export, and delete operations.
 * Uses Effect concurrency for efficient parallel processing.
 *
 * @internal
 * @since 0.0.1
 */
import { FileSystem } from "@effect/platform"
import * as Array from "effect/Array"
import * as Chunk from "effect/Chunk"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Function from "effect/Function"
import * as HashSet from "effect/HashSet"
import * as Number from "effect/Number"
import * as Predicate from "effect/Predicate"
import * as Ref from "effect/Ref"
import * as Schema from "effect/Schema"
import * as EffectString from "effect/String"
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
      values.push(EffectString.trim(currentValue))
      currentValue = ""
    } else {
      currentValue += char
    }
  }

  values.push(EffectString.trim(currentValue))
  return values
}

/**
 * Parse CSV file content into structured data
 */
const parseCsv = (content: string) =>
  Effect.gen(function*() {
    const lines = Function.pipe(
      content.split("\n"),
      Array.filter((line) => !EffectString.isEmpty(EffectString.trim(line)))
    )

    if (lines.length === 0) {
      return yield* Effect.fail(new Error("CSV file is empty"))
    }

    const headerLine = lines[0]
    const headers = parseCsvLine(headerLine)

    const rows = Array.map(Array.drop(lines, 1), (line, index) => {
      const values = parseCsvLine(line)
      const obj: Record<string, string> = {}

      Array.forEach(headers, (header, i) => {
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
    const rawData: ReadonlyArray<unknown> = format === "json"
      ? yield* Schema.decodeUnknown(Schema.parseJson(Schema.Array(Schema.Unknown)))(content).pipe(
        Effect.mapError((error) => new Error(`Failed to parse JSON: ${error.message}`))
      )
      : yield* parseCsv(content).pipe(
        Effect.map((rows) => Array.map(rows, (r) => r.data))
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
    const errorsRef = yield* Ref.make(Chunk.empty<{
      readonly row: number
      readonly username: string
      readonly error: string
      readonly errorType: "validation" | "duplicate"
    }>())
    const processedRef = yield* Ref.make(0)

    // Create sets for tracking unique usernames and emails to prevent duplicates
    const seenUsernames = yield* Ref.make(HashSet.empty<string>())
    const seenEmails = yield* Ref.make(HashSet.empty<string>())

    // Process users with controlled concurrency
    yield* Effect.forEach(
      Array.map(rawData, (item, index) => ({ item, index })),
      ({ item: rawUser, index }) =>
        Effect.gen(function*() {
          const row = index + 1

          // Validate and decode user data
          const validationResult = yield* Schema.decodeUnknown(PingOneBulkImportUserSchema)(rawUser).pipe(
            Effect.either
          )

          if (validationResult._tag === "Left") {
            yield* Ref.update(failedRef, (n) => n + 1)
            const usernameValue = Predicate.isRecord(rawUser) && "username" in rawUser
              ? (Predicate.isString(rawUser.username) ? rawUser.username : "unknown")
              : "unknown"
            yield* Ref.update(errorsRef, (errors) =>
              Chunk.append(errors, {
                row,
                username: usernameValue,
                error: `Validation failed: ${
                  Predicate.isString(validationResult.left)
                    ? validationResult.left
                    : JSON.stringify(validationResult.left)
                }`,
                errorType: "validation" as const
              }))
            yield* Console.log(`❌ Row ${row}: Validation failed for ${usernameValue}`)
            return yield* Effect.void
          }

          const user = validationResult.right as BulkImportUser

          // Check for duplicate username (read-only check)
          const usernameSeenSet = yield* Ref.get(seenUsernames)
          const usernameIsDuplicate = HashSet.has(usernameSeenSet, user.username)

          if (usernameIsDuplicate) {
            yield* Ref.update(failedRef, (n) => n + 1)
            yield* Ref.update(errorsRef, (errors) =>
              Chunk.append(errors, {
                row,
                username: user.username,
                error: `Duplicate username: ${user.username}`,
                errorType: "duplicate" as const
              }))
            yield* Console.log(`❌ Row ${row}: Duplicate username ${user.username}`)
            return yield* Effect.void
          }

          // Check for duplicate email (read-only check)
          const emailSeenSet = yield* Ref.get(seenEmails)
          const emailIsDuplicate = HashSet.has(emailSeenSet, user.email)

          if (emailIsDuplicate) {
            yield* Ref.update(failedRef, (n) => n + 1)
            yield* Ref.update(errorsRef, (errors) =>
              Chunk.append(errors, {
                row,
                username: user.username,
                error: `Duplicate email: ${user.email}`,
                errorType: "duplicate" as const
              }))
            yield* Console.log(`❌ Row ${row}: Duplicate email ${user.email}`)
            return yield* Effect.void
          }

          // Both checks passed - now add to tracking sets
          yield* Ref.update(seenUsernames, (set) => HashSet.add(set, user.username))
          yield* Ref.update(seenEmails, (set) => HashSet.add(set, user.email))

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
          yield* createPingOneUser({
            envId,
            token,
            userData
          }).pipe(
            Effect.either,
            Effect.flatMap(
              Either.match({
                onLeft: (error) =>
                  Effect.gen(function*() {
                    yield* Ref.update(failedRef, (n) => n + 1)
                    const errorMessage = Predicate.isError(error)
                      ? error.message
                      : JSON.stringify(error)
                    yield* Ref.update(errorsRef, (errors) =>
                      Chunk.append(errors, {
                        row,
                        username: user.username,
                        error: errorMessage,
                        errorType: "validation" as const
                      }))
                    yield* Console.log(`❌ Row ${row}: Failed to create user ${user.username}`)
                  }),
                onRight: () =>
                  Effect.gen(function*() {
                    yield* Ref.update(successfulRef, (n) => n + 1)
                    yield* Console.log(`✅ Row ${row}: Created user ${user.username}`)
                  })
              })
            )
          )

          // Update progress counter and show progress
          const processed = yield* Ref.updateAndGet(processedRef, (n) => n + 1)
          if (processed % 10 === 0 || processed === total) {
            const successful = yield* Ref.get(successfulRef)
            const failed = yield* Ref.get(failedRef)
            const percentage = Function.pipe(
              processed,
              Number.divide(total),
              (opt) => opt._tag === "Some" ? opt.value : 0,
              Number.multiply(100),
              Number.round(0)
            )
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
    const errorsChunk = yield* Ref.get(errorsRef)

    const result = {
      total: rawData.length,
      successful,
      failed,
      errors: Chunk.toReadonlyArray(errorsChunk)
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
      const csvLines = [Array.join(headers, ",")]

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
        csvLines.push(Array.join(Array.map(row, (v) => `"${v}"`), ","))
      }

      const csvContent = Array.join(csvLines, "\n")
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
    const rawData: ReadonlyArray<unknown> = format === "json"
      ? yield* Schema.decodeUnknown(Schema.parseJson(Schema.Array(Schema.Unknown)))(content).pipe(
        Effect.mapError((error) => new Error(`Failed to parse JSON: ${error.message}`))
      )
      : yield* parseCsv(content).pipe(
        Effect.map((rows) => Array.map(rows, (r) => r.data))
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
    const errorsRef = yield* Ref.make(Chunk.empty<{
      readonly userId: string
      readonly error: string
    }>())
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
            const userIdValue = Predicate.isRecord(rawUser) && "userId" in rawUser
              ? (Predicate.isString(rawUser.userId) ? rawUser.userId : "unknown")
              : "unknown"
            yield* Ref.update(errorsRef, (errors) =>
              Chunk.append(errors, {
                userId: userIdValue,
                error: `Validation failed: ${
                  Predicate.isString(parseResult.left) ? parseResult.left : JSON.stringify(parseResult.left)
                }`
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
          yield* deletePingOneUser({
            envId,
            token,
            userId
          }).pipe(
            Effect.either,
            Effect.flatMap(
              Either.match({
                onLeft: (error) =>
                  Effect.gen(function*() {
                    yield* Ref.update(failedRef, (n) => n + 1)
                    const errorMessage = Predicate.isError(error)
                      ? error.message
                      : JSON.stringify(error)
                    yield* Ref.update(errorsRef, (errors) =>
                      Chunk.append(errors, {
                        userId,
                        error: errorMessage
                      }))
                    yield* Console.log(`❌ Failed to delete user ${userId}`)
                  }),
                onRight: () =>
                  Effect.gen(function*() {
                    yield* Ref.update(successfulRef, (n) => n + 1)
                    yield* Console.log(`✅ Deleted user ${userId}`)
                  })
              })
            )
          )

          // Update progress counter and show progress
          const processed = yield* Ref.updateAndGet(processedRef, (n) => n + 1)
          if (processed % 10 === 0 || processed === total) {
            const successful = yield* Ref.get(successfulRef)
            const failed = yield* Ref.get(failedRef)
            const percentage = Function.pipe(
              processed,
              Number.divide(total),
              (opt) => opt._tag === "Some" ? opt.value : 0,
              Number.multiply(100),
              Number.round(0)
            )
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
    const errorsChunk = yield* Ref.get(errorsRef)

    const result = {
      total: rawData.length,
      successful,
      failed,
      errors: Chunk.toReadonlyArray(errorsChunk)
    }

    return yield* Schema.decodeUnknown(PingOneBulkDeleteResultSchema)(result)
  })

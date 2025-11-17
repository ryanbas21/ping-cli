import { FileSystem } from "@effect/platform"
import { NodeFileSystem, NodePath } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Schema } from "effect"
import { PingOneBulkDeleteUserSchema, PingOneBulkImportUserSchema } from "./PingOneSchemas.js"

const TestLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)

describe("Bulk Operations", () => {
  describe("File Operations", () => {
    it.live("should write and read CSV files", () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-bulk-csv.csv"

        // Create test CSV file
        const csvContent = `username,email,givenName,familyName
testuser1,test1@example.com,Test,User1
testuser2,test2@example.com,Test,User2`

        yield* fs.writeFileString(testFile, csvContent)

        // Read back and verify
        const readContent = yield* fs.readFileString(testFile)
        assert.strictEqual(readContent, csvContent)

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))

    it.live("should write and read JSON files", () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-bulk-json.json"

        // Create test JSON file
        const jsonContent = JSON.stringify(
          [
            {
              username: "testuser1",
              email: "test1@example.com",
              name: { given: "Test", family: "User1" }
            },
            {
              username: "testuser2",
              email: "test2@example.com",
              name: { given: "Test", family: "User2" }
            }
          ],
          null,
          2
        )

        yield* fs.writeFileString(testFile, jsonContent)

        // Read back and verify
        const readContent = yield* fs.readFileString(testFile)
        assert.strictEqual(readContent, jsonContent)

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))

    it.live("should handle CSV files with quoted fields containing commas", () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-bulk-csv-quoted.csv"

        // CSV with quoted fields containing commas
        const csvContent = `username,email,department
testuser1,test1@example.com,"Engineering, Frontend"
testuser2,test2@example.com,"Sales, West Coast"`

        yield* fs.writeFileString(testFile, csvContent)

        // Read back and verify
        const readContent = yield* fs.readFileString(testFile)
        assert.strictEqual(readContent, csvContent)

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))
  })

  describe("Schema Validation", () => {
    it.effect("should validate valid bulk import user data", () =>
      Effect.gen(function*() {
        const validUser = {
          username: "testuser",
          email: "test@example.com",
          populationId: "pop-123",
          givenName: "Test",
          familyName: "User"
        }

        const result = yield* Schema.decodeUnknown(PingOneBulkImportUserSchema)(validUser)

        assert.strictEqual(result.username, "testuser")
        assert.strictEqual(result.email, "test@example.com")
        assert.strictEqual(result.populationId, "pop-123")
      }))

    it.effect("should validate minimal bulk import user data", () =>
      Effect.gen(function*() {
        const minimalUser = {
          username: "testuser",
          email: "test@example.com",
          populationId: "pop-123"
        }

        const result = yield* Schema.decodeUnknown(PingOneBulkImportUserSchema)(minimalUser)

        assert.strictEqual(result.username, "testuser")
        assert.strictEqual(result.email, "test@example.com")
        assert.strictEqual(result.populationId, "pop-123")
      }))

    it.effect("should fail validation for missing required fields in import user", () =>
      Effect.gen(function*() {
        const invalidUser = {
          username: "testuser"
          // Missing email and populationId
        }

        const result = yield* Schema.decodeUnknown(PingOneBulkImportUserSchema)(invalidUser).pipe(
          Effect.either
        )

        assert.strictEqual(result._tag, "Left")
      }))

    it.effect("should validate bulk delete user data", () =>
      Effect.gen(function*() {
        const validDelete = {
          userId: "user-123"
        }

        const result = yield* Schema.decodeUnknown(PingOneBulkDeleteUserSchema)(validDelete)

        assert.strictEqual(result.userId, "user-123")
      }))

    it.effect("should fail validation for missing userId in delete data", () =>
      Effect.gen(function*() {
        const invalidDelete = {
          id: "user-123" // Wrong field name
        }

        const result = yield* Schema.decodeUnknown(PingOneBulkDeleteUserSchema)(invalidDelete).pipe(
          Effect.either
        )

        assert.strictEqual(result._tag, "Left")
      }))
  })

  describe("Error Handling", () => {
    it.live("should handle reading non-existent files", () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem.FileSystem
        const nonExistentFile = "/tmp/does-not-exist.csv"

        const result = yield* fs.readFileString(nonExistentFile).pipe(Effect.either)

        assert.strictEqual(result._tag, "Left")
      }).pipe(Effect.provide(TestLive)))

    it.live("should handle malformed JSON", () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-malformed.json"

        const malformedJson = `{ "username": "test", invalid }`

        yield* fs.writeFileString(testFile, malformedJson)

        // Verify we can read the file (parsing happens in bulkImportUsers)
        const content = yield* fs.readFileString(testFile)
        assert.isTrue(content.includes("invalid"))

        // Test that Schema parsing fails for malformed JSON
        const parseResult = yield* Schema.decodeUnknown(Schema.parseJson(Schema.Array(Schema.Unknown)))(
          content
        ).pipe(Effect.either)

        assert.strictEqual(parseResult._tag, "Left")

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))

    it.live("should handle JSON that is not an array", () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-not-array.json"

        // Valid JSON but not an array
        const notArrayJson = `{"username": "test", "email": "test@example.com"}`

        yield* fs.writeFileString(testFile, notArrayJson)

        // Test that Schema parsing fails for non-array JSON
        const content = yield* fs.readFileString(testFile)
        const parseResult = yield* Schema.decodeUnknown(Schema.parseJson(Schema.Array(Schema.Unknown)))(
          content
        ).pipe(Effect.either)

        assert.strictEqual(parseResult._tag, "Left")

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))

    it.live("should handle JSON array with invalid primitive values", () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-primitive-array.json"

        // Valid JSON array but contains primitives instead of objects
        const primitiveArrayJson = `[123, "string", true, null]`

        yield* fs.writeFileString(testFile, primitiveArrayJson)

        const content = yield* fs.readFileString(testFile)

        // Schema can parse this as Array<Unknown> since primitives are valid Unknown values
        const parseResult = yield* Schema.decodeUnknown(Schema.parseJson(Schema.Array(Schema.Unknown)))(
          content
        ).pipe(Effect.either)

        // This should succeed - array of primitives is valid Array<Unknown>
        assert.strictEqual(parseResult._tag, "Right")

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))

    it.live("should handle empty files", () =>
      Effect.gen(function*() {
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-empty.csv"

        yield* fs.writeFileString(testFile, "")

        const content = yield* fs.readFileString(testFile)
        assert.strictEqual(content, "")

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))
  })

  describe("Duplicate Detection", () => {
    it.effect("should detect duplicate usernames in concurrent processing", () =>
      Effect.gen(function*() {
        const { bulkImportUsers } = yield* Effect.promise(() => import("./BulkOperations.js"))
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-duplicate-username.csv"

        // CSV with duplicate username
        const csvContent = `username,email,populationId
user1,email1@example.com,pop-123
user2,email2@example.com,pop-123
user1,email3@example.com,pop-123`

        yield* fs.writeFileString(testFile, csvContent)

        const result = yield* bulkImportUsers({
          envId: "test-env",
          token: "test-token",
          filePath: testFile,
          format: "csv",
          dryRun: true,
          concurrency: 5
        }).pipe(Effect.either)

        // Should succeed but with failures for duplicate
        assert.strictEqual(result._tag, "Right")
        if (result._tag === "Right") {
          assert.strictEqual(result.right.total, 3)
          assert.strictEqual(result.right.successful, 2)
          assert.strictEqual(result.right.failed, 1)

          // Check error message and errorType
          const errors = result.right.errors
          assert.strictEqual(errors.length, 1)
          assert.isTrue(errors[0].error.includes("Duplicate username"))
          assert.strictEqual(errors[0].username, "user1")
          assert.strictEqual(errors[0].errorType, "duplicate")
        }

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))

    it.effect("should detect duplicate emails in concurrent processing", () =>
      Effect.gen(function*() {
        const { bulkImportUsers } = yield* Effect.promise(() => import("./BulkOperations.js"))
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-duplicate-email.csv"

        // CSV with duplicate email
        const csvContent = `username,email,populationId
user1,duplicate@example.com,pop-123
user2,unique@example.com,pop-123
user3,duplicate@example.com,pop-123`

        yield* fs.writeFileString(testFile, csvContent)

        const result = yield* bulkImportUsers({
          envId: "test-env",
          token: "test-token",
          filePath: testFile,
          format: "csv",
          dryRun: true,
          concurrency: 5
        }).pipe(Effect.either)

        // Should succeed but with failures for duplicate
        assert.strictEqual(result._tag, "Right")
        if (result._tag === "Right") {
          assert.strictEqual(result.right.total, 3)
          assert.strictEqual(result.right.successful, 2)
          assert.strictEqual(result.right.failed, 1)

          // Check error message and errorType
          const errors = result.right.errors
          assert.strictEqual(errors.length, 1)
          assert.isTrue(errors[0].error.includes("Duplicate email"))
          assert.strictEqual(errors[0].errorType, "duplicate")
        }

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))

    it.effect("should handle multiple duplicates correctly", () =>
      Effect.gen(function*() {
        const { bulkImportUsers } = yield* Effect.promise(() => import("./BulkOperations.js"))
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-multiple-duplicates.csv"

        // CSV with multiple different duplicates
        const csvContent = `username,email,populationId
user1,email1@example.com,pop-123
user2,email2@example.com,pop-123
user1,email3@example.com,pop-123
user3,email2@example.com,pop-123
user4,email4@example.com,pop-123`

        yield* fs.writeFileString(testFile, csvContent)

        const result = yield* bulkImportUsers({
          envId: "test-env",
          token: "test-token",
          filePath: testFile,
          format: "csv",
          dryRun: true,
          concurrency: 5
        }).pipe(Effect.either)

        // Should have 2 failures (duplicate username and duplicate email)
        assert.strictEqual(result._tag, "Right")
        if (result._tag === "Right") {
          assert.strictEqual(result.right.total, 5)
          assert.strictEqual(result.right.successful, 3)
          assert.strictEqual(result.right.failed, 2)
          assert.strictEqual(result.right.errors.length, 2)
        }

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))

    it.effect("should detect duplicate after first row succeeds", () =>
      Effect.gen(function*() {
        const { bulkImportUsers } = yield* Effect.promise(() => import("./BulkOperations.js"))
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-duplicate-after-success.csv"

        // Both rows valid, but duplicate username
        const csvContent = `username,email,populationId
user1,email1@example.com,pop-123
user1,email1-different@example.com,pop-123`

        yield* fs.writeFileString(testFile, csvContent)

        const result = yield* bulkImportUsers({
          envId: "test-env",
          token: "test-token",
          filePath: testFile,
          format: "csv",
          dryRun: true,
          concurrency: 5
        }).pipe(Effect.either)

        // First succeeds, second fails duplicate check
        assert.strictEqual(result._tag, "Right")
        if (result._tag === "Right") {
          assert.strictEqual(result.right.total, 2)
          assert.strictEqual(result.right.successful, 1)
          assert.strictEqual(result.right.failed, 1)
          assert.strictEqual(result.right.errors.length, 1)
          assert.isTrue(result.right.errors[0].error.includes("Duplicate username"))
        }

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))

    it.effect("should have errorType 'validation' for validation failures", () =>
      Effect.gen(function*() {
        const { bulkImportUsers } = yield* Effect.promise(() => import("./BulkOperations.js"))
        const fs = yield* FileSystem.FileSystem
        const testFile = "/tmp/test-validation-errortype.json"

        // JSON with invalid data (missing required fields)
        const jsonContent = JSON.stringify([
          {
            username: "user1",
            email: "email1@example.com",
            populationId: "pop-123"
          },
          {
            username: "user2"
            // Missing email and populationId - should fail validation
          }
        ])

        yield* fs.writeFileString(testFile, jsonContent)

        const result = yield* bulkImportUsers({
          envId: "test-env",
          token: "test-token",
          filePath: testFile,
          format: "json",
          dryRun: true,
          concurrency: 5
        }).pipe(Effect.either)

        // Should have validation failure with errorType 'validation'
        assert.strictEqual(result._tag, "Right")
        if (result._tag === "Right") {
          assert.strictEqual(result.right.total, 2)
          assert.strictEqual(result.right.successful, 1)
          assert.strictEqual(result.right.failed, 1)
          assert.strictEqual(result.right.errors.length, 1)
          assert.strictEqual(result.right.errors[0].errorType, "validation")
        }

        // Cleanup
        yield* fs.remove(testFile)
      }).pipe(Effect.provide(TestLive)))
  })
})

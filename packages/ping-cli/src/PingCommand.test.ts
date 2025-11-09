import { NodeContext, NodeHttpClient } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { PingCli } from "./PingCommand.js"
import { MockServicesLive } from "./test-helpers/TestLayers.js"

/**
 * Smoke tests for the p1-cli application.
 *
 * These tests verify that the CLI can be invoked without crashing.
 * They test the command structure and argument parsing, but don't
 * make actual HTTP requests or require real credentials.
 *
 * For full end-to-end testing with real API calls, use the examples
 * in the examples/ directory with actual credentials.
 */

// Provide minimal layer for CLI commands (won't be used for --help)
const TestLayer = Layer.mergeAll(
  NodeHttpClient.layerUndici,
  NodeContext.layer,
  MockServicesLive
)

describe("PingCommand Smoke Tests", () => {
  describe("Help Command", () => {
    it.effect("should run without error when --help flag provided", () =>
      Effect.gen(function*() {
        // Running with --help should exit successfully and show help
        const result = yield* Effect.exit(PingCli(["--help"]))

        // Help should succeed (exit code 0)
        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should run without error when no arguments provided", () =>
      Effect.gen(function*() {
        // Running with no args should show help
        const result = yield* Effect.exit(PingCli([]))

        // Should succeed (shows help by default)
        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))
  })

  describe("Version Command", () => {
    it.effect("should run without error with --version flag", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["--version"]))

        // Version command should succeed
        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))
  })

  describe("Subcommand Help", () => {
    it.effect("should show help for create_user command", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["create_user", "--help"]))

        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should show help for read_user command", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["read_user", "--help"]))

        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should show help for update_user command", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["update_user", "--help"]))

        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should show help for delete_user command", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["delete_user", "--help"]))

        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should show help for verify_user command", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["verify_user", "--help"]))

        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should show help for groups command", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["groups", "--help"]))

        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should show help for populations command", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["populations", "--help"]))

        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should show help for applications command", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["applications", "--help"]))

        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))
  })

  describe("Error Handling", () => {
    it.effect("should show help for invalid command", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["invalid_command_that_does_not_exist"]))

        // @effect/cli shows help for invalid commands (Success with help output)
        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should show help when required arguments missing for create_user", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["create_user"]))

        // @effect/cli shows help when arguments are missing (Success with help output)
        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))

    it.effect("should show help when required arguments missing for read_user", () =>
      Effect.gen(function*() {
        const result = yield* Effect.exit(PingCli(["read_user"]))

        // @effect/cli shows help when arguments are missing (Success with help output)
        assert.strictEqual(result._tag, "Success")
      }).pipe(Effect.provide(TestLayer)))
  })

  describe("Command Structure Validation", () => {
    it.skip("should accept valid create_user command with all required args - requires HTTP mocking", () =>
      Effect.gen(function*() {
        // NOTE: This test is skipped because it would make actual HTTP requests.
        // The CLI successfully parses arguments but will fail at the HTTP layer.
        //
        // To properly test this, we would need to:
        // 1. Mock the HTTP client layer
        // 2. Provide mock responses for API calls
        // 3. Verify the command reaches the handler
        //
        // For now, argument parsing is covered by other tests,
        // and HTTP client behavior is tested in HttpClient tests.
        const result = yield* Effect.exit(
          PingCli([
            "create_user",
            "testuser",
            "test@example.com",
            "--environment-id",
            "test-env",
            "--population-id",
            "test-pop",
            "--pingone-token",
            "test-token"
          ])
        )

        assert.strictEqual(result._tag, "Failure")
      }).pipe(Effect.provide(TestLayer)))

    it.skip("should accept valid read_user command with all required args - requires HTTP mocking", () =>
      Effect.gen(function*() {
        // NOTE: Same as above - skipped because it requires HTTP mocking
        const result = yield* Effect.exit(
          PingCli([
            "read_user",
            "user-123",
            "--environment-id",
            "test-env",
            "--pingone-token",
            "test-token"
          ])
        )

        assert.strictEqual(result._tag, "Failure")
      }).pipe(Effect.provide(TestLayer)))
  })
})

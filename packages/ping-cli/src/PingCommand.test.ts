import { NodeContext, NodeHttpClient } from "@effect/platform-node"
import { Effect, Layer } from "effect"
import { describe, expect, it } from "vitest"
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
    it("should run without error when --help flag provided", async () => {
      // Running with --help should exit successfully and show help
      const result = await Effect.runPromise(
        PingCli(["--help"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      // Help should succeed (exit code 0)
      expect(result._tag).toBe("Success")
    })

    it("should run without error when no arguments provided", async () => {
      // Running with no args should show help
      const result = await Effect.runPromise(
        PingCli([]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      // Should succeed (shows help by default)
      expect(result._tag).toBe("Success")
    })
  })

  describe("Version Command", () => {
    it("should run without error with --version flag", async () => {
      const result = await Effect.runPromise(
        PingCli(["--version"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      // Version command should succeed
      expect(result._tag).toBe("Success")
    })
  })

  describe("Subcommand Help", () => {
    it("should show help for create_user command", async () => {
      const result = await Effect.runPromise(
        PingCli(["create_user", "--help"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      expect(result._tag).toBe("Success")
    })

    it("should show help for read_user command", async () => {
      const result = await Effect.runPromise(
        PingCli(["read_user", "--help"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      expect(result._tag).toBe("Success")
    })

    it("should show help for update_user command", async () => {
      const result = await Effect.runPromise(
        PingCli(["update_user", "--help"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      expect(result._tag).toBe("Success")
    })

    it("should show help for delete_user command", async () => {
      const result = await Effect.runPromise(
        PingCli(["delete_user", "--help"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      expect(result._tag).toBe("Success")
    })

    it("should show help for verify_user command", async () => {
      const result = await Effect.runPromise(
        PingCli(["verify_user", "--help"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      expect(result._tag).toBe("Success")
    })

    it("should show help for groups command", async () => {
      const result = await Effect.runPromise(
        PingCli(["groups", "--help"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      expect(result._tag).toBe("Success")
    })

    it("should show help for populations command", async () => {
      const result = await Effect.runPromise(
        PingCli(["populations", "--help"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      expect(result._tag).toBe("Success")
    })

    it("should show help for applications command", async () => {
      const result = await Effect.runPromise(
        PingCli(["applications", "--help"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      expect(result._tag).toBe("Success")
    })
  })

  describe("Error Handling", () => {
    it("should show help for invalid command", async () => {
      const result = await Effect.runPromise(
        PingCli(["invalid_command_that_does_not_exist"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      // @effect/cli shows help for invalid commands (Success with help output)
      expect(result._tag).toBe("Success")
    })

    it("should show help when required arguments missing for create_user", async () => {
      const result = await Effect.runPromise(
        PingCli(["create_user"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      // @effect/cli shows help when arguments are missing (Success with help output)
      expect(result._tag).toBe("Success")
    })

    it("should show help when required arguments missing for read_user", async () => {
      const result = await Effect.runPromise(
        PingCli(["read_user"]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      // @effect/cli shows help when arguments are missing (Success with help output)
      expect(result._tag).toBe("Success")
    })
  })

  describe("Command Structure Validation", () => {
    it.skip("should accept valid create_user command with all required args - requires HTTP mocking", async () => {
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
      const result = await Effect.runPromise(
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
        ]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      expect(result._tag).toBe("Failure")
    })

    it.skip("should accept valid read_user command with all required args - requires HTTP mocking", async () => {
      // NOTE: Same as above - skipped because it requires HTTP mocking
      const result = await Effect.runPromise(
        PingCli([
          "read_user",
          "user-123",
          "--environment-id",
          "test-env",
          "--pingone-token",
          "test-token"
        ]).pipe(
          Effect.exit,
          Effect.provide(TestLayer)
        )
      )

      expect(result._tag).toBe("Failure")
    })
  })
})
